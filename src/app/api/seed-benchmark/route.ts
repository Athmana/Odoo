import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only Admin can run high-volume benchmark seeding." },
      { status: 403 }
    );
  }

  try {
    const startPerf = performance.now();
    const { count = 1000 } = await request.json().catch(() => ({ count: 1000 }));
    const batchCount = Math.min(2500, Math.max(100, Number(count)));

    const [plan, product, taxRule, customer] = await Promise.all([
      prisma.plan.findFirst({ where: { isActive: true } }),
      prisma.product.findFirst({ where: { isActive: true } }),
      prisma.taxRule.findFirst({ where: { isActive: true } }),
      prisma.user.findFirst({ where: { role: "CUSTOMER" } }),
    ]);

    if (!plan || !product) {
      return NextResponse.json(
        { error: "Ensure at least one product and plan exist before bulk seeding." },
        { status: 400 }
      );
    }

    let targetCustomer = customer;
    if (!targetCustomer) {
      const pwd = await hashPassword("Brightloop@123");
      targetCustomer = await prisma.user.create({
        data: {
          name: "Enterprise Bulk Customer",
          email: `enterprise_${Date.now()}@brightloop.io`,
          passwordHash: pwd,
          role: "CUSTOMER",
          company: "Global Scale Corp",
        },
      });
    }

    const existingSubCount = await prisma.subscription.count();
    const statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "CONFIRMED", "QUOTATION", "PAUSED", "CLOSED"];
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscriptionsData = [];
    for (let i = 0; i < batchCount; i++) {
      const status = statuses[i % statuses.length];
      const subTotal = product.basePrice * plan.priceMultiplier;
      const taxAmt = Number(((subTotal * (taxRule?.rate || 18)) / 100).toFixed(2));
      const totalAmt = Number((subTotal + taxAmt).toFixed(2));

      subscriptionsData.push({
        code: `SUB-BENCH-${existingSubCount + i + 1001}`,
        customerId: targetCustomer.id,
        planId: plan.id,
        status,
        startDate: now,
        nextBillingDate: nextMonth,
        autoRenew: true,
        taxRuleId: taxRule?.id || null,
        subtotal: subTotal,
        discountAmount: 0,
        taxAmount: taxAmt,
        totalAmount: totalAmt,
        notes: "High-volume performance benchmark subscription",
      });
    }

    await prisma.subscription.createMany({
      data: subscriptionsData,
    });

    const elapsedMs = Number((performance.now() - startPerf).toFixed(2));
    const newTotal = await prisma.subscription.count();

    return NextResponse.json({
      inserted: batchCount,
      totalSubscriptions: newTotal,
      elapsedMs,
    });
  } catch (err) {
    console.error("Benchmark seed error:", err);
    return NextResponse.json(
      { error: "Failed to seed benchmark subscriptions." },
      { status: 500 }
    );
  }
}
