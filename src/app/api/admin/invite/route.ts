import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let invite = await prisma.inviteConfig.findFirst({
      where: { isActive: true },
    });

    // Auto-create invite code if none exists
    if (!invite) {
      invite = await prisma.inviteConfig.create({
        data: {
          code: generateInviteCode(),
          createdBy: session.userId,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Get invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Deactivate all existing invite codes
    await prisma.inviteConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new invite code
    const invite = await prisma.inviteConfig.create({
      data: {
        code: generateInviteCode(),
        createdBy: session.userId,
        isActive: true,
      },
    });

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
