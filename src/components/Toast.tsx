"use client";

import { useStore } from "@/context/StoreProvider";

export default function Toast() {
  const { toast } = useStore();
  return (
    <div className="toast" role="status" aria-live="polite" hidden={!toast}>
      {toast && (
        <>
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" onClick={toast.action.run}>
              {toast.action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
