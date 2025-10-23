const axios = require("axios");
const { sendDiscordMessage } = require("../discordBotService");

const WEBHOOK_URLS = {
  inReview:
    "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/6c4a8498-bc12-410c-9a7b-b0c96ad33706",
  askReview:
    "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/PWZeOhLYHLOv4Se0TT80",
  inProgress:
    "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/DeoqdJiXiJ5RQy54payo",
  awaitingCxReply:
    "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/Z6sLx1UdmDojX11QaHFt",
  customerReply:
    "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/Xm5m03pPguRmoix3BaTa",
  ticketResolved:
    "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/T8BS3O0MxiR5lAKAlZ35",
  closed:
    "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/sajYoP1y5zcYFv8CH6mb",
};

const DISCORD_CHANNEL_ID = "1361503079106875442";
const DISCORD_USER_ID = "336794456063737857";

function normalizeNotes(columns) {
  const result = { ...columns };

  // helper to extract text
  const extract = (v) => {
    if (!v) return ""; // null or undefined or empty
    if (typeof v === "string")
      // already a string
      return v;
    if (typeof v === "object")
      // { text, changed_at }
      return v.text || "";
    return String(v); // anything else
  };

  result.Clarifications = extract(columns.Clarifications);
  result.AdditionalNote = extract(columns.AdditionalNote);

  return result;
}

async function triggerStatus({
  webhookUrl,
  emoji,
  label,
  item,
  columns,
  continuePipeline,
}) {
  try {
    await axios.post(webhookUrl, {
      subject: item.name,
      url: item.url,
      columns,
    });
    console.log(`✅ ${label} webhook sent`);
  } catch (err) {
    console.error(`❌ ${label} webhook failed:`, err.message);
    await sendDiscordMessage({
      title: `❌ Error Sending ${label} Webhook`,
      statusCode: 500,
      message: `<@${DISCORD_USER_ID}> failed to send ${label} webhook for ${item.name}\n${item.url}\nError: ${err.message}`,
      channelId: DISCORD_CHANNEL_ID,
    });
    return { continue: false, message: `Failed to send webhook for ${label}.` };
  }

  await sendDiscordMessage({
    title: `${emoji} Workflow Triggered ${label}`,
    statusCode: 200,
    message: [
      `Board item is *${label}*.`,
      `Item: ${item.name}`,
      item.url,
      "",
      "**Columns:**",
      "```json",
      JSON.stringify(columns, null, 2),
      "```",
    ].join("\n"),
    channelId: DISCORD_CHANNEL_ID,
  });

  return {
    continue: continuePipeline,
    message: `Board item status is '${label}'.`,
  };
}

async function handleInReviewStatus(item, columns) {
  return triggerStatus({
    webhookUrl: WEBHOOK_URLS.inReview,
    emoji: "🔍",
    label: "In Review",
    item,
    columns,
    continuePipeline: true,
  });
}

async function handleAskReviewStatus(item, columns) {
  return triggerStatus({
    webhookUrl: WEBHOOK_URLS.askReview,
    emoji: "❓",
    label: "Ask Review",
    item,
    columns,
    continuePipeline: true,
  });
}

async function handleInProgressStatus(item, columns) {
  return triggerStatus({
    webhookUrl: WEBHOOK_URLS.inProgress,
    emoji: "🚧",
    label: "In Progress",
    item,
    columns,
    continuePipeline: false,
  });
}

async function handleAwaitingCxReplyStatus(item, columns) {
  return triggerStatus({
    webhookUrl: WEBHOOK_URLS.awaitingCxReply,
    emoji: "⏳",
    label: "Awaiting CX Reply",
    item,
    columns,
    continuePipeline: false,
  });
}

async function handleCustomerReplyStatus(item, columns) {
  return triggerStatus({
    webhookUrl: WEBHOOK_URLS.customerReply,
    emoji: "💬",
    label: "Customer Reply",
    item,
    columns,
    continuePipeline: false,
  });
}

async function handleTicketResolvedStatus(item, columns) {
  return triggerStatus({
    webhookUrl: WEBHOOK_URLS.ticketResolved,
    emoji: "✅",
    label: "Ticket Resolved",
    item,
    columns,
    continuePipeline: false,
  });
}

async function handleClosedStatus(item, columns) {
  return triggerStatus({
    webhookUrl: WEBHOOK_URLS.closed,
    emoji: "🔒",
    label: "Closed",
    item,
    columns,
    continuePipeline: false,
  });
}

async function handleStatusWorkflow(status, item, columns) {
  const normalizedColumns = normalizeNotes(columns);
  switch (status) {
    case "In Review":
      return handleInReviewStatus(item, normalizedColumns);
    case "Ask Review":
      return handleAskReviewStatus(item, normalizedColumns);
    case "In Progress":
      return handleInProgressStatus(item, normalizedColumns);
    case "Awaiting CX Reply":
      return handleAwaitingCxReplyStatus(item, normalizedColumns);
    case "Customer Reply":
      return handleCustomerReplyStatus(item, normalizedColumns);
    case "Ticket Resolved":
      return handleTicketResolvedStatus(item, normalizedColumns);
    case "Closed":
      return handleClosedStatus(item, normalizedColumns);
    default:
      return {
        continue: false,
        message: `No workflow defined for status '${status}'.`,
      };
  }
}

module.exports = {
  handleStatusWorkflow,
};
