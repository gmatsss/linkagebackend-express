const { checkMissingColumns } = require("../services/googlesheet/seoService");
const { generateSEOContent } = require("../services/googlesheet/openaiService");
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
    const rowData = req.body.rowValues?.[0] || {};

    // Option: Log both keys and values from the rowData for more detailed logging.
    const columnsWithValues = Object.entries(rowData)
      .map(([key, value]) => `(${key}): ${value}`)
      .join(", ");

    const message = `Row: ${rowNumber}\nData: ${columnsWithValues}`;

    await sendDiscordMessage({
      title: "SEO Content Processed",
      statusCode: 200,
      message,
      channelId: CHANNEL_ID,
    });

    const seoResponse = await generateSEOContent(req.body);
    const aiContent = seoResponse?.choices?.[0]?.message?.content || "";

    return res.status(200).json({
      error: false,
      ...checkResult,
      content: aiContent,
      message: "Ready for review",
    });
  } catch (error) {
    console.error("Error processing SEO auto:", error);

    const errorMessage =
      `${USER_ID} An error occurred: ${error.message}`.substring(0, 2000);

    await sendDiscordMessage({
      title: "SEO Content Generation Failed",
      statusCode: 500,
      message: errorMessage,
      channelId: CHANNEL_ID,
    });

    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
};
