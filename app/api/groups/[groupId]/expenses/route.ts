import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/groups/[groupId]/expenses
// Body: { description, amount, paidByName, splitAmong: string[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { description, amount, paidByName, splitAmong } = body;

    if (
      !description?.trim() ||
      typeof amount !== "number" ||
      amount <= 0 ||
      !paidByName?.trim() ||
      !Array.isArray(splitAmong) ||
      splitAmong.length === 0
    ) {
      return NextResponse.json({ error: "Invalid expense data" }, { status: 400 });
    }

    const shareAmount = amount / splitAmong.length;

    const expense = await prisma.expense.create({
      data: {
        groupId,
        description: description.trim(),
        amount,
        paidByName: paidByName.trim(),
        participants: {
          create: splitAmong.map((name: string) => ({
            name: name.trim(),
            amount: Math.round(shareAmount * 100) / 100,
          })),
        },
      },
      include: { participants: true },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Add expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
