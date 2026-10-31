import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const taxes = await prisma.taxRule.findMany({
    orderBy: [{ isDefault: "desc" }, { rate: "asc" }],
  });
  return NextResponse.json({ taxes });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only Admin can define tax rules." },
      { status: 403 }
    );
  }

  try {
    const { name, code, rate, region, description, isDefault } = await request.json();

    if (!name || !code || rate === undefined) {
      return NextResponse.json(
        { error: "Name, code, and tax rate are required." },
        { status: 400 }
      );
    }

    if (isDefault) {
      await prisma.taxRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const tax = await prisma.taxRule.create({
      data: {
        name: String(name).trim(),
        code: String(code).trim().toUpperCase(),
        rate: Number(rate),
        region: region || "Global",
        description: description || null,
        isDefault: Boolean(isDefault),
      },
    });

    return NextResponse.json({ tax }, { status: 201 });
  } catch (err) {
    console.error("Create tax rule error:", err);
    return NextResponse.json(
      { error: "Failed to create tax rule." },
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
    const { id, isActive, isDefault, rate, name } = await request.json();
    if (isDefault) {
      await prisma.taxRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    const tax = await prisma.taxRule.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(isDefault !== undefined ? { isDefault } : {}),
        ...(rate !== undefined ? { rate: Number(rate) } : {}),
        ...(name !== undefined ? { name } : {}),
      },
    });
    return NextResponse.json({ tax });
  } catch {
    return NextResponse.json({ error: "Failed to update tax rule." }, { status: 500 });
  }
}
