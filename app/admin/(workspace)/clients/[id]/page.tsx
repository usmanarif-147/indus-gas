import AdminClientDetails from "@/components/admin-client-details";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminClientDetails clientId={Number(id)} />;
}
