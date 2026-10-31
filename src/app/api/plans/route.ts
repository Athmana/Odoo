import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const plans = await prisma.plan.findMany({
    orderBy: { priceMultiplier: "asc" },
    include: {
      _count: { select: { subscriptions: true } },
    },
  });
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only Admin can manage billing plans." },
      { status: 403 }
    );
  }

  try {
    const { name, code, interval, intervalCount, priceMultiplier, description } =
      await request.json();

    if (!name || !code || !interval) {
      return NextResponse.json(
        { error: "Name, code, and billing interval (DAILY, WEEKLY, MONTHLY, YEARLY) are required." },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        interval: String(interval).toUpperCase(),
        intervalCount: Number(intervalCount || 1),
        priceMultiplier: Number(priceMultiplier || 1.0),
        description: description || null,
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    console.error("Create plan error:", err);
    return NextResponse.json(
      { error: "Failed to create plan." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, isActive, name, priceMultiplier, description } = await request.json();
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(priceMultiplier !== undefined ? { priceMultiplier: Number(priceMultiplier) } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
