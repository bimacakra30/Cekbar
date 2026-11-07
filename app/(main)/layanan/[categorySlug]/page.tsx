import prisma from "@/lib/prisma";
import { ServiceCategoryWrapper } from "./service-category-wrapper";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export default async function ServiceCategoryPage({ params }: Props) {
  const { categorySlug } = await params;

  const raw = await prisma.service.findMany({
    where: { category: categorySlug },
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
      is_active: true,
    },
    orderBy: [{ group_name: "asc" }, { service_name: "asc" }],
  });

  const services = raw.map((svc) => ({
    ...svc,
    sell_price: Number(svc.sell_price),
    allow_bulk: svc.allow_bulk ? 1 : 0,
  }));

  return <ServiceCategoryWrapper categorySlug={categorySlug} initialServices={services} />;
}
