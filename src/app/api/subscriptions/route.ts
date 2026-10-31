import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { calculateSubscriptionPricing, computeNextBillingDate } from "@/lib/pricing-engine";
import { runAutomatedBillingCycle } from "@/lib/billing-engine";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") || 50)));

  const where: Record<string, unknown> = {};
  if (session.role === "CUSTOMER") {
    where.customerId = session.id;
  }
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { email: { contains: search } } },
    ];
  }

  const [subscriptions, totalCount] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        plan: true,
        taxRule: true,
        discount: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, type: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subscription.count({ where }),
  ]);

  return NextResponse.json({
    subscriptions,
    totalCount,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      customerId,
      planId,
      status = "DRAFT",
      items,
      taxRuleId,
      discountId,
      autoRenew = true,
      notes,
      startDate,
    } = body;

    const targetCustomerId =
      session.role === "CUSTOMER" ? session.id : customerId || session.id;

    if (!planId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Plan and at least one product item are required." },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Selected plan not found." }, { status: 404 });
    }

    const pricing = await calculateSubscriptionPricing({
      items,
      planId,
      taxRuleId,
      discountId,
    });

    const count = await prisma.subscription.count();
    const code = `SUB-${String(count + 1001).padStart(4, "0")}`;

    const start = startDate ? new Date(startDate) : new Date();
    const nextBillingDate =
      status === "ACTIVE" || status === "CONFIRMED"
        ? start
        : computeNextBillingDate(start, plan.interval, plan.intervalCount);

    const subscription = await prisma.subscription.create({
      data: {
        code,
        customerId: targetCustomerId,
        planId,
        status,
        startDate: start,
        nextBillingDate,
        autoRenew: Boolean(autoRenew),
        taxRuleId: pricing.appliedTaxRuleId,
        discountId: pricing.appliedDiscountId,
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        notes: notes || null,
        items: {
          create: pricing.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        items: { include: { product: true, variant: true } },
      },
    });

    if (status === "CONFIRMED" || status === "ACTIVE") {
      await runAutomatedBillingCycle(new Date());
    }

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (err) {
    console.error("Create subscription error:", err);
    return NextResponse.json(
      { error: "Failed to create subscription." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, action, status, autoRenew } = await request.json();

    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, items: true },
    });

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    if (session.role === "CUSTOMER" && sub.customerId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    let newStatus = status || sub.status;
    let nextBilling = sub.nextBillingDate;
    let pausedAt = sub.pausedAt;
    let closedAt = sub.closedAt;

    if (action === "SEND_QUOTATION") {
      newStatus = "QUOTATION";
    } else if (action === "CONFIRM") {
      newStatus = "CONFIRMED";
      nextBilling = now;
    } else if (action === "ACTIVATE") {
      newStatus = "ACTIVE";
      if (sub.status === "PAUSED") {
        pausedAt = null;
      } else {
        nextBilling = now;
      }
    } else if (action === "PAUSE") {
      newStatus = "PAUSED";
      pausedAt = now;
    } else if (action === "CLOSE" || action === "CANCEL") {
      newStatus = "CLOSED";
      closedAt = now;
    } else if (action === "RENEW_NOW") {
      newStatus = "ACTIVE";
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          autoRenew: true,
          nextBillingDate: now,
        },
      });
      const billingResult = await runAutomatedBillingCycle(now);
      const refreshed = await prisma.subscription.findUnique({
        where: { id: sub.id },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          plan: true,
          items: { include: { product: true, variant: true } },
        },
      });
      return NextResponse.json({
        subscription: refreshed,
        billingResult,
      });
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        nextBillingDate: nextBilling,
        pausedAt,
        closedAt,
        ...(autoRenew !== undefined ? { autoRenew: Boolean(autoRenew) } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        items: { include: { product: true, variant: true } },
      },
    });

    if (newStatus === "CONFIRMED" || (action === "ACTIVATE" && sub.status !== "PAUSED")) {
      await runAutomatedBillingCycle(now);
    }

    return NextResponse.json({ subscription: updated });
  } catch (err) {
    console.error("Update subscription error:", err);
    return NextResponse.json(
      { error: "Failed to update subscription lifecycle." },
      { status: 500 }
    );
  }
}
