import { PageTitle } from "@/components/admin-ui";
import AdminSalesInvoices from "@/components/admin-sales-invoices";

export default function SalesInvoicesPage() {
  return <><PageTitle eyebrow="SALES" title="Sales Invoice" description="Review completed supplies before preparing customer invoices." /><AdminSalesInvoices /></>;
}
