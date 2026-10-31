import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Brightloop Software platform...");

  const passwordHash = await bcrypt.hash("Brightloop@123", 10);

  // 1. Users (Admin, Staff, Customers)
  const admin = await prisma.user.upsert({
    where: { email: "admin@brightloop.io" },
    update: {},
    create: {
      name: "Aarav Mehta (Admin)",
      email: "admin@brightloop.io",
      passwordHash,
      role: "ADMIN",
      company: "Brightloop Software HQ",
      phone: "+1-555-0100",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@brightloop.io" },
    update: {},
    create: {
      name: "Priya Sharma (Billing Staff)",
      email: "staff@brightloop.io",
      passwordHash,
      role: "STAFF",
      company: "Brightloop Operations",
      phone: "+1-555-0101",
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: "customer@acme.com" },
    update: {},
    create: {
      name: "Rohan Verma",
      email: "customer@acme.com",
      passwordHash,
      role: "CUSTOMER",
      company: "Acme Cloud Logistics",
      phone: "+1-555-0201",
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "finance@novahealth.io" },
    update: {},
    create: {
      name: "Elena Rostova",
      email: "finance@novahealth.io",
      passwordHash,
      role: "CUSTOMER",
      company: "NovaHealth Systems",
      phone: "+1-555-0202",
    },
  });

  const customer3 = await prisma.user.upsert({
    where: { email: "ops@zenithretail.com" },
    update: {},
    create: {
      name: "Marcus Vance",
      email: "ops@zenithretail.com",
      passwordHash,
      role: "CUSTOMER",
      company: "Zenith Global Retail",
      phone: "+1-555-0203",
    },
  });

  // 2. Products & Variants
  const prodCRM = await prisma.product.upsert({
    where: { sku: "BL-CRM-CORE" },
    update: {},
    create: {
      name: "Brightloop CRM & Pipeline Suite",
      sku: "BL-CRM-CORE",
      type: "SAAS",
      description: "Unified customer relationship, deal tracking, and sales automation platform.",
      basePrice: 49.0,
      costPrice: 12.0,
      variants: {
        create: [
          { name: "Growth Tier (Up to 10 Users)", sku: "BL-CRM-GROWTH", priceDelta: 0, costDelta: 0 },
          { name: "Scale Tier (Up to 50 Users)", sku: "BL-CRM-SCALE", priceDelta: 50, costDelta: 10 },
          { name: "Enterprise Unlimited", sku: "BL-CRM-ENT", priceDelta: 150, costDelta: 30 },
        ],
      },
    },
    include: { variants: true },
  });

  const prodAnalytics = await prisma.product.upsert({
    where: { sku: "BL-BI-PRO" },
    update: {},
    create: {
      name: "Brightloop Pulse BI & Revenue Analytics",
      sku: "BL-BI-PRO",
      type: "SAAS",
      description: "Real-time predictive revenue intelligence, cohort retention, and automated reporting.",
      basePrice: 79.0,
      costPrice: 18.0,
      variants: {
        create: [
          { name: "Standard Analytics", sku: "BL-BI-STD", priceDelta: 0, costDelta: 0 },
          { name: "AI Forecasting Add-on", sku: "BL-BI-AI", priceDelta: 40, costDelta: 8 },
        ],
      },
    },
    include: { variants: true },
  });

  const prodSupport = await prisma.product.upsert({
    where: { sku: "BL-SLA-247" },
    update: {},
    create: {
      name: "Dedicated Cloud SLA & DevOps Support",
      sku: "BL-SLA-247",
      type: "SERVICE",
      description: "24/7 dedicated technical account manager with 15-minute critical response SLA.",
      basePrice: 120.0,
      costPrice: 45.0,
      variants: {
        create: [
          { name: "Business Hours SLA", sku: "BL-SLA-BIZ", priceDelta: 0, costDelta: 0 },
          { name: "24/7 Mission Critical SLA", sku: "BL-SLA-CRIT", priceDelta: 80, costDelta: 25 },
        ],
      },
    },
    include: { variants: true },
  });

  // 3. Plans (Daily, Weekly, Monthly, Yearly)
  const planDaily = await prisma.plan.upsert({
    where: { code: "PLAN-DAILY" },
    update: {},
    create: {
      name: "Daily Sandbox / Usage Plan",
      code: "PLAN-DAILY",
      interval: "DAILY",
      intervalCount: 1,
      priceMultiplier: 0.05,
      description: "Billed every day for short-term cloud bursts and sandbox testing.",
    },
  });

  const planWeekly = await prisma.plan.upsert({
    where: { code: "PLAN-WEEKLY" },
    update: {},
    create: {
      name: "Weekly Sprint Plan",
      code: "PLAN-WEEKLY",
      interval: "WEEKLY",
      intervalCount: 1,
      priceMultiplier: 0.28,
      description: "Flexible weekly billing cycle ideal for agile consulting sprints.",
    },
  });

  const planMonthly = await prisma.plan.upsert({
    where: { code: "PLAN-MONTHLY" },
    update: {},
    create: {
      name: "Monthly Standard Plan",
      code: "PLAN-MONTHLY",
      interval: "MONTHLY",
      intervalCount: 1,
      priceMultiplier: 1.0,
      description: "Standard month-to-month recurring billing with zero lock-in.",
    },
  });

  const planYearly = await prisma.plan.upsert({
    where: { code: "PLAN-YEARLY" },
    update: {},
    create: {
      name: "Annual Enterprise Plan (2 Months Free)",
      code: "PLAN-YEARLY",
      interval: "YEARLY",
      intervalCount: 1,
      priceMultiplier: 10.0,
      description: "Billed annually — pay for 10 months and get 12 months of access.",
    },
  });

  // 4. Tax Rules
  const taxGST = await prisma.taxRule.upsert({
    where: { code: "TAX-GST-18" },
    update: {},
    create: {
      name: "GST Standard (18%)",
      code: "TAX-GST-18",
      rate: 18.0,
      region: "India / APAC",
      description: "Standard 18% Goods and Services Tax on software subscriptions",
      isDefault: true,
    },
  });

  await prisma.taxRule.upsert({
    where: { code: "TAX-VAT-10" },
    update: {},
    create: {
      name: "Digital Services VAT (10%)",
      code: "TAX-VAT-10",
      rate: 10.0,
      region: "EU / UK",
      description: "Cross-border SaaS Value Added Tax",
      isDefault: false,
    },
  });

  await prisma.taxRule.upsert({
    where: { code: "TAX-EXEMPT-0" },
    update: {},
    create: {
      name: "SEZ / Export Tax Exempt (0%)",
      code: "TAX-EXEMPT-0",
      rate: 0.0,
      region: "Export / SEZ",
      description: "Zero-rated tax rule for verified export entities",
      isDefault: false,
    },
  });

  // 5. Discounts (Fixed & Percentage with Conditions)
  const now = new Date();
  const nextQuarter = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const discountGrowth = await prisma.discount.upsert({
    where: { code: "BRIGHT20" },
    update: {},
    create: {
      code: "BRIGHT20",
      name: "High-Value Subscription 20% Off",
      type: "PERCENTAGE",
      value: 20.0,
      minPurchaseAmount: 200.0,
      minQuantity: 2,
      startDate: pastMonth,
      endDate: nextQuarter,
      maxUsageLimit: 500,
      currentUsageCount: 12,
      autoApply: true,
    },
  });

  await prisma.discount.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: {
      code: "WELCOME50",
      name: "Flat $50 Onboarding Credit",
      type: "FIXED",
      value: 50.0,
      minPurchaseAmount: 100.0,
      minQuantity: 1,
      startDate: pastMonth,
      endDate: nextQuarter,
      maxUsageLimit: 250,
      currentUsageCount: 5,
      autoApply: true,
    },
  });

  // 6. Seed Subscriptions across lifecycle states + Invoices + Payments
  const existingSubCount = await prisma.subscription.count();
  if (existingSubCount === 0) {
    // Sub 1: ACTIVE Subscription for Acme (with Paid Invoice + Due Renewal)
    const sub1 = await prisma.subscription.create({
      data: {
        code: "SUB-1001",
        customerId: customer1.id,
        planId: planMonthly.id,
        status: "ACTIVE",
        startDate: pastMonth,
        nextBillingDate: now, // Due today so user can test 1-click Automated Billing!
        autoRenew: true,
        taxRuleId: taxGST.id,
        discountId: discountGrowth.id,
        subtotal: 297.0,
        discountAmount: 59.4,
        taxAmount: 42.77,
        totalAmount: 280.37,
        notes: "Acme Cloud core CRM + Analytics subscription",
        items: {
          create: [
            {
              productId: prodCRM.id,
              variantId: prodCRM.variants[1]?.id,
              quantity: 2,
              unitPrice: 99.0,
              unitCost: 22.0,
              lineTotal: 198.0,
            },
            {
              productId: prodAnalytics.id,
              variantId: prodAnalytics.variants[0]?.id,
              quantity: 1,
              unitPrice: 79.0,
              unitCost: 18.0,
              lineTotal: 79.0,
            },
          ],
        },
      },
    });

    // Paid invoice for Sub 1 last month
    const inv1 = await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-1001",
        subscriptionId: sub1.id,
        customerId: customer1.id,
        billingPeriodKey: `${sub1.id}_2026-09-30`,
        status: "PAID",
        issueDate: pastMonth,
        dueDate: new Date(pastMonth.getTime() + 14 * 24 * 60 * 60 * 1000),
        sentAt: pastMonth,
        paidAt: pastMonth,
        subtotal: 297.0,
        discountId: discountGrowth.id,
        discountAmount: 59.4,
        taxRuleId: taxGST.id,
        taxAmount: 42.77,
        totalAmount: 280.37,
        paidAmount: 280.37,
        notes: "Initial monthly subscription invoice",
      },
    });

    await prisma.payment.create({
      data: {
        paymentNumber: "PAY-1001",
        invoiceId: inv1.id,
        amount: 280.37,
        method: "CARD",
        reference: "STRIPE-CH-99281",
        notes: "Auto-charged corporate Visa ending 4242",
        recordedById: admin.id,
      },
    });

    // Sub 2: ACTIVE Annual Subscription for NovaHealth (with an OVERDUE Confirmed Invoice)
    const sub2 = await prisma.subscription.create({
      data: {
        code: "SUB-1002",
        customerId: customer2.id,
        planId: planYearly.id,
        status: "ACTIVE",
        startDate: pastMonth,
        nextBillingDate: nextQuarter,
        autoRenew: true,
        taxRuleId: taxGST.id,
        discountId: discountGrowth.id,
        subtotal: 2000.0,
        discountAmount: 400.0,
        taxAmount: 288.0,
        totalAmount: 1888.0,
        notes: "Annual enterprise SLA + CRM commitment",
        items: {
          create: [
            {
              productId: prodSupport.id,
              variantId: prodSupport.variants[1]?.id,
              quantity: 1,
              unitPrice: 2000.0,
              unitCost: 700.0,
              lineTotal: 2000.0,
            },
          ],
        },
      },
    });

    // Overdue invoice for Sub 2
    await prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2026-1002",
        subscriptionId: sub2.id,
        customerId: customer2.id,
        billingPeriodKey: `${sub2.id}_2026-10-01`,
        status: "CONFIRMED",
        issueDate: pastMonth,
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue!
        sentAt: pastMonth,
        subtotal: 2000.0,
        discountId: discountGrowth.id,
        discountAmount: 400.0,
        taxRuleId: taxGST.id,
        taxAmount: 288.0,
        totalAmount: 1888.0,
        paidAmount: 0,
        notes: "Annual enterprise billing — awaiting wire transfer",
      },
    });

    // Sub 3: QUOTATION for Zenith Retail
    await prisma.subscription.create({
      data: {
        code: "SUB-1003",
        customerId: customer3.id,
        planId: planWeekly.id,
        status: "QUOTATION",
        startDate: now,
        nextBillingDate: now,
        autoRenew: true,
        taxRuleId: taxGST.id,
        subtotal: 137.2,
        discountAmount: 0,
        taxAmount: 24.7,
        totalAmount: 161.9,
        notes: "Weekly retail analytics pilot quotation",
        items: {
          create: [
            {
              productId: prodCRM.id,
              quantity: 5,
              unitPrice: 27.44,
              unitCost: 6.72,
              lineTotal: 137.2,
            },
          ],
        },
      },
    });

    // Sub 4: DRAFT Subscription for Acme
    await prisma.subscription.create({
      data: {
        code: "SUB-1004",
        customerId: customer1.id,
        planId: planDaily.id,
        status: "DRAFT",
        startDate: now,
        nextBillingDate: now,
        autoRenew: false,
        taxRuleId: taxGST.id,
        subtotal: 24.5,
        discountAmount: 0,
        taxAmount: 4.41,
        totalAmount: 28.91,
        notes: "Draft sandbox burst environment",
        items: {
          create: [
            {
              productId: prodCRM.id,
              quantity: 10,
              unitPrice: 2.45,
              unitCost: 0.6,
              lineTotal: 24.5,
            },
          ],
        },
      },
    });

    // Sub 5: CLOSED Subscription
    await prisma.subscription.create({
      data: {
        code: "SUB-1005",
        customerId: customer3.id,
        planId: planMonthly.id,
        status: "CLOSED",
        startDate: pastMonth,
        nextBillingDate: pastMonth,
        closedAt: now,
        autoRenew: false,
        taxRuleId: taxGST.id,
        subtotal: 79.0,
        discountAmount: 0,
        taxAmount: 14.22,
        totalAmount: 93.22,
        notes: "Completed Q3 seasonal campaign subscription",
      },
    });
  }

  console.log("Seed completed! Demo accounts ready (Password: Brightloop@123)");
  console.log(" - Admin:    admin@brightloop.io");
  console.log(" - Staff:    staff@brightloop.io");
  console.log(" - Customer: customer@acme.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
