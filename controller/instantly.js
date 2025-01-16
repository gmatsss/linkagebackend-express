const axios = require("axios");
const { sendDiscordMessage } = require("../services/discordBotService");

exports.re3luxuryOpenEvents = async (req, res) => {
  const campaignIdFilter = "1904684e-03fa-4ae1-b93b-871d407c52be";
  const targetCampaignId = "2e9776c5-b65d-4491-b15d-7386051f0fb8";
  const apiKey = "vc81ndan0f4yg2pghnzwz7yq4pnv";
  const discordChannelId = "1329296261127606272";

  if (req.body.campaign_id === campaignIdFilter) {
    const lead = {
      email: req.body.lead_email,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      company_name: req.body.companyName,
      personalization: `Lead from campaign ${req.body.campaign_name}`,
      phone: req.body.phone,
      website: req.body.website,
      custom_variables: {
        Title: req.body.Title,
        Industry: req.body.Industry,
        City: req.body.City,
        State: req.body.State,
        Company_City: req.body["Company City"],
        Company_State: req.body["Company State"],
        Annual_Revenue: req.body["Annual Revenue"],
        Company_Address: req.body["Company Address"],
        Linkedin_Url: req.body["Person Linkedin Url"],
        Company_Linkedin_Url: req.body["Company Linkedin Url"],
        Facebook_Url: req.body["Facebook Url"],
        Twitter_Url: req.body["Twitter Url"],
        Employees: req.body["# Employees"],
      },
    };

    const payload = {
      api_key: apiKey,
      campaign_id: targetCampaignId,
      skip_if_in_workspace: false,
      skip_if_in_campaign: false,
      leads: [lead],
    };

    try {
      const response = await axios.post(
        "https://api.instantly.ai/api/v1/lead/add",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const discordMessage = {
        title: "Lead Transfer Successful to RE3 Luxury Real Estate Open email",
        statusCode: response.status,
        message: `Lead successfully transferred to campaign "RE3 Luxury Real Estate Opened Email".\n\n**Lead Data:**\nEmail: ${
          lead.email
        }\nFirst Name: ${lead.first_name}\nLast Name: ${
          lead.last_name
        }\nCompany Name: ${lead.company_name}\nPhone: ${lead.phone}\nWebsite: ${
          lead.website
        }\nCustom Variables: ${JSON.stringify(lead.custom_variables, null, 2)}`,
        channelId: discordChannelId,
      };

      await sendDiscordMessage(discordMessage);

      res.send("Lead successfully added to the target campaign.");
    } catch (error) {
      await sendDiscordMessage({
        title: "Lead Transfer Failed",
        statusCode: 500,
        message: `Failed to transfer lead to campaign. Error: ${error.message}`,
        channelId: discordChannelId,
      });

      res.status(500).send("Failed to add lead to the target campaign.");
    }
  } else {
    res.send("Request received but campaign ID did not match.");
  }
};

exports.re3luxuryLinkclickEvents = async (req, res) => {
  const campaignIdFilter = "1904684e-03fa-4ae1-b93b-871d407c52be";
  const targetCampaignId = "abe29626-4f6d-4f41-bec9-3cae771e815e";
  const apiKey = "vc81ndan0f4yg2pghnzwz7yq4pnv";
  const discordChannelId = "1329296261127606272";

  if (req.body.campaign_id === campaignIdFilter) {
    const lead = {
      email: req.body.lead_email,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      company_name: req.body.companyName,
      personalization: `Lead from campaign ${req.body.campaign_name}`,
      phone: req.body.phone,
      website: req.body.website,
      custom_variables: {
        Title: req.body.Title,
        Industry: req.body.Industry,
        City: req.body.City,
        State: req.body.State,
        Company_City: req.body["Company City"],
        Company_State: req.body["Company State"],
        Annual_Revenue: req.body["Annual Revenue"],
        Company_Address: req.body["Company Address"],
        Linkedin_Url: req.body["Person Linkedin Url"],
        Company_Linkedin_Url: req.body["Company Linkedin Url"],
        Facebook_Url: req.body["Facebook Url"],
        Twitter_Url: req.body["Twitter Url"],
        Employees: req.body["# Employees"],
      },
    };

    const payload = {
      api_key: apiKey,
      campaign_id: targetCampaignId,
      skip_if_in_workspace: false,
      skip_if_in_campaign: false,
      leads: [lead],
    };

    try {
      const response = await axios.post(
        "https://api.instantly.ai/api/v1/lead/add",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const discordMessage = {
        title: "Lead Transfer Successful to RE3 Luxury Real Estate Link Click",
        statusCode: response.status,
        message: `Lead successfully transferred to campaign "RE3 Luxury Real Estate Link Click".\n\n**Lead Data:**\nEmail: ${
          lead.email
        }\nFirst Name: ${lead.first_name}\nLast Name: ${
          lead.last_name
        }\nCompany Name: ${lead.company_name}\nPhone: ${lead.phone}\nWebsite: ${
          lead.website
        }\nCustom Variables: ${JSON.stringify(lead.custom_variables, null, 2)}`,
        channelId: discordChannelId,
      };

      await sendDiscordMessage(discordMessage);

      res.send("Lead successfully added to the target campaign.");
    } catch (error) {
      await sendDiscordMessage({
        title: "Lead Transfer Failed",
        statusCode: 500,
        message: `Failed to transfer lead to campaign. Error: ${error.message}`,
        channelId: discordChannelId,
      });

      res.status(500).send("Failed to add lead to the target campaign.");
    }
  } else {
    res.send("Request received but campaign ID did not match.");
  }
};

exports.re3luxydownloadevent = async (req, res) => {
  const apiKey = "vc81ndan0f4yg2pghnzwz7yq4pnv";
  const sourceCampaignId = "1904684e-03fa-4ae1-b93b-871d407c52be";
  const targetCampaignId = "c2c3f672-242a-4bb2-b9da-c51c03dc68b5";
  const discordChannelId = "1329296261127606272";

  if (!req.body.email) {
    res.status(400).send("Email is required.");
    return;
  }

  const email = req.body.email;

  try {
    const getResponse = await axios.get(
      `https://api.instantly.ai/api/v1/lead/get?api_key=${apiKey}&campaign_id=${sourceCampaignId}&email=${encodeURIComponent(
        email
      )}`
    );

    const leadArray = getResponse.data;

    if (Array.isArray(leadArray) && leadArray.length > 0) {
      const leadData = leadArray[0];

      const lead = {
        email: leadData.lead_data.email,
        first_name: leadData.lead_data.firstName,
        last_name: leadData.lead_data.lastName,
        company_name: leadData.lead_data.companyName,
        personalization: `Lead from campaign ${leadData.campaign_name}`,
        phone: leadData.lead_data.phone,
        website: leadData.lead_data.website,
        custom_variables: {
          Title: leadData.lead_data.Title,
          Industry: leadData.lead_data.Industry,
          City: leadData.lead_data.City,
          State: leadData.lead_data.State,
          Company_City: leadData.lead_data["Company City"],
          Company_State: leadData.lead_data["Company State"],
          Annual_Revenue: leadData.lead_data["Annual Revenue"],
          Company_Address: leadData.lead_data["Company Address"],
          Linkedin_Url: leadData.lead_data["Person Linkedin Url"],
          Company_Linkedin_Url: leadData.lead_data["Company Linkedin Url"],
          Facebook_Url: leadData.lead_data["Facebook Url"],
          Twitter_Url: leadData.lead_data["Twitter Url"],
          Employees: leadData.lead_data["# Employees"],
        },
      };

      const payload = {
        api_key: apiKey,
        campaign_id: targetCampaignId,
        skip_if_in_workspace: false,
        skip_if_in_campaign: false,
        leads: [lead],
      };

      const postResponse = await axios.post(
        "https://api.instantly.ai/api/v1/lead/add",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const discordMessage = {
        title: "Lead Transfer Successful RE3 Luxury Real Estate Download",
        statusCode: postResponse.status,
        message: `Lead successfully transferred to campaign "RE3 Luxury Real Estate Download".\n\n**Lead Data:**\nEmail: ${
          lead.email
        }\nFirst Name: ${lead.first_name}\nLast Name: ${
          lead.last_name
        }\nCompany Name: ${lead.company_name}\nPhone: ${lead.phone}\nWebsite: ${
          lead.website
        }\nCustom Variables: ${JSON.stringify(lead.custom_variables, null, 2)}`,
        channelId: discordChannelId,
      };

      await sendDiscordMessage(discordMessage);

      res.status(200).send({
        message: "Lead successfully transferred to the target campaign.",
        lead: leadData,
        target_response: postResponse.data,
      });
    } else {
      await sendDiscordMessage({
        title: "No Lead Found",
        statusCode: 404,
        message: `No lead data found for email: ${email}`,
        channelId: discordChannelId,
      });

      res.status(404).send("No lead data found for the given email.");
    }
  } catch (error) {
    await sendDiscordMessage({
      title: "Lead Transfer Failed",
      statusCode: 500,
      message: `An error occurred while processing the lead. Error: ${error.message}`,
      channelId: discordChannelId,
    });

    res.status(500).send("An error occurred while processing the lead.");
  }
};

exports.re3luxuryReplyEvents = async (req, res) => {
  const campaignIdFilters = [
    "1904684e-03fa-4ae1-b93b-871d407c52be", // RE3 Luxury Real Estate
    "2e9776c5-b65d-4491-b15d-7386051f0fb8", // RE3 Luxury Real Estate Opened Email
    "abe29626-4f6d-4f41-bec9-3cae771e815e", // RE3 Luxury Real Estate Link Click
    "c2c3f672-242a-4bb2-b9da-c51c03dc68b5", // RE3 Luxury Real Estate Download Guide
  ];

  if (!campaignIdFilters.includes(req.body.campaign_id)) {
    return res.status(400).send("Campaign ID did not match the filters.");
  }

  const payload = {
    campaign_id: req.body.campaign_id,
    campaign_name: req.body.campaign_name,
    workspace: req.body.workspace,
    event_type: req.body.event_type,
    email: req.body.email,
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    phone: req.body.phone,
    website: req.body.website,
    title: req.body.Title,
    industry: req.body.Industry,
    city: req.body.City,
    state: req.body.State,
    company_name: req.body.companyName,
    company_city: req.body["Company City"],
    company_state: req.body["Company State"],
    company_address: req.body["Company Address"],
    annual_revenue: req.body["Annual Revenue"],
    linkedin_url: req.body["Person Linkedin Url"],
    company_linkedin_url: req.body["Company Linkedin Url"],
    facebook_url: req.body["Facebook Url"],
    twitter_url: req.body["Twitter Url"],
    employees: req.body["# Employees"],
    reply_text: req.body.reply_text,
    reply_subject: req.body.reply_subject,
    reply_snippet: req.body.reply_text_snippet,
    is_first_reply: req.body.is_first,
    unibox_url: req.body.unibox_url,
    filterwebhook: "RE3 Camp",
  };

  try {
    const analyzeResponse = await axios.post(
      "http://express-alb-531989323.us-east-1.elb.amazonaws.com/openai/chatme",
      { message: req.body.reply_text },
      { headers: { "Content-Type": "application/json" } }
    );

    const analysis = analyzeResponse.data;

    if (analysis.isNegative === true) {
      console.log("negative");
      return res.status(200).send({
        message:
          "Email reply categorized as negative. No further action taken.",
        analysis,
      });
    }

    const webhookResponse = await axios.post(
      "https://hook.us2.make.com/4rvbhodrp5deg54dciiipnbyeonc3otn",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    res.status(200).send({
      message: "Lead and reply data successfully sent to the webhook.",
      analysis,
      webhook_response: webhookResponse.data,
    });
  } catch (error) {
    res.status(500).send({
      message: "An error occurred during the process.",
      error: error.response?.data || error.message,
    });
  }
};
