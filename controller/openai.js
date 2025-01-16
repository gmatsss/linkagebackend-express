const axios = require("axios");

function preprocessEmailContent(content) {
  // Remove quoted email sections (lines starting with ">")
  content = content.replace(/^>.*$/gm, "");

  // Remove email headers like "On Thu, Jan 16, 2025 at 1:24 PM"
  content = content.replace(
    /^On\s.+?\s\d{1,2}:\d{2}(?:\s[APap][Mm])?.+wrote:$/gm,
    ""
  );

  // Remove email footers (opt-out, unsubscribe, etc.)
  content = content.replace(/Opt-Out Option:.*|Unsubscribe here:.*/gi, "");

  // Remove HTML tags if present
  content = content.replace(/<[^>]+>/g, "");

  // Remove extra whitespace
  content = content.trim();

  return content;
}

exports.chatWithOpenAI = async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const url = "https://api.openai.com/v1/chat/completions";

    let messageContent = req.body.message;

    // Preprocess the email content
    messageContent = preprocessEmailContent(messageContent);

    if (!messageContent || messageContent.trim() === "") {
      return res.json({
        success: true,
        category: "negative",
        isNegative: true,
        reason: "The message content is empty or missing after preprocessing.",
      });
    }

    const data = {
      model: "gpt-4-0613",
      messages: [
        {
          role: "system",
          content: `You are an assistant trained to analyze email responses and classify them into specific categories. Your job is to categorize the email content into one of the following types:
            
  - 'positive': if the email indicates interest or a willingness to engage.
  - 'negative': if the email indicates disinterest or rejection.
  - 'outOfOffice': if the email is an out-of-office response.
  - 'personnelChange': if the email mentions a change in personnel.
  - 'officeClosure': if the email states office closure.
  - 'autoReply': if the email is an automated response.
  - 'negativeKeyword': if the email includes one of the following keywords: 'BEANS', 'Pumpkin', 'Snowflake', 'Unicorn', 'Banana', 'Poof', 'Noodles', 'Rocket', 'Penguin', 'Hush', 'Zap', 'Toast' (considered a negative response).
    
    
  Respond with a JSON object containing:
  - 'category': the identified category.
  - 'isNegative': 'true' if the category is negative, 'false' if it's positive or neutral.
  - 'reason': a brief explanation of why the email was categorized as such.`,
        },
        { role: "user", content: messageContent },
      ],
      temperature: 0.3,
    };

    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const assistantReply = response.data.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantReply);
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Assistant response could not be parsed as JSON.",
      });
    }

    res.json({
      success: true,
      category: parsedResponse.category || "none",
      isNegative: parsedResponse.isNegative || false,
      reason: parsedResponse.reason || "No explanation provided.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response ? error.response.data : error.message,
    });
  }
};
