"use client";

import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, X } from "lucide-react";

/** Toast visible duration in milliseconds (3000ms = 3 seconds) */
export const TOAST_DURATION_MS = 3000;

type ToastType = "success" | "error";

function showToast(message: string, type: ToastType) {
  toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
          t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        } ${
          type === "success"
            ? "border-green-200 bg-white text-slate-800"
            : "border-red-200 bg-white text-slate-800"
        }`}
        style={{ minWidth: 280, maxWidth: 360 }}
      >
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
        )}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="ml-1 flex-shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ),
    { duration: TOAST_DURATION_MS }
  );
}

export const showSuccessToast = (message: string) => showToast(message, "success");
export const showErrorToast   = (message: string) => showToast(message, "error");
