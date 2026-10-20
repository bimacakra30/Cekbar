
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createCeirOrder, addRoamer, fetchServiceList } from "@/lib/ceirid";

export async function processOrderAfterPayment(orderId: string) {
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT o.order_id, o.service_id, o.service_name, o.imei_list, o.status,
             s.api_provider, s.api_service_id, s.api_type
      FROM orders o
      LEFT JOIN services s ON s.service_name = o.service_name
      WHERE o.order_id = ${orderId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      console.error(`[ProcessOrder] Order ${orderId} tidak ditemukan`);
      return;
    }

    const order = rows[0];

    if (order.status !== "PENDING") {
      console.log(`[ProcessOrder] Order ${orderId}: status=${order.status}, bukan PENDING → skip`);
      return;
    }

    const apiProvider = String(order.api_provider ?? "");
    const apiServiceId = order.api_service_id ? String(order.api_service_id) : null;
    const apiType = String(order.api_type ?? "");

    if (apiProvider !== "ceir" || !apiServiceId) {
      console.log(`[ProcessOrder] Order ${orderId}: provider="${apiProvider}", bukan CEIR → skip auto-process`);
      return;
    }

    const imeiList: string[] = typeof order.imei_list === "string"
      ? JSON.parse(order.imei_list as string)
      : (order.imei_list as string[]);

    if (apiType === "ceir") {
      console.log(`[ProcessOrder] Order ${orderId}: CEIR cek service_id=${apiServiceId}, ${imeiList.length} IMEI`);

      await prisma.order.update({
        where: { order_id: orderId },
        data: { status: "PROCESSING" },
      });

      const ceirResult = await createCeirOrder({
        service_id: Number(apiServiceId),
        imeis: imeiList,
      });

      await prisma.order.update({
        where: { order_id: orderId },
        data: {
          status: "SUCCESS",
          ceir_order_id: ceirResult.order_id,
          results: {
            ceir_order_id: ceirResult.order_id,
            service_id: Number(apiServiceId),
            result: ceirResult.result as unknown,
            ...(ceirResult.processed !== undefined && { processed: ceirResult.processed }),
            ...(ceirResult.total_potong !== undefined && { total_potong: ceirResult.total_potong }),
            ...(ceirResult.transaction_id !== undefined && { transaction_id: ceirResult.transaction_id }),
          } as unknown as Prisma.InputJsonValue,
          completed_at: new Date(),
        },
      });

      console.log(`[ProcessOrder] Order ${orderId}: CEIR berhasil, ceir_order_id=${ceirResult.order_id}`);
      return;
    }

    if (apiType === "roamer") {
      const imei = imeiList[0];

      console.log(`[ProcessOrder] Order ${orderId}: Add Roamer, service_id=${apiServiceId}, IMEI=${imei}`);

      await prisma.order.update({
        where: { order_id: orderId },
        data: { status: "PROCESSING" },
      });

      const serviceList = await fetchServiceList();
      const roamerService = serviceList.find(s => s.service_id === Number(apiServiceId));

      if (!roamerService) {
        await prisma.order.update({
          where: { order_id: orderId },
          data: {
            status: "FAILED",
            status_note: "Layanan Roamer sedang tidak tersedia di provider",
            results: { error: "SERVICE_UNAVAILABLE" },
          },
        });
        console.error(`[ProcessOrder] Order ${orderId}: Roamer service_id=${apiServiceId} tidak ditemukan di CEIR /services`);
        return;
      }

      const roamerResult = await addRoamer({
        imei,
        service_id: Number(apiServiceId),
        months: roamerService.months,
        expected_price: roamerService.cost,
      });

      await prisma.order.update({
        where: { order_id: orderId },
        data: {
          ceir_order_id: roamerResult.order_id,
          roamer_months: roamerResult.months,
          unit_price: roamerResult.cost,
          status: "PENDING",
          status_note: roamerResult.status_note === "-" ? "Menunggu proses..." : roamerResult.status_note,
        },
      });

      console.log(`[ProcessOrder] Order ${orderId}: Roamer submitted, ceir_order_id=${roamerResult.order_id}, cost=${roamerResult.cost}, status=${roamerResult.order_status}`);
      return;
    }

    console.log(`[ProcessOrder] Order ${orderId}: CEIR api_type="${apiType}" tidak dikenali → skip`);

  } catch (err) {
    const ceirErr = err as Error & { errorCode?: string };
    console.error(`[ProcessOrder] Order ${orderId}: gagal:`, ceirErr.errorCode, ceirErr.message);

    const statusNote = ceirErr.errorCode === "PRICE_CHANGED"
      ? "Harga berubah, order gagal diproses. Silakan coba lagi."
      : `Gagal: ${ceirErr.message}`;

    await prisma.order.update({
      where: { order_id: orderId },
      data: {
        status: "FAILED",
        status_note: statusNote,
        results: { error: ceirErr.message, errorCode: ceirErr.errorCode },
      },
    });
  }
}
