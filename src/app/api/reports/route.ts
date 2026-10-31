import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const startPerf = performance.now();
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const customerFilter =
    session.role === "CUSTOMER" ? { customerId: session.id } : {};

  const [
    subscriptionGroups,
    paidInvoiceAgg,
    outstandingInvoiceAgg,
    overdueInvoiceAgg,
    totalCustomerCount,
    totalProductCount,
    recentInvoices,
    recentSubscriptions,
  ] = await Promise.all([
    prisma.subscription.groupBy({
      by: ["status"],
      where: customerFilter,
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { ...customerFilter, status: "PAID" },
      _sum: { totalAmount: true, taxAmount: true, discountAmount: true },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: {
        ...customerFilter,
        status: { in: ["DRAFT", "CONFIRMED"] },
      },
      _sum: { totalAmount: true, paidAmount: true },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: {
        ...customerFilter,
        status: { in: ["DRAFT", "CONFIRMED"] },
        dueDate: { lt: now },
      },
      _sum: { totalAmount: true, paidAmount: true },
      _count: { _all: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.invoice.findMany({
      where: customerFilter,
      include: {
        customer: { select: { name: true, email: true, company: true } },
        subscription: { select: { code: true } },
      },
      orderBy: { issueDate: "desc" },
      take: 8,
    }),
    prisma.subscription.findMany({
      where: customerFilter,
      include: {
        customer: { select: { name: true, email: true, company: true } },
        plan: { select: { name: true, interval: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const statusBreakdown: Record<string, { count: number; value: number }> = {
    DRAFT: { count: 0, value: 0 },
    QUOTATION: { count: 0, value: 0 },
    CONFIRMED: { count: 0, value: 0 },
    ACTIVE: { count: 0, value: 0 },
    PAUSED: { count: 0, value: 0 },
    CLOSED: { count: 0, value: 0 },
  };

  let totalSubscriptions = 0;
  for (const g of subscriptionGroups) {
    statusBreakdown[g.status] = {
      count: g._count._all,
      value: Number((g._sum.totalAmount || 0).toFixed(2)),
    };
    totalSubscriptions += g._count._all;
  }

  const collectedRevenue = Number((paidInvoiceAgg._sum.totalAmount || 0).toFixed(2));
  const outstandingAmount = Number(
    (
      (outstandingInvoiceAgg._sum.totalAmount || 0) -
      (outstandingInvoiceAgg._sum.paidAmount || 0)
    ).toFixed(2)
  );
  const overdueAmount = Number(
    (
      (overdueInvoiceAgg._sum.totalAmount || 0) -
      (overdueInvoiceAgg._sum.paidAmount || 0)
    ).toFixed(2)
  );

  const queryTimeMs = Number((performance.now() - startPerf).toFixed(2));

  return NextResponse.json({
    metrics: {
      collectedRevenue,
      paidInvoiceCount: paidInvoiceAgg._count._all,
      totalTaxCollected: Number((paidInvoiceAgg._sum.taxAmount || 0).toFixed(2)),
      totalDiscountsGiven: Number((paidInvoiceAgg._sum.discountAmount || 0).toFixed(2)),
      activeSubscriptions: statusBreakdown.ACTIVE?.count || 0,
      activeRecurringValue: statusBreakdown.ACTIVE?.value || 0,
      totalSubscriptions,
      outstandingInvoicesCount: outstandingInvoiceAgg._count._all,
      outstandingAmount,
      overdueInvoicesCount: overdueInvoiceAgg._count._all,
      overdueAmount,
      totalCustomers: totalCustomerCount,
      totalProducts: totalProductCount,
      queryTimeMs,
    },
    statusBreakdown,
    recentInvoices,
    recentSubscriptions,
  });
}
