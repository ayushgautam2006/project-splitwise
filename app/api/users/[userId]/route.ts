import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/users/[userId]
// Permanently deletes the user and ALL their data (groups, expenses, settlements).
// This frees up their loginCode so it can be assigned to a new user.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all groups the user owns/belongs to first (cascade cleans up
    // Expense, ExpenseParticipant, Settlement, GroupMember rows automatically)
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    if (memberships.length > 0) {
      await prisma.group.deleteMany({
        where: { id: { in: memberships.map((m) => m.groupId) } },
      });
    }

    // Now delete the user — loginCode is freed up for reuse
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
