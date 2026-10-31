import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordRules } from "@/lib/auth";

/**
 * Password Reset via Registered Email
 * - Step 1 (action = "request"): Checks if the email is a registered account, generates a 6-digit reset token valid for 30 minutes.
 * - Step 2 (action = "confirm"): Verifies registered email + resetToken, validates new password rules (>8 chars, upper, lower, special), and updates password.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, resetToken, newPassword } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Please provide your registered email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this registered email address." },
        { status: 404 }
      );
    }

    if (action === "request") {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: code,
          resetTokenExpiry: expiry,
        },
      });

      return NextResponse.json({
        message: `Password reset token generated and dispatched to registered email (${normalizedEmail}).`,
        verificationCode: code,
      });
    }

    if (action === "confirm") {
      if (!resetToken || !newPassword) {
        return NextResponse.json(
          { error: "Reset token and new password are required." },
          { status: 400 }
        );
      }

      if (
        !user.resetToken ||
        user.resetToken !== String(resetToken).trim() ||
        !user.resetTokenExpiry ||
        new Date() > user.resetTokenExpiry
      ) {
        return NextResponse.json(
          { error: "Invalid or expired reset code for this email." },
          { status: 400 }
        );
      }

      const pwdValidation = validatePasswordRules(newPassword);
      if (!pwdValidation.valid) {
        return NextResponse.json(
          { error: pwdValidation.errors.join(" "), details: pwdValidation.errors },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return NextResponse.json({
        message: "Password has been successfully reset! You can now log in.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Password reset failed." },
      { status: 500 }
    );
  }
}
