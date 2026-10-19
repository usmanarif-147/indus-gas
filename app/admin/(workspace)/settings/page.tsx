import { PageTitle } from "@/components/admin-ui";
import AdminSettingsManager from "@/components/admin-settings-manager";

export default function SettingsPage() {
  return <><PageTitle eyebrow="ADMINISTRATION" title="Settings" description="Set up expense options, daily fuel rates, and your admin password." /><AdminSettingsManager /></>;
}
