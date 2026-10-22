import AdminClientProfile from "@/components/admin-client-profile";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminClientProfile clientId={Number(id)} />;
}
