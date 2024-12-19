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
  const INVOICE_PAID_TYPE = "InvoicePaid";
  const { payment } = req.body;
  const customerFullName =
    payment?.customer?.name || req.body.full_name || "Unknown Customer";

  console.log("Invoice Paid Notification:");
  console.log(`Customer Full Name: ${customerFullName}`);

  const invoiceUrl = payment?.invoice?.url || "No URL provided";
  const amountPaid = payment?.total_amount || "Unknown Amount";

  const message = `Payment Confirmation:\n${customerFullName} has successfully paid the invoice ${invoiceUrl} for $${amountPaid}.\n\nNext Steps:\n1. Log the paid invoice in WHMCS under the correct customer account.\n2. Begin the project officially.\n3. Send all required onboarding documentation to the customer to ensure a smooth start.`;

  console.log(message);

  axios
    .post("https://hooks.zapier.com/hooks/catch/775472/28ov68b/", {
      message,
      type: INVOICE_PAID_TYPE,
    })
    .then(() => {
      console.log("Message successfully sent to webhook");
    })
    .catch((error) => {
      console.error("Error sending message to webhook:", error);
    });

  res.status(200).send({
    success: true,
    message: "Invoice payment notification received",
  });
};
