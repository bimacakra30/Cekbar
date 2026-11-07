
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { fetchServiceList, flattenServices, getBalance } from "@/lib/ceirid";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiServices = await fetchServiceList();
    const flatServices = flattenServices(apiServices);

    if (flatServices.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada layanan dari API" },
        { status: 400 }
      );
    }

    const upsertOps = flatServices.map((svc) =>
      prisma.service.upsert({
        where: { service_id: svc.serviceId },
        update: {
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
        create: {
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
      })
    );

    await prisma.$transaction(upsertOps);

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
        synced: flatServices.length,
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
