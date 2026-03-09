import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { countWorkingDays } from "@/lib/dates";
import { sendRequestSubmittedEmail } from "@/lib/email";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    // Members can only see their own requests
    if (session.role !== "ADMIN") {
      where.userId = session.userId;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate) };
      where.endDate = { lte: new Date(endDate) };
    }

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, color: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startDate, endDate, note, startHalf, endHalf } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates aren't in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json(
        { error: "Cannot request time off in the past" },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const fullWorkingDays = countWorkingDays(start, end);
    const workingDays = fullWorkingDays - (startHalf ? 0.5 : 0) - (endHalf ? 0.5 : 0);
    if (workingDays <= 0) {
      return NextResponse.json(
        { error: "Selected range contains no working days" },
        { status: 400 }
      );
    }

    // Check for overlapping requests
    const overlapping = await prisma.timeOffRequest.findFirst({
      where: {
        userId: session.userId,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "You already have a request overlapping these dates" },
        { status: 400 }
      );
    }

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId: session.userId,
        startDate: start,
        endDate: end,
        workingDays,
        startHalf: !!startHalf,
        endHalf: !!endHalf,
        note: note || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, color: true },
        },
      },
    });

    // Send email to admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { email: true },
    });

    sendRequestSubmittedEmail(
      admins.map((a) => a.email),
      session.name,
      format(start, "MMM d, yyyy"),
      format(end, "MMM d, yyyy"),
      workingDays,
      note
    ).catch(console.error);

    return NextResponse.json({ request: timeOffRequest }, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
