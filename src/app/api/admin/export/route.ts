import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { startDate: "asc" },
    });

    const csvHeader =
      "Name,Email,Start Date,End Date,Working Days,Status,Note,Created At\n";
    const csvRows = requests
      .map(
        (r) =>
          `"${r.user.name}","${r.user.email}","${format(r.startDate, "yyyy-MM-dd")}","${format(r.endDate, "yyyy-MM-dd")}",${r.workingDays},"${r.status}","${(r.note || "").replace(/"/g, '""')}","${format(r.createdAt, "yyyy-MM-dd HH:mm")}"`
      )
      .join("\n");

    const csv = csvHeader + csvRows;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="time-off-export-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
