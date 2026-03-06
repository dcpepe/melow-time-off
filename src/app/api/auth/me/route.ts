import { NextResponse } from "next/server";
import { getSession, generateToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        color: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const response = NextResponse.json({ user });

    // If the user's role (or other fields) changed in the DB since the JWT was issued,
    // refresh the token so subsequent API calls use the updated role
    if (
      user.role !== session.role ||
      user.name !== session.name ||
      user.email !== session.email
    ) {
      const newToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
      response.cookies.set("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return response;
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
