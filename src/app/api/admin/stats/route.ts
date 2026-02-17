import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfYear, endOfYear } from "date-fns";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        color: true,
        createdAt: true,
        requests: {
          where: {
            startDate: { gte: yearStart },
            endDate: { lte: yearEnd },
          },
          orderBy: { startDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const stats = users.map((user) => {
      const approved = user.requests.filter((r) => r.status === "APPROVED");
      const pending = user.requests.filter((r) => r.status === "PENDING");
      const daysTaken = approved.reduce((sum, r) => sum + r.workingDays, 0);
      const daysPending = pending.reduce((sum, r) => sum + r.workingDays, 0);

      const upcoming = user.requests.find(
        (r) => r.status === "APPROVED" && new Date(r.startDate) >= now
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        color: user.color,
        createdAt: user.createdAt,
        daysTaken,
        daysPending,
        totalRequests: user.requests.length,
        upcoming: upcoming
          ? {
              startDate: upcoming.startDate,
              endDate: upcoming.endDate,
              workingDays: upcoming.workingDays,
            }
          : null,
      };
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
