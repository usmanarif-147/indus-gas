import { ReactNode } from "react";

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <section className="admin-title"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{action}</section>;
}

export function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="empty-state"><b>{icon}</b><h2>{title}</h2><p>{text}</p></div>;
}
