const axios = require("axios");

exports.handleEstimateAccepted = (req, res) => {
  const ESTIMATE_ACCEPTED_TYPE = "EstimateAccepted";
  const { customData } = req.body;
  const customerFullName =
    customData?.customerFullName || req.body.full_name || "Unknown Customer";

  console.log("Estimate Accepted Notification:");
  console.log(`Customer Full Name: ${customerFullName}`);

  const customerFirstName = customerFullName.split(" ")[0];

  const estimateUrl = customData?.URL || "No URL provided";

  const message = `${estimateUrl}\nA new estimate has been accepted from ${customerFullName}. An invoice has been sent to ${customerFirstName} GHL and awaiting payment.`;

  console.log(message);

  axios
    .post("https://hooks.zapier.com/hooks/catch/775472/28ov68b/", {
      message,
      type: ESTIMATE_ACCEPTED_TYPE,
    })
    .then(() => {
      console.log("Message successfully sent to webhook");
    })
    .catch((error) => {
      console.error("Error sending message to webhook:", error);
    });

  res.status(200).send({
    success: true,
    message: "Notification received for estimate accepted",
  });
};

exports.handleEstimateDeclined = (req, res) => {
  const ESTIMATE_DECLINED_TYPE = "EstimateDeclined";
  const { customData } = req.body;
  const customerFullName =
    customData?.customerFullName || req.body.full_name || "Unknown Customer";

  console.log("Estimate Declined Notification:");
  console.log(`Customer Full Name: ${customerFullName}`);

  const customerFirstName = customerFullName.split(" ")[0];

  const estimateUrl = customData?.URL || "No URL provided";

  const message = `${estimateUrl}\nThe estimate from ${customerFullName} has been declined. No further action is needed at this time. Please follow up with ${customerFirstName} if needed for additional clarification or revisions.`;

  console.log(message);

  axios
    .post("https://hooks.zapier.com/hooks/catch/775472/28ov68b/", {
      message,
      type: ESTIMATE_DECLINED_TYPE,
    })
    .then(() => {
      console.log("Message successfully sent to webhook");
    })
    .catch((error) => {
      console.error("Error sending message to webhook:", error);
    });

  res.status(200).send({
    success: true,
    message: "Notification received for estimate declined",
  });
};

exports.handleInvoicePaidNotif = (req, res) => {
  const { contactFullName, amount } = req.body;

  console.log("Invoice Paid Notification:");
  console.log(`Contact Full Name: ${contactFullName}`);
  console.log(`Invoice Amount: ${amount}`);

  res
    .status(200)
    .send({ success: true, message: "Invoice payment notification received" });
};

exports.handleService = async (req, res) => {
  const zapierWebhookUrl =
    "https://hooks.zapier.com/hooks/catch/775472/2sxfc6f/";

  // Extract customData and other required fields
  const { customData, workflow } = req.body;

  const doctype = "serviceContract";

  // Access fields from customData
  const ServiceName = customData?.ServiceName || "No Service Name Provided";
  const Fname = customData?.Fname || "No First Name";
  const Lname = customData?.Lname || "No Last Name";
  const Link = customData?.Link;

  const full_name = `${Fname} ${Lname}`;

  // Construct the payload for Zapier
  const payload = {
    message: `${full_name} has signed our ${ServiceName} service agreement.  Please review the document here: ${Link} `,
    doctype: doctype,
  };

  try {
    // Send message to Zapier webhook
    await axios.post(zapierWebhookUrl, payload);

    console.log("Zapier Notification Sent:", payload);
    res
      .status(200)
      .send({ success: true, message: "Notification sent to Zapier" });
  } catch (error) {
    console.error("Error sending Zapier notification:", error);
    res.status(500).send({
      success: false,
      message: "Failed to send notification to Zapier",
    });
  }
};
