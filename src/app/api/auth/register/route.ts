import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  createSessionToken,
  hashPassword,
  validatePasswordRules,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, company, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Requirement: Each email must belong to only one account
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Each email can belong to only one account." },
        { status: 409 }
      );
    }

    // Requirement: Password > 8 chars, uppercase, lowercase, special character
    const pwdCheck = validatePasswordRules(password);
    if (!pwdCheck.valid) {
      return NextResponse.json(
        { error: pwdCheck.errors.join(" "), details: pwdCheck.errors },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: "CUSTOMER", // Public signups are always CUSTOMER; only Admin can add STAFF
        company: company ? String(company).trim() : null,
        phone: phone ? String(phone).trim() : null,
      },
    });

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "STAFF" | "CUSTOMER",
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Failed to register user." },
      { status: 500 }
    );
  }
}
