
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getGopayApiUrl } from "@/lib/gopay";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  const user = await getSessionUser(req);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { payment_id: paymentId },
    select: { qris_id: true, status: true, order: { select: { user_id: true } } },
  });

  if (!payment) {
    return new Response("Not found", { status: 404 });
  }

  if (payment.order.user_id !== user.id && user.role !== "admin" && user.role !== "superadmin") {
    return new Response("Forbidden", { status: 403 });
  }

  if (!payment.qris_id || payment.status !== "MENUNGGU") {
    return new Response("No active QRIS", { status: 400 });
  }

  const gopayApiUrl = getGopayApiUrl();
  const upstreamUrl = `${gopayApiUrl}/api/qr-events/${payment.qris_id}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false;

      req.signal.addEventListener("abort", () => {
        aborted = true;
        controller.close();
      });

      try {
        const upstream = await fetch(upstreamUrl, {
          signal: req.signal,
          headers: { "Accept": "text/event-stream" },
        });

        if (!upstream.ok || !upstream.body) {
          console.log(`[SSE Proxy] Gateway unreachable for ${paymentId}, status: ${upstream.status}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "PENDING", paid: false, error: "gateway_unavailable" })}\n\n`));
          controller.close();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          controller.enqueue(encoder.encode(chunk));

          if (chunk.includes('"PAID"') && chunk.includes('"paid":true')) {
            try { reader.cancel(); } catch { }
            break;
          }
        }
      } catch (err) {
        if (!aborted) {
          console.error(`[SSE Proxy] Error for ${paymentId}:`, err);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "ERROR", paid: false })}\n\n`));
          } catch { }
        }
      } finally {
        if (!aborted) {
          try { controller.close(); } catch { }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
