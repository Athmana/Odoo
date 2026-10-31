import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["DRAFT", "CONFIRMED"] },
      dueDate: { lt: now },
    },
    include: {
      customer: {
        select: { id: true, name: true, email: true, company: true, phone: true },
      },
      subscription: {
        select: { id: true, code: true, status: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const enriched = overdueInvoices.map((inv) => {
    const daysOverdue = Math.max(
      1,
      Math.ceil((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const balanceDue = Math.max(
      0,
      Number((inv.totalAmount - inv.paidAmount).toFixed(2))
    );
    return {
      ...inv,
      daysOverdue,
      balanceDue,
    };
  });

  return NextResponse.json({
    count: enriched.length,
    totalOverdueBalance: Number(
      enriched.reduce((sum, i) => sum + i.balanceDue, 0).toFixed(2)
    ),
    overdueInvoices: enriched,
  });
}

export async function POST() {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["DRAFT", "CONFIRMED"] },
      dueDate: { lt: now },
    },
    include: {
      customer: { select: { name: true, email: true } },
    },
  });

  for (const inv of overdueInvoices) {
    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        status: "CONFIRMED",
        sentAt: now,
        notes: `${inv.notes ? inv.notes + " | " : ""}Overdue payment reminder dispatched on ${
          now.toISOString().split("T")[0]
        }`,
      },
    });
  }

  return NextResponse.json({
    dispatchedCount: overdueInvoices.length,
    timestamp: now.toISOString(),
  });
}
