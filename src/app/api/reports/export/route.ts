import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") || "invoices").toLowerCase();
  const customerFilter =
    session.role === "CUSTOMER" ? { customerId: session.id } : {};

  if (type === "subscriptions") {
    const subs = await prisma.subscription.findMany({
      where: customerFilter,
      include: {
        customer: { select: { name: true, email: true, company: true } },
        plan: { select: { name: true, interval: true } },
        taxRule: { select: { name: true, rate: true } },
        discount: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const headers = [
      "Subscription Code",
      "Customer Name",
      "Customer Email",
      "Company",
      "Plan",
      "Interval",
      "Status",
      "Start Date",
      "Next Billing Date",
      "Subtotal ($)",
      "Discount Code",
      "Discount ($)",
      "Tax Rule",
      "Tax ($)",
      "Total Recurring ($)",
    ];

    const rows = subs.map((s) =>
      [
        s.code,
        s.customer.name,
        s.customer.email,
        s.customer.company || "",
        s.plan.name,
        s.plan.interval,
        s.status,
        s.startDate.toISOString().split("T")[0],
        s.nextBillingDate.toISOString().split("T")[0],
        s.subtotal.toFixed(2),
        s.discount?.code || "",
        s.discountAmount.toFixed(2),
        s.taxRule ? `${s.taxRule.name} (${s.taxRule.rate}%)` : "",
        s.taxAmount.toFixed(2),
        s.totalAmount.toFixed(2),
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="brightloop_subscriptions_${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  }

  // Default: Invoices Ledger CSV Export
  const invoices = await prisma.invoice.findMany({
    where: customerFilter,
    include: {
      customer: { select: { name: true, email: true, company: true } },
      subscription: { select: { code: true } },
      taxRule: { select: { name: true, rate: true } },
      discount: { select: { code: true } },
    },
    orderBy: { issueDate: "desc" },
    take: 1000,
  });

  const headers = [
    "Invoice Number",
    "Subscription Code",
    "Customer Name",
    "Customer Email",
    "Company",
    "Status",
    "Issue Date",
    "Due Date",
    "Subtotal ($)",
    "Discount Code",
    "Discount ($)",
    "Tax Rule",
    "Tax ($)",
    "Total Amount ($)",
    "Paid Amount ($)",
    "Balance Due ($)",
  ];

  const rows = invoices.map((inv) => {
    const balance = Math.max(0, Number((inv.totalAmount - inv.paidAmount).toFixed(2)));
    return [
      inv.invoiceNumber,
      inv.subscription.code,
      inv.customer.name,
      inv.customer.email,
      inv.customer.company || "",
      inv.status,
      inv.issueDate.toISOString().split("T")[0],
      inv.dueDate.toISOString().split("T")[0],
      inv.subtotal.toFixed(2),
      inv.discount?.code || "",
      inv.discountAmount.toFixed(2),
      inv.taxRule ? `${inv.taxRule.name} (${inv.taxRule.rate}%)` : "",
      inv.taxAmount.toFixed(2),
      inv.totalAmount.toFixed(2),
      inv.paidAmount.toFixed(2),
      balance.toFixed(2),
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="brightloop_invoices_${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
