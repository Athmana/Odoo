import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
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
      { invoiceNumber: { contains: search } },
      { customer: { name: { contains: search } } },
      { subscription: { code: { contains: search } } },
    ];
  }

  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, company: true, phone: true } },
        subscription: {
          include: {
            plan: true,
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
        taxRule: true,
        discount: true,
        payments: true,
      },
      orderBy: { issueDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    invoices,
    totalCount,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, targetDate } = body;

    if (action === "RUN_BILLING") {
      const date = targetDate ? new Date(targetDate) : new Date();
      const summary = await runAutomatedBillingCycle(date);
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Invoice action error:", err);
    return NextResponse.json(
      { error: "Failed to run billing cycle." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, action, status } = await request.json();

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (action === "CONFIRM") {
      updateData.status = "CONFIRMED";
    } else if (action === "SEND") {
      if (invoice.status === "DRAFT") {
        updateData.status = "CONFIRMED";
      }
      updateData.sentAt = new Date();
    } else if (status) {
      updateData.status = status;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        subscription: { include: { plan: true } },
        taxRule: true,
        discount: true,
        payments: true,
      },
    });

    return NextResponse.json({ invoice: updated });
  } catch (err) {
    console.error("Update invoice error:", err);
    return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
  }
}
