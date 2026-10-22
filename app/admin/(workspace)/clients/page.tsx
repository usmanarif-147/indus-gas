import { PageTitle } from "@/components/admin-ui";
import AdminClientsManager from "@/components/admin-clients-manager";

export default function ClientsPage() { return <><PageTitle eyebrow="CLIENT MANAGEMENT" title="Clients" description="Manage parent businesses and their individually named restaurant outlets." /><AdminClientsManager /></>; }
