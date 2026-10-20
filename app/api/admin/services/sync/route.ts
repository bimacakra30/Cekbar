
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchServiceList, flattenServices, getBalance } from "@/lib/ceirid";

export async function POST() {
  try {
    const apiServices = await fetchServiceList();
    const flatServices = flattenServices(apiServices);

    if (flatServices.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada layanan dari API" },
        { status: 400 }
      );
    }

    let inserted = 0;
    let updated = 0;

    for (const svc of flatServices) {
      const existing = await prisma.service.findUnique({
        where: { service_id: svc.serviceId },
        select: { id: true },
      });

      if (existing) {
        await prisma.service.update({
          where: { service_id: svc.serviceId },
          data: {
            service_name: svc.serviceName,
            group_name: svc.groupName,
            buy_price: svc.buyPrice,
            time_info: svc.timeInfo,
            min_qty: svc.minQty,
            max_qty: svc.maxQty,
            custom_field_name: svc.customFieldName,
            custom_field_regex: svc.customFieldRegex,
            custom_field_maxlen: svc.customFieldMaxlen,
            allow_bulk: svc.allowBulk,
            api_provider: "ceir",
            api_service_id: svc.serviceId,
            api_type: svc.apiType,
            last_synced_at: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.service.create({
          data: {
            service_id: svc.serviceId,
            service_name: svc.serviceName,
            group_name: svc.groupName,
            buy_price: svc.buyPrice,
            time_info: svc.timeInfo,
            info: null,
            min_qty: svc.minQty,
            max_qty: svc.maxQty,
            custom_field_name: svc.customFieldName,
            custom_field_regex: svc.customFieldRegex,
            custom_field_maxlen: svc.customFieldMaxlen,
            allow_bulk: svc.allowBulk,
            api_provider: "ceir",
            api_service_id: svc.serviceId,
            api_type: svc.apiType,
            last_synced_at: new Date(),
          },
        });
        inserted++;
      }
    }

    let accountInfo = null;
    try {
      const balance = await getBalance();
      accountInfo = { credit: String(balance.credit), currency: "IDR" };
    } catch {
    }

    return NextResponse.json({
      message: "Sinkronisasi berhasil",
      summary: {
        totalFromApi: flatServices.length,
        inserted,
        updated,
        unchanged: flatServices.length - inserted - updated,
      },
      account: accountInfo,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Gagal sinkronisasi layanan: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 }
    );
  }
}
