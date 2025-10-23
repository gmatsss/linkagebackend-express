const { checkMissingColumns } = require("../services/googlesheet/seoService");
const { processSEOAgent } = require("../services/googlesheet/openaiService");
const { sendDiscordMessage } = require("../services/discordBotService");

const CHANNEL_ID = "1349983594981883935";
const USER_ID = "<@336794456063737857>";

exports.seoAuto = async (req, res) => {
  try {
    const checkResult = checkMissingColumns(req.body);
    if (checkResult.MissingCol) {
      return res.status(200).json(checkResult);
    }

    const rowNumber = req.body.range?.rowStart || "Unknown";
    const rowData = req.body.rowValues?.[0] || [];

    const logMessage = Object.entries(rowData)
      .map(([key, val]) => `(${key}): ${val}`)
      .join(", ");

    await sendDiscordMessage({
      title: "SEO Content - Started",
      statusCode: 200,
      message: `Row: ${rowNumber}\nData: ${logMessage}`,
      channelId: CHANNEL_ID,
    });

    const { content, refinedOutline, critique } = await processSEOAgent(
      rowData
    );

    await sendDiscordMessage({
      title: "SEO Content - Completed ✅",
      statusCode: 200,
      message: `Row: ${rowNumber}\n\nFinal SEO Content:\n${content}`,
      channelId: CHANNEL_ID,
    });

    return res.status(200).json({
      error: false,
      ...checkResult,
      content,
      outline: refinedOutline,
      critique,
      message: "SEO content ready with multi-agent logic",
    });
  } catch (error) {
    console.error("Error in seoAuto agent version:", error);

    const errorMessage =
      `${USER_ID} An error occurred: ${error.message}`.substring(0, 2000);

    await sendDiscordMessage({
      title: "SEO Agent Failed ❌",
      statusCode: 500,
      message: errorMessage,
      channelId: CHANNEL_ID,
    });

    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
};
