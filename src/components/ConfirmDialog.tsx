import React from "react";
import { AlertTriangle } from "lucide-react";
import { useModalA11y } from "../lib/useModalA11y";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Render conditionally: the dialog is mounted only while a confirmation is pending. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useModalA11y(onCancel);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm bg-white dark:bg-[#141417] text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 shadow-2xl"
      >
        <div className="flex items-start gap-3 p-5">
          <div
            className={`p-2 shrink-0 ${destructive ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"}`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 break-words">{message}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-white/10 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white cursor-pointer ${destructive ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
