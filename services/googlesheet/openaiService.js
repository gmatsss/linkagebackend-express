const axios = require("axios");

const openAICall = async (prompt) => {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful SEO assistant." },
        { role: "user", content: prompt },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.choices?.[0]?.message?.content || "";
};

exports.processSEOAgent = async (rowData) => {
  const [keyword, title, metaDesc, userOutline] = rowData;

  // AGENT 1: Strategist
  const outlinePrompt = `Given the keyword "${keyword}" and title "${title}", refine or create an SEO-optimized blog post outline with H2s and a meta description. User suggested outline: ${userOutline}`;
  const refinedOutline = await openAICall(outlinePrompt);

  // AGENT 2: Writer
  const contentPrompt = `Using the outline below, write a 600-word SEO-optimized blog post that includes this meta description: "${metaDesc}". Make it engaging and keyword-rich.\n\nOutline:\n${refinedOutline}`;
  let content = await openAICall(contentPrompt);

  // AGENT 3: Critique Bot
  const critiquePrompt = `Critique the following blog post for SEO best practices, tone, keyword density, and readability. If any part needs improvement, clearly explain why.\n\nContent:\n${content}`;
  const critique = await openAICall(critiquePrompt);

  // AGENT 4: Rewriter
  if (
    critique.toLowerCase().includes("improve") ||
    critique.toLowerCase().includes("rewrite")
  ) {
    const rewritePrompt = `Revise the blog post below based on this critique:\n${critique}\n\nContent:\n${content}`;
    content = await openAICall(rewritePrompt);
  }

  return { content, refinedOutline, critique };
};
