import { prisma } from "./prisma";

export interface PricingCalculationInput {
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
  }>;
  planId: string;
  taxRuleId?: string | null;
  discountId?: string | null;
  referenceDate?: Date;
}

export interface CalculatedLineItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}

export interface PricingCalculationResult {
  items: CalculatedLineItem[];
  totalQuantity: number;
  subtotal: number;
  appliedDiscountId: string | null;
  appliedDiscountName: string | null;
  discountAmount: number;
  appliedTaxRuleId: string | null;
  appliedTaxRuleName: string | null;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export async function calculateSubscriptionPricing(
  input: PricingCalculationInput
): Promise<PricingCalculationResult> {
  const now = input.referenceDate || new Date();

  const plan = await prisma.plan.findUnique({
    where: { id: input.planId },
  });
  const multiplier = plan?.priceMultiplier ?? 1.0;

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const calculatedItems: CalculatedLineItem[] = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : null;

    const rawUnitPrice = product.basePrice + (variant?.priceDelta ?? 0);
    const rawUnitCost = product.costPrice + (variant?.costDelta ?? 0);

    const unitPrice = Number((rawUnitPrice * multiplier).toFixed(2));
    const unitCost = Number((rawUnitCost * multiplier).toFixed(2));
    const qty = Math.max(1, item.quantity || 1);
    const lineTotal = Number((unitPrice * qty).toFixed(2));

    calculatedItems.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: qty,
      unitPrice,
      unitCost,
      lineTotal,
    });

    subtotal += lineTotal;
    totalQuantity += qty;
  }

  subtotal = Number(subtotal.toFixed(2));

  // Evaluate discount eligibility
  let appliedDiscountId: string | null = null;
  let appliedDiscountName: string | null = null;
  let discountAmount = 0;

  const computeDiscountVal = (d: {
    type: string;
    value: number;
    minPurchaseAmount: number;
    minQuantity: number;
    startDate: Date;
    endDate: Date;
    maxUsageLimit: number;
    currentUsageCount: number;
    isActive: boolean;
  }): number => {
    if (!d.isActive) return 0;
    if (now < d.startDate || now > d.endDate) return 0;
    if (d.currentUsageCount >= d.maxUsageLimit) return 0;
    if (subtotal < d.minPurchaseAmount) return 0;
    if (totalQuantity < d.minQuantity) return 0;

    if (d.type === "PERCENTAGE") {
      return Number(Math.min(subtotal, (subtotal * d.value) / 100).toFixed(2));
    }
    return Number(Math.min(subtotal, d.value).toFixed(2));
  };

  if (input.discountId) {
    const explicitDiscount = await prisma.discount.findUnique({
      where: { id: input.discountId },
    });
    if (explicitDiscount) {
      const val = computeDiscountVal(explicitDiscount);
      if (val > 0) {
        appliedDiscountId = explicitDiscount.id;
        appliedDiscountName = `${explicitDiscount.name} (${explicitDiscount.code})`;
        discountAmount = val;
      }
    }
  }

  // If no explicit discount applied, automatically find the best eligible auto-apply discount!
  if (!appliedDiscountId) {
    const activeDiscounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        autoApply: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    for (const d of activeDiscounts) {
      const val = computeDiscountVal(d);
      if (val > discountAmount) {
        discountAmount = val;
        appliedDiscountId = d.id;
        appliedDiscountName = `${d.name} (${d.code})`;
      }
    }
  }

  const taxableBase = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  // Evaluate tax rule
  let taxRule = null;
  if (input.taxRuleId) {
    taxRule = await prisma.taxRule.findUnique({ where: { id: input.taxRuleId } });
  }
  if (!taxRule) {
    taxRule = await prisma.taxRule.findFirst({
      where: { isActive: true, isDefault: true },
    });
  }
  if (!taxRule) {
    taxRule = await prisma.taxRule.findFirst({
      where: { isActive: true },
    });
  }

  const taxRate = taxRule?.rate ?? 0;
  const taxAmount = Number(((taxableBase * taxRate) / 100).toFixed(2));
  const totalAmount = Number((taxableBase + taxAmount).toFixed(2));

  return {
    items: calculatedItems,
    totalQuantity,
    subtotal,
    appliedDiscountId,
    appliedDiscountName,
    discountAmount,
    appliedTaxRuleId: taxRule?.id ?? null,
    appliedTaxRuleName: taxRule?.name ?? null,
    taxRate,
    taxAmount,
    totalAmount,
  };
}

export function computeNextBillingDate(
  currentDate: Date,
  interval: string,
  intervalCount: number = 1
): Date {
  const next = new Date(currentDate);
  const count = Math.max(1, intervalCount);
  switch (interval.toUpperCase()) {
    case "DAILY":
      next.setDate(next.getDate() + count);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + count * 7);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + count);
      break;
    case "MONTHLY":
    default:
      next.setMonth(next.getMonth() + count);
      break;
  }
  return next;
}
