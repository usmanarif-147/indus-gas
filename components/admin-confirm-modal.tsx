"use client";

import styles from "./admin-clients-manager.module.css";

export default function AdminConfirmModal({ title, text, confirmLabel = "Delete", onConfirm, onCancel }: { title: string; text: string; confirmLabel?: string; onConfirm: () => Promise<void>; onCancel: () => void }) {
  return <div className={styles.modalBackdrop} role="presentation"><section className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span className={styles.warningMark}>!</span><h2 id="confirm-title">{title}</h2><p>{text}</p><div className={styles.modalActions}><button onClick={onCancel}>Cancel</button><button className={styles.dangerButton} onClick={onConfirm}>{confirmLabel}</button></div></section></div>;
}
