import { getAppUrl } from "@/lib/app-url";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendSlackTimeOffNotification(
  requesterName: string,
  startDate: string,
  endDate: string,
  workingDays: number,
  note?: string
) {
  if (!SLACK_WEBHOOK_URL) {
    console.log("[Slack] SLACK_WEBHOOK_URL not configured. Skipping notification.");
    return;
  }

  const appUrl = await getAppUrl();

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🏖️ New Time Off Request",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Who:*\n${requesterName}` },
        { type: "mrkdwn", text: `*Working Days:*\n${workingDays}` },
        { type: "mrkdwn", text: `*From:*\n${startDate}` },
        { type: "mrkdwn", text: `*To:*\n${endDate}` },
      ],
    },
    ...(note
      ? [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Note:* ${note}` },
          },
        ]
      : []),
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Review Request", emoji: true },
          url: `${appUrl}/admin/pending`,
          style: "primary",
        },
      ],
    },
  ];

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New time off request from ${requesterName} (${startDate} – ${endDate}, ${workingDays} days)`,
        blocks,
      }),
    });

    if (!response.ok) {
      console.error("[Slack] Webhook failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("[Slack] Failed to send notification:", error);
  }
}
