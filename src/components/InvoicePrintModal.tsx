"use client";

import React from "react";
import { Printer, X, CheckCircle2, Building2, Mail, Phone } from "lucide-react";

export interface PrintableInvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  sentAt?: string | null;
  paidAt?: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string | null;
  customer: {
    name: string;
    email: string;
    company?: string | null;
    phone?: string | null;
  };
  subscription?: {
    code: string;
    plan?: { name: string; interval: string };
    items?: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      product?: { name: string; sku: string };
      variant?: { name: string } | null;
    }>;
  };
  taxRule?: { name: string; rate: number } | null;
  discount?: { name: string; code: string; type: string; value: number } | null;
}

export default function InvoicePrintModal({
  invoice,
  onClose,
}: {
  invoice: PrintableInvoiceData | null;
  onClose: () => void;
}) {
  if (!invoice) return null;

  const balanceDue = Math.max(0, Number((invoice.totalAmount - invoice.paidAmount).toFixed(2)));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Top Action Bar (hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>Invoice Preview — {invoice.invoiceNumber}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                invoice.status === "PAID"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : invoice.status === "CONFIRMED"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600">
                BRIGHTLOOP SOFTWARE INC.
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                TAX INVOICE
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                100 Cloud Avenue, Suite 400 • San Francisco, CA 94107 • billing@brightloop.io
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-lg font-mono font-bold text-slate-900">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
              </div>
              <div className="text-xs text-slate-500">
                Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
              </div>
              {invoice.subscription?.code && (
                <div className="text-xs font-semibold text-blue-700 mt-1">
                  Subscription: {invoice.subscription.code} ({invoice.subscription.plan?.name})
                </div>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Billed To Customer
              </div>
              <div className="text-sm font-bold text-slate-900">
                {invoice.customer.name}
              </div>
              {invoice.customer.company && (
                <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {invoice.customer.company}
                </div>
              )}
              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {invoice.customer.email}
              </div>
              {invoice.customer.phone && (
                <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {invoice.customer.phone}
                </div>
              )}
            </div>

            <div className="sm:text-right flex flex-col justify-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Balance Due
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                ${balanceDue.toFixed(2)}
              </div>
              {invoice.status === "PAID" && (
                <div className="inline-flex items-center sm:justify-end gap-1 text-xs font-semibold text-emerald-600 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Paid in Full (${invoice.paidAmount.toFixed(2)})
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-2.5">Product / Service Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {invoice.subscription?.items && invoice.subscription.items.length > 0 ? (
                  invoice.subscription.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">
                          {item.product?.name || "Subscription Service"}
                        </div>
                        {item.variant && (
                          <div className="text-slate-500 text-[11px]">
                            Variant: {item.variant.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center font-medium">{item.quantity}</td>
                      <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold">
                        ${item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 font-semibold text-slate-900">
                      Recurring Subscription Charge ({invoice.subscription?.code || "Standard"})
                    </td>
                    <td className="py-3 text-center">1</td>
                    <td className="py-3 text-right">${invoice.subtotal.toFixed(2)}</td>
                    <td className="py-3 text-right font-semibold">
                      ${invoice.subtotal.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Discount {invoice.discount ? `(${invoice.discount.code})` : ""}:
                  </span>
                  <span className="font-medium">-${invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>
                  Tax {invoice.taxRule ? `(${invoice.taxRule.name})` : ""}:
                </span>
                <span className="font-medium">+${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Invoice Amount:</span>
                <span>${invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-700">
                  ${invoice.paidAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-blue-700 border-t border-slate-200 pt-2">
                <span>Balance Due:</span>
                <span>${balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Notes: </span>
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
