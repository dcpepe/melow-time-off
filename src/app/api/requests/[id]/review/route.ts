import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendRequestReviewedEmail } from "@/lib/email";
import { format } from "date-fns";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { status, adminNote } = await request.json();

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!timeOffRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (timeOffRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request has already been reviewed" },
        { status: 400 }
      );
    }

    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || null,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, color: true },
        },
      },
    });

    // Send email to requester
    sendRequestReviewedEmail(
      timeOffRequest.user.email,
      timeOffRequest.user.name,
      status,
      format(timeOffRequest.startDate, "MMM d, yyyy"),
      format(timeOffRequest.endDate, "MMM d, yyyy"),
      adminNote
    ).catch(console.error);

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Review request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
