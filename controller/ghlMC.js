const axios = require("axios");
const { DateTime } = require("luxon");

const MCappointment = async (req, res) => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjYya1owQ1FxTW90Uld2ZElqTVpTIiwiY29tcGFueV9pZCI6IkkxTFUyYW1aSHpQWWo2YUdXMlRCIiwidmVyc2lvbiI6MSwiaWF0IjoxNjYxMzY5OTgwMjE4LCJzdWIiOiJrVGtad2R0TWdoUHlSYWY2c0F5QSJ9.19uamtaDwx8wJ9td8gZMsmIyGNZbhL3xp3SsjjYR12Y";
  const url = "https://rest.gohighlevel.com/v1/appointments/";

  const { firstName, lastName, selectedSlot, email, phone } = req.body;

  try {
    const slotInAWST = DateTime.fromISO(selectedSlot, {
      zone: "Australia/Perth",
    });

    const convertedSlot = slotInAWST.toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

    const requestData = {
      calendarId: "Pw8RKX8XaeZCy5I6sLVN",
      selectedTimezone: "Australia/Perth",
      selectedSlot: convertedSlot,
      email,
      firstName,
      lastName,
      phone,
    };

    console.log("Request Data:", requestData);

    const response = await axios.post(url, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Response Data:", response.data);
    res.status(200).json({
      message: "Appointment created successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Error creating appointment:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      message: "Failed to create appointment",
      error: error.response ? error.response.data : error.message,
    });
  }
};

module.exports = {
  MCappointment,
};
