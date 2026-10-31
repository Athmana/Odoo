import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        orderBy: { priceDelta: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only Admin can create products and variants." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, sku, description, type, basePrice, costPrice, variants } = body;

    if (!name || !sku || basePrice === undefined) {
      return NextResponse.json(
        { error: "Name, SKU, and basePrice are required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        sku: String(sku).trim().toUpperCase(),
        description: description || null,
        type: type || "SAAS",
        basePrice: Number(basePrice),
        costPrice: Number(costPrice || 0),
        variants:
          Array.isArray(variants) && variants.length > 0
            ? {
                create: variants.map(
                  (v: {
                    name: string;
                    sku: string;
                    priceDelta?: number;
                    costDelta?: number;
                  }) => ({
                    name: v.name,
                    sku: v.sku.toUpperCase(),
                    priceDelta: Number(v.priceDelta || 0),
                    costDelta: Number(v.costDelta || 0),
                  })
                ),
              }
            : undefined,
      },
      include: { variants: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("Create product error:", err);
    return NextResponse.json(
      { error: "Failed to create product. Ensure SKU is unique." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only Admin can update products." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, description, type, basePrice, costPrice, isActive, newVariant } = body;

    if (newVariant && id) {
      await prisma.productVariant.create({
        data: {
          productId: id,
          name: newVariant.name,
          sku: String(newVariant.sku).toUpperCase(),
          priceDelta: Number(newVariant.priceDelta || 0),
          costDelta: Number(newVariant.costDelta || 0),
        },
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(basePrice !== undefined ? { basePrice: Number(basePrice) } : {}),
        ...(costPrice !== undefined ? { costPrice: Number(costPrice) } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { variants: true },
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}
