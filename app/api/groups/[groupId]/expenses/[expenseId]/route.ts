import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/groups/[groupId]/expenses/[expenseId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; expenseId: string }> }
) {
  try {
    const { groupId, expenseId } = await params;

    // Verify the expense belongs to this group
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, groupId },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
