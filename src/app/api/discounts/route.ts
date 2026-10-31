import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ discounts });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only Admin can create discounts." },
      { status: 403 }
    );
  }

  try {
    const {
      code,
      name,
      type,
      value,
      minPurchaseAmount,
      minQuantity,
      startDate,
      endDate,
      maxUsageLimit,
      autoApply,
    } = await request.json();

    if (!code || !name || !type || value === undefined) {
      return NextResponse.json(
        { error: "Code, name, type (FIXED or PERCENTAGE), and value are required." },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.create({
      data: {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        type: String(type).toUpperCase(),
        value: Number(value),
        minPurchaseAmount: Number(minPurchaseAmount || 0),
        minQuantity: Number(minQuantity || 1),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate
          ? new Date(endDate)
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        maxUsageLimit: Number(maxUsageLimit || 100),
        autoApply: autoApply !== undefined ? Boolean(autoApply) : true,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (err) {
    console.error("Create discount error:", err);
    return NextResponse.json(
      { error: "Failed to create discount. Code must be unique." },
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
    const { id, isActive, autoApply, maxUsageLimit } = await request.json();
    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(autoApply !== undefined ? { autoApply } : {}),
        ...(maxUsageLimit !== undefined ? { maxUsageLimit: Number(maxUsageLimit) } : {}),
      },
    });
    return NextResponse.json({ discount });
  } catch {
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}
