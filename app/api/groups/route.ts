import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/groups?userId=...
// Returns the user's default group with its expenses & participants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Find or create a default group for this user
    let membership = await prisma.groupMember.findFirst({
      where: { userId },
      include: {
        group: {
          include: {
            expenses: {
              orderBy: { createdAt: "asc" },
              include: { participants: true },
            },
          },
        },
      },
    });

    if (!membership) {
      // Create the default group and add the user as a member
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const group = await prisma.group.create({
        data: {
          name: `${user.name}'s Group`,
          members: { create: { userId } },
        },
        include: {
          expenses: {
            include: { participants: true },
          },
        },
      });

      return NextResponse.json({ group });
    }

    return NextResponse.json({ group: membership.group });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
