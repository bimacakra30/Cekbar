import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group");
    const category = searchParams.get("category");

    const where: Prisma.ServiceWhereInput = {
      is_active: true,
      category: { not: null },
    };

    if (group && group !== "ALL") {
      where.group_name = group;
    }
    if (category) {
      where.category = category;
    }

    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        service_id: true,
        service_name: true,
        group_name: true,
        category: true,
        sell_price: true,
        time_info: true,
        info: true,
        min_qty: true,
        max_qty: true,
        custom_field_name: true,
        custom_field_regex: true,
        custom_field_maxlen: true,
        allow_bulk: true,
      },
      orderBy: [{ group_name: "asc" }, { service_name: "asc" }],
    });

    const groupRows = await prisma.service.findMany({
      where: { is_active: true },
      select: { group_name: true },
      distinct: ["group_name"],
      orderBy: { group_name: "asc" },
    });

    return NextResponse.json({
      services,
      groups: groupRows.map((g) => g.group_name),
      total: services.length,
    });
  } catch (error) {
    console.error("Get public services error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data layanan" },
      { status: 500 }
    );
  }
}
