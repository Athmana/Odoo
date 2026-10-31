import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get("pageSize") || 50)));

  const where: Record<string, unknown> = {};
  if (session.role === "CUSTOMER") {
    where.invoice = { customerId: session.id };
  }

  const [payments, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            customer: { select: { id: true, name: true, email: true, company: true } },
            subscription: { select: { id: true, code: true } },
          },
        },
        recordedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { paidAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({ payments, totalCount, page, pageSize });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { invoiceId, amount, method = "CARD", reference, notes } = await request.json();

    if (!invoiceId || amount === undefined || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invoice ID and a positive payment amount are required." },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (session.role === "CUSTOMER" && invoice.customerId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${String(count + 1001).padStart(4, "0")}`;
    const paymentAmount = Number(Number(amount).toFixed(2));
    const newPaidAmount = Number((invoice.paidAmount + paymentAmount).toFixed(2));
    const isFullyPaid = newPaidAmount >= invoice.totalAmount - 0.01;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          amount: paymentAmount,
          method,
          reference: reference || `TXN-${Date.now().toString().slice(-6)}`,
          notes: notes || null,
          recordedById: session.id,
        },
        include: {
          invoice: {
            include: {
              customer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? "PAID" : "CONFIRMED",
          paidAt: isFullyPaid ? new Date() : invoice.paidAt,
        },
      });

      // Ensure subscription is ACTIVE once paid
      if (isFullyPaid) {
        await tx.subscription.updateMany({
          where: {
            id: invoice.subscriptionId,
            status: { in: ["CONFIRMED", "QUOTATION"] },
          },
          data: { status: "ACTIVE" },
        });
      }

      return payment;
    });

    return NextResponse.json({ payment: result }, { status: 201 });
  } catch (err) {
    console.error("Record payment error:", err);
    return NextResponse.json(
      { error: "Failed to record payment." },
      { status: 500 }
    );
  }
}
