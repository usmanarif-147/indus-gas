import FieldAccessGate from "@/components/field-access-gate";
export default function FieldLayout({ children }: { children: React.ReactNode }) { return <FieldAccessGate>{children}</FieldAccessGate>; }
