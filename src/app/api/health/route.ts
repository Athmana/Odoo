import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = performance.now();
  const [users, products, plans, subscriptions, invoices, payments] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.plan.count(),
      prisma.subscription.count(),
      prisma.invoice.count(),
      prisma.payment.count(),
    ]);

  const latencyMs = Number((performance.now() - start).toFixed(2));

  return NextResponse.json({
    status: "ok",
    service: "Brightloop Subscription & Recurring Billing Cloud",
    database: "connected",
    latencyMs,
    slaCompliant: latencyMs < 2000,
    counts: {
      users,
      products,
      plans,
      subscriptions,
      invoices,
      payments,
    },
    timestamp: new Date().toISOString(),
  });
}
