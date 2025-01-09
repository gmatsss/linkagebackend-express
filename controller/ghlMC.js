const axios = require("axios");
const { DateTime } = require("luxon");
const qs = require("qs");

const MCappointment = async (req, res) => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjYya1owQ1FxTW90Uld2ZElqTVpTIiwiY29tcGFueV9pZCI6IkkxTFUyYW1aSHpQWWo2YUdXMlRCIiwidmVyc2lvbiI6MSwiaWF0IjoxNjYxMzY5OTgwMjE4LCJzdWIiOiJrVGtad2R0TWdoUHlSYWY2c0F5QSJ9.19uamtaDwx8wJ9td8gZMsmIyGNZbhL3xp3SsjjYR12Y";
  const url = "https://rest.gohighlevel.com/v1/appointments/";

  const { firstName, lastName, selectedSlot, email, phone, calendarNotes } =
    req.body;

  try {
    const slotInAWST = DateTime.fromISO(selectedSlot, {
      zone: "America/New_York",
    });

    const convertedSlot = slotInAWST.toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");

    const requestData = {
      calendarId: "XDUebDaCah41k7owkJ1l",
      selectedTimezone: "America/New_York",
      selectedSlot: convertedSlot,
      email,
      firstName,
      lastName,
      phone,
      calendarNotes,
    };

    console.log("Request Data:", requestData);

    const response = await axios.post(url, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("API Response:", response);
    console.log("Response Data:", response.data);

    res.status(200).json({
      message: "Appointment created successfully",
      hasBooked: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error creating appointment:", error.message);
    let hasBooked = false;

    if (error.response) {
      console.error("Error Response Data:", error.response.data);
      if (error.response.status === 422 && error.response.data.selectedSlot) {
        res.status(200).json({
          message: error.response.data.selectedSlot.message,
          hasBooked: false,
        });
        return;
      }
    }

    res.status(500).json({
      message: "Failed to create appointment",
      hasBooked,
      error: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          }
        : error.message,
    });
  }
};

const calculateDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate - startDate) / (1000 * 60);
};

const reSchedMCappointment = async (req, res) => {
  try {
    const { calendar, customData } = req.body;

    if (
      !calendar ||
      !calendar.startTime ||
      !calendar.endTime ||
      !calendar.selectedTimezone ||
      !customData ||
      !customData.name ||
      !customData.email
    ) {
      return res.status(400).json({
        message: "Missing necessary calendar or contact data",
      });
    }

    const startTime = calendar.startTime;
    const endTime = calendar.endTime;
    const timeZone = calendar.selectedTimezone;
    const participantName = customData.name;
    const participantEmail = customData.email;

    const getToken = async () => {
      const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
      const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
      const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

      const credentials = `${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`;
      const encodedCredentials = Buffer.from(credentials).toString("base64");

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Host: "zoom.us",
        },
      };

      const response = await axios.request(config);
      return response.data.access_token;
    };

    const token = await getToken();

    const zoomMeetingData = {
      topic: `Meeting with ${participantName}`,
      type: 2,
      start_time: startTime,
      duration: calculateDuration(startTime, endTime),
      timezone: timeZone,
      agenda: `Meeting with ${participantName}`,
      settings: {
        host_video: true,
        participant_video: true,
        approval_type: 0,
        registration_type: 1,
        audio: "both",
        join_before_host: true,
        enforce_login: false,
        registrants_email_notification: true,
      },
      registrants: [
        {
          email: participantEmail,
          first_name: participantName.split(" ")[0],
          last_name: participantName.split(" ")[1] || "",
        },
      ],
    };

    const response = await axios.post(
      `https://api.zoom.us/v2/users/me/meetings`,
      zoomMeetingData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { join_url } = response.data;

    res.status(200).json({
      joinMeetingURL: join_url,
      participant: {
        name: participantName,
        email: participantEmail,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create Zoom meeting",
      error: error.response ? error.response.data : error.message,
    });
  }
};

const Mcformsubmission = async (req, res) => {
  try {
    const { name, email, phone, formid } = req.body;

    console.log(req.body);

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://rest.gohighlevel.com/v1/forms/submissions?page=1&limit=1&formId=${formid}&q=${email}`,
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IjYya1owQ1FxTW90Uld2ZElqTVpTIiwiY29tcGFueV9pZCI6IkkxTFUyYW1aSHpQWWo2YUdXMlRCIiwidmVyc2lvbiI6MSwiaWF0IjoxNjYxMzY5OTgwMjE4LCJzdWIiOiJrVGtad2R0TWdoUHlSYWY2c0F5QSJ9.19uamtaDwx8wJ9td8gZMsmIyGNZbhL3xp3SsjjYR12Y",
      },
    };

    const response = await axios.request(config);

    if (response.data && response.data.submissions.length > 0) {
      const latestSubmission = response.data.submissions[0];
      const {
        name,
        email,
        createdAt,
        full_name,
        organization,
        phone,
        XFXzbGFzOH3dzvG6N1hE,
        jQzA3agN1c1EofZmpH2a,
        FdccxS3LYfhGNN2ODIjZ,
        wV5gAq9TPL9tp2UQvWKX,
        terms_and_conditions,
      } = latestSubmission;

      const filteredData = {
        name,
        email,
        createdAt,
        full_name,
        organization,
        phone,
        answer_1: XFXzbGFzOH3dzvG6N1hE,
        answer_2: jQzA3agN1c1EofZmpH2a,
        answer_3: FdccxS3LYfhGNN2ODIjZ,
        consent: wV5gAq9TPL9tp2UQvWKX,
        terms_and_conditions,
      };

      res.status(200).json({
        message: "Latest form submission retrieved successfully",
        data: filteredData,
      });
    } else {
      res.status(404).json({
        message: "No submissions found for the provided form and email",
      });
    }
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    res.status(500).json({
      message: "Failed to fetch form submissions",
      error: error.message,
    });
  }
};

module.exports = {
  MCappointment,
  reSchedMCappointment,
  Mcformsubmission,
};
