const axios = require("axios");
const { sendDiscordMessage } = require("../services/discordBotService");

exports.re3luxuryOpenEvents = async (req, res) => {
  const campaignIdFilter = "1904684e-03fa-4ae1-b93b-871d407c52be";
  const targetCampaignId = "2e9776c5-b65d-4491-b15d-7386051f0fb8";
  const apiKey = "vc81ndan0f4yg2pghnzwz7yq4pnv";
  const discordChannelId = "1329296261127606272";
  const mentionUserId = "336794456063737857"; // Your Discord user ID

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

      await sendDiscordMessage({
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
      });

      res.send("Lead successfully added to the target campaign.");
    } catch (error) {
      await sendDiscordMessage({
        title: "Lead Transfer Failed",
        statusCode: 500,
        message: `Failed to transfer lead to campaign. Error: ${error.message}\n\n<@${mentionUserId}> Please check this issue.`,
        channelId: discordChannelId,
      });

      res.status(500).send("Failed to add lead to the target campaign.");
    }
  } else {
    res.send("Request received but campaign ID did not match.");
  }
};

exports.re3luxuryLinkclickEvents = async (req, res) => {
  const campaignMappings = {
    "1904684e-03fa-4ae1-b93b-871d407c52be":
      "abe29626-4f6d-4f41-bec9-3cae771e815e", // RE3 Luxury Link Click
    "4e7988c6-ee4c-4f1b-be97-a1fd49b5aa94":
      "aeb07961-bb9b-47ed-88d5-09a8b997f8a6", // ACT Family
  };

  const apiKey = "vc81ndan0f4yg2pghnzwz7yq4pnv";
  const discordChannelId = "1329296261127606272";
  const mentionUserId = "336794456063737857"; // Your user ID for mentions

  const targetCampaignId = campaignMappings[req.body.campaign_id];

  if (targetCampaignId) {
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
        title: `Lead Transfer Successful to ${
          req.body.campaign_id === "1904684e-03fa-4ae1-b93b-871d407c52be"
            ? "RE3 Luxury Real Estate Link Click"
            : "ACT Family Target Campaign"
        }`,
        statusCode: response.status,
        message: `Lead successfully transferred to campaign "${
          req.body.campaign_name
        }".\n\n**Lead Data:**\nEmail: ${lead.email}\nFirst Name: ${
          lead.first_name
        }\nLast Name: ${lead.last_name}\nCompany Name: ${
          lead.company_name
        }\nPhone: ${lead.phone}\nWebsite: ${
          lead.website
        }\nCustom Variables: ${JSON.stringify(lead.custom_variables, null, 2)}`,
        channelId: discordChannelId,
      };

      await sendDiscordMessage(discordMessage);

      res.send("Lead successfully added to the target campaign.");
    } catch (error) {
      await sendDiscordMessage({
        title: `Lead Transfer Failed for ${
          req.body.campaign_id === "1904684e-03fa-4ae1-b93b-871d407c52be"
            ? "RE3 Luxury Real Estate Link Click"
            : "ACT Family Target Campaign"
        }`,
        statusCode: 500,
        message: `Failed to transfer lead to campaign. Error: ${error.message}\n\n<@${mentionUserId}> Please check this issue.`,
        channelId: discordChannelId,
      });

      res.status(500).send("Failed to add lead to the target campaign.");
    }
  } else {
    res.status(400).send("Campaign ID did not match any target campaigns.");
  }
};

exports.re3luxydownloadevent = async (req, res) => {
  const apiKey = "vc81ndan0f4yg2pghnzwz7yq4pnv";
  const sourceCampaignId = "1904684e-03fa-4ae1-b93b-871d407c52be";
  const targetCampaignId = "c2c3f672-242a-4bb2-b9da-c51c03dc68b5";
  const discordChannelId = "1329296261127606272";
  const mentionUserId = "336794456063737857"; // Your Discord User ID

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
        message: `No lead data found for email: ${email}\n\n<@${mentionUserId}> Please check this issue.`,
        channelId: discordChannelId,
      });

      res.status(404).send("No lead data found for the given email.");
    }
  } catch (error) {
    await sendDiscordMessage({
      title: "Lead Transfer Failed",
      statusCode: 500,
      message: `An error occurred while processing the lead. Error: ${error.message}\n\n<@${mentionUserId}> Please check this issue.`,
      channelId: discordChannelId,
    });

    res.status(500).send("An error occurred while processing the lead.");
  }
};

exports.re3luxuryReplyEvents = async (req, res) => {
  const re3CampaignIdFilters = [
    "1904684e-03fa-4ae1-b93b-871d407c52be", // RE3 Luxury Real Estate
    "2e9776c5-b65d-4491-b15d-7386051f0fb8", // RE3 Luxury Real Estate Opened Email
    "abe29626-4f6d-4f41-bec9-3cae771e815e", // RE3 Luxury Real Estate Link Click
    "c2c3f672-242a-4bb2-b9da-c51c03dc68b5", // RE3 Luxury Real Estate Download Guide
  ];

  const actFamilyCampaignIdFilters = [
    "aeb07961-bb9b-47ed-88d5-09a8b997f8a6", // ACT Family link click
    "4e7988c6-ee4c-4f1b-be97-a1fd49b5aa94", // ACT Family main
  ];

  const allCampaignIdFilters = [
    ...re3CampaignIdFilters,
    ...actFamilyCampaignIdFilters,
  ];

  const discordChannelId = "1329296261127606272";
  const mentionUserId = "336794456063737857"; // Your Discord User ID
  const apiKey = "vc81ndan0f4yg2pghnzwz7yq4pnv";

  if (!allCampaignIdFilters.includes(req.body.campaign_id)) {
    return res.status(400).send("Campaign ID did not match the filters.");
  }

  const filterwebhook = actFamilyCampaignIdFilters.includes(
    req.body.campaign_id
  )
    ? "ACT Family"
    : "RE3 Camp";

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
    filterwebhook,
  };

  try {
    const analyzeResponse = await axios.post(
      "http://express-alb-531989323.us-east-1.elb.amazonaws.com/openai/chatme",
      { message: req.body.reply_text },
      { headers: { "Content-Type": "application/json" } }
    );

    const analysis = analyzeResponse.data;

    if (analysis.isNegative === "true") {
      try {
        const deleteResponse = await axios.post(
          "https://api.instantly.ai/api/v1/lead/delete",
          {
            api_key: apiKey,
            campaign_id: req.body.campaign_id,
            delete_all_from_company: false,
            delete_list: [req.body.email],
          },
          { headers: { "Content-Type": "application/json" } }
        );

        if (
          deleteResponse.status === 200 &&
          deleteResponse.data.status === "success" &&
          deleteResponse.data.deleted > 0
        ) {
          await sendDiscordMessage({
            title: "Negative Reply Received",
            statusCode: 200,
            message: `A negative reply has been received for the lead:\n\n**Email:** ${req.body.email}\n**Campaign Name:** ${req.body.campaign_name}\n\nThe lead has been removed from the campaign.`,
            channelId: discordChannelId,
          });

          return res.status(200).send({
            message: "Email reply categorized as negative. Lead removed.",
            analysis,
            delete_response: deleteResponse.data,
          });
        } else {
          throw new Error("Lead deletion failed.");
        }
      } catch (deleteError) {
        await sendDiscordMessage({
          title: "Lead Deletion Error",
          statusCode: 500,
          message: `Failed to delete lead from the campaign.\n\n**Email:** ${req.body.email}\n**Error:** ${deleteError.message}\n<@${mentionUserId}> Please investigate.`,
          channelId: discordChannelId,
        });

        return res.status(500).send({
          message: "Error occurred during lead deletion.",
          error: deleteError.response?.data || deleteError.message,
        });
      }
    } else if (analysis.isNegative === "false") {
      const webhookResponse = await axios.post(
        "https://hook.us2.make.com/4rvbhodrp5deg54dciiipnbyeonc3otn",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      await sendDiscordMessage({
        title: "Positive Reply Synced",
        statusCode: 200,
        message: `A positive reply has been received and successfully synced:\n\n**Email:** ${req.body.email}\n**Campaign Name:** ${req.body.campaign_name}\n\nThe lead has been posted to Make.com.`,
        channelId: discordChannelId,
      });

      return res.status(200).send({
        message: "Lead and reply data successfully sent to the webhook.",
        analysis,
        webhook_response: webhookResponse.data,
      });
    } else {
      throw new Error("Invalid analysis result.");
    }
  } catch (error) {
    await sendDiscordMessage({
      title: "Processing Error",
      statusCode: 500,
      message: `An error occurred while processing the reply.\n\n**Error:** ${error.message}\n<@${mentionUserId}> Please investigate.`,
      channelId: discordChannelId,
    });

    return res.status(500).send({
      message: "An error occurred during the process.",
      error: error.response?.data || error.message,
    });
  }
};
