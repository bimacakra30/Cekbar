import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createCeirOrder, addRoamer, fetchServiceList } from "@/lib/ceirid";

export async function processOrderAfterPayment(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
      select: {
        order_id: true,
        service_id: true,
        service_name: true,
        imei_list: true,
        status: true,
      },
    });

    if (!order) {
      console.error(`[ProcessOrder] Order ${orderId} tidak ditemukan`);
      return;
    }

    if (order.status !== "PENDING") {
      console.log(`[ProcessOrder] Order ${orderId}: status=${order.status}, bukan PENDING → skip`);
      return;
    }

    const service = await prisma.service.findFirst({
      where: { service_id: order.service_id },
      select: { api_provider: true, api_service_id: true, api_type: true },
    });

    const apiProvider = service?.api_provider ?? "";
    const apiServiceId = service?.api_service_id ?? null;
    const apiType = service?.api_type ?? "";

    // ── Manual order → masuk antrian admin, tidak call API ──
    if (apiProvider === "manual") {
      await prisma.order.update({
        where: { order_id: orderId },
        data: {
          status: "PENDING",
          is_manual_order: true,
          status_note: "Menunggu diproses oleh admin",
        },
      });
      console.log(`[ProcessOrder] Order ${orderId}: Manual order, masuk antrian admin`);
      return;
    }

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
    }).catch((updateErr) => {
      console.error(`[ProcessOrder] Order ${orderId}: gagal update status FAILED:`, updateErr);
    });
  }
}
