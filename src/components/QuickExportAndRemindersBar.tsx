"use client";

import React, { useState } from "react";
import { Download, BellRing, FileSpreadsheet } from "lucide-react";

interface QuickExportAndRemindersBarProps {
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  onNotify: (msg: string, type?: "success" | "error") => void;
  onRefresh: () => void;
}

export default function QuickExportAndRemindersBar({
  role,
  onNotify,
  onRefresh,
}: QuickExportAndRemindersBarProps) {
  const [sendingReminders, setSendingReminders] = useState(false);

  const handleDispatchOverdueReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await fetch("/api/invoices/overdue", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        onNotify(
          `Dispatched overdue payment reminders to ${data.dispatchedCount} account(s).`,
          "success"
        );
        onRefresh();
      } else {
        onNotify(data.error || "Failed to dispatch overdue reminders.", "error");
      }
    } catch {
      onNotify("Network error while dispatching reminders.", "error");
    } finally {
      setSendingReminders(false);
    }
  };

  return (
    <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2.5 text-xs text-slate-600">
        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
        <span className="font-semibold text-slate-800">
          Data Exports & Receivables Automation
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/api/reports/export?type=subscriptions"
          download
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          Export Subscriptions CSV
        </a>
        <a
          href="/api/reports/export?type=invoices"
          download
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          Export Invoices CSV
        </a>
        {(role === "ADMIN" || role === "STAFF") && (
          <button
            type="button"
            disabled={sendingReminders}
            onClick={handleDispatchOverdueReminders}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 text-xs font-bold transition"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-600" />
            {sendingReminders ? "Dispatching..." : "Send Overdue Reminders"}
          </button>
        )}
      </div>
    </div>
  );
}
