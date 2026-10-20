
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group");
    const search = searchParams.get("search");

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (group && group !== "ALL") {
      conditions.push("group_name = ?");
      params.push(group);
    }
    if (search) {
      conditions.push("(service_name LIKE ? OR service_id LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM services ${whereClause} ORDER BY group_name ASC, service_name ASC`,
      ...params
    );

    const groups = await prisma.service.findMany({
      select: { group_name: true },
      distinct: ["group_name"],
      orderBy: { group_name: "asc" },
    });

    return NextResponse.json({
      services: rows,
      groups: groups.map((g) => g.group_name),
      total: rows.length,
    });
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data layanan" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      service_id: bodyServiceId,
      service_name,
      group_name,
      category = null,
      api_provider = "manual",
      api_service_id = null,
      buy_price = 0,
      sell_price = 0,
      time_info = "",
      info = "",
      is_active = 1,
    } = body;

    if (!service_name?.trim()) {
      return NextResponse.json(
        { error: "Nama layanan wajib diisi" },
        { status: 400 }
      );
    }
    if (!group_name?.trim()) {
      return NextResponse.json(
        { error: "Nama grup wajib diisi" },
        { status: 400 }
      );
    }
    if (bodyServiceId?.trim() && /\s/.test(bodyServiceId.trim())) {
      return NextResponse.json(
        { error: "Service ID tidak boleh mengandung spasi" },
        { status: 400 }
      );
    }

    const service_id = bodyServiceId?.trim()
      ? bodyServiceId.trim()
      : `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newService = await prisma.service.create({
      data: {
        service_id,
        service_name: service_name.trim(),
        group_name: group_name.trim(),
        category: category || null,
        api_provider: api_provider || "manual",
        api_service_id: api_service_id?.trim() || null,
        buy_price: Number(buy_price),
        sell_price: Number(sell_price),
        time_info: time_info || "",
        info: info || "",
        is_active: !!is_active,
      },
    });

    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create service error:", error);
    const prismaError = error as { code?: string };
    const msg = prismaError?.code === "P2002"
      ? "Service ID sudah ada, gunakan ID yang berbeda"
      : "Gagal menambahkan layanan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
