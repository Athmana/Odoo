import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword, validatePasswordRules } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get("role");
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {};
  if (roleFilter) {
    where.role = roleFilter;
  } else if (session.role === "STAFF") {
    // Staff mainly manage customers
    where.role = "CUSTOMER";
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { company: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { subscriptions: true, invoices: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role, company, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const targetRole = role || "CUSTOMER";

    // STRICT REQUIREMENT: Only Admin can add staff members (or admins)
    if ((targetRole === "STAFF" || targetRole === "ADMIN") && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can add staff members." },
        { status: 403 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered to another account." },
        { status: 409 }
      );
    }

    const pwdCheck = validatePasswordRules(password);
    if (!pwdCheck.valid) {
      return NextResponse.json(
        { error: pwdCheck.errors.join(" "), details: pwdCheck.errors },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: targetRole,
        company: company ? String(company).trim() : null,
        phone: phone ? String(phone).trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only Admin can modify user roles or status." },
      { status: 403 }
    );
  }

  try {
    const { id, role, isActive, name, company, phone } = await request.json();
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(company !== undefined ? { company } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        isActive: true,
      },
    });
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
