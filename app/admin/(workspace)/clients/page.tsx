import { PageTitle } from "@/components/admin-ui";
import AdminClientsManager from "@/components/admin-clients-manager";

export default function ClientsPage() { return <><PageTitle eyebrow="CLIENT MANAGEMENT" title="Clients" description="Create confirmed clients, manage their branches, and keep client details accurate." /><AdminClientsManager /></>; }
