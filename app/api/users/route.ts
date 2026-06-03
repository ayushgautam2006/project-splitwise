import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate a short memorable login code: 3 words from adjective-noun-number
    const adjectives = ["swift", "calm", "bold", "bright", "cool", "sharp", "kind", "wise", "pure", "keen"];
    const nouns = ["fox", "star", "wave", "peak", "oak", "moon", "lake", "bird", "wolf", "reef"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 900) + 100; // 100-999
    const loginCode = `${adj}-${noun}-${num}`;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        loginCode,
      },
      select: {
        id: true,
        name: true,
        loginCode: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
