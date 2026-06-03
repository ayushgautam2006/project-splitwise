import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { loginCode } = await request.json();

    if (!loginCode || typeof loginCode !== "string") {
      return NextResponse.json(
        { error: "Invalid login code" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { loginCode: loginCode.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        loginCode: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid login code" },
        { status: 401 }
      );
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
