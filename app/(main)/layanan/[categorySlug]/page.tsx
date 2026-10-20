
import { ServiceCategoryWrapper } from "./service-category-wrapper";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export default async function ServiceCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  return <ServiceCategoryWrapper categorySlug={categorySlug} />;
}
