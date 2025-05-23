exports.validateSubscription = (req, res) => {
  const validationToken = req.query.validationToken;

  if (validationToken) {
    console.log("✅ Validation token received:", validationToken);
    res.status(200).set("Content-Type", "text/plain").send(validationToken);
  } else {
    console.log("❌ No validationToken in request");
    res.status(400).send("Missing validationToken");
  }
};

// POST notification
exports.handleNotification = (req, res) => {
  console.log("🔍 Headers:", req.headers);
  console.log("📦 Body:", req.body);

  if (req.body?.value?.length) {
    req.body.value.forEach((item) => {
      console.log("📩 New Notification:", item);
    });
  } else {
    console.warn("⚠️ No notification data received or wrong format.");
  }

  res.sendStatus(202);
};
