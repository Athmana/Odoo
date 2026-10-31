import { prisma } from "./prisma";
import { calculateSubscriptionPricing, computeNextBillingDate } from "./pricing-engine";

export interface BillingRunSummary {
  processedSubscriptions: number;
  generatedInvoices: number;
  skippedDuplicates: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    subscriptionCode: string;
    totalAmount: number;
  }>;
}

/**
 * Automatically generates due invoices for all ACTIVE (or CONFIRMED) subscriptions
 * whose nextBillingDate <= targetDate.
 * Uses `billingPeriodKey` (Unique constraint) to guarantee ZERO duplicate invoices.
 */
export async function runAutomatedBillingCycle(
  targetDate: Date = new Date()
): Promise<BillingRunSummary> {
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "CONFIRMED"] },
      autoRenew: true,
      nextBillingDate: { lte: targetDate },
    },
    include: {
      plan: true,
      items: true,
    },
  });

  const summary: BillingRunSummary = {
    processedSubscriptions: dueSubscriptions.length,
    generatedInvoices: 0,
    skippedDuplicates: 0,
    invoices: [],
  };

  for (const sub of dueSubscriptions) {
    const periodDateStr = sub.nextBillingDate.toISOString().split("T")[0];
    const billingPeriodKey = `${sub.id}_${periodDateStr}`;

    // Check if an invoice already exists for this exact subscription billing period
    const existing = await prisma.invoice.findUnique({
      where: { billingPeriodKey },
    });

    if (existing) {
      summary.skippedDuplicates++;
      continue;
    }

    // Re-evaluate pricing to automatically apply eligible discounts & active tax rules
    const pricing = await calculateSubscriptionPricing({
      items: sub.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      planId: sub.planId,
      taxRuleId: sub.taxRuleId,
      discountId: sub.discountId,
      referenceDate: targetDate,
    });

    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
      invoiceCount + 1001
    ).padStart(4, "0")}`;

    const dueDate = new Date(targetDate);
    dueDate.setDate(dueDate.getDate() + 14); // Net 14 days due

    const nextDate = computeNextBillingDate(
      sub.nextBillingDate,
      sub.plan.interval,
      sub.plan.intervalCount
    );

    const createdInvoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          billingPeriodKey,
          status: "CONFIRMED",
          issueDate: targetDate,
          dueDate,
          subtotal: pricing.subtotal,
          discountId: pricing.appliedDiscountId,
          discountAmount: pricing.discountAmount,
          taxRuleId: pricing.appliedTaxRuleId,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
          notes: `Automated recurring invoice for ${sub.code} (${sub.plan.name} cycle)`,
        },
      });

      if (pricing.appliedDiscountId) {
        await tx.discount.update({
          where: { id: pricing.appliedDiscountId },
          data: { currentUsageCount: { increment: 1 } },
        });
      }

      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          nextBillingDate: nextDate,
          subtotal: pricing.subtotal,
          discountId: pricing.appliedDiscountId,
          discountAmount: pricing.discountAmount,
          taxRuleId: pricing.appliedTaxRuleId,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
        },
      });

      return inv;
    });

    summary.generatedInvoices++;
    summary.invoices.push({
      id: createdInvoice.id,
      invoiceNumber: createdInvoice.invoiceNumber,
      subscriptionCode: sub.code,
      totalAmount: createdInvoice.totalAmount,
    });
  }

  return summary;
}
