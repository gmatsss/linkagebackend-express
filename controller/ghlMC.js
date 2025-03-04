const axios = require("axios");
const { DateTime } = require("luxon");
const qs = require("qs");
const { sendDiscordMessage } = require("../services/discordBotService");

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
        eqcvFXq0jkO3am4seuSQ,
        P4Y5bi25ziMyWVXUv53C,
        Hx4pdtM6Y13CybWp7l0z,
        aVfawNKKVwVBIuF5ZD5q,
        zHO8jp0OSu78iO9jJhwF,
        u3Wu25TQ9C3FfpbY9vCw,
        cKf2OPxVMsfckikhayyl,
        dcQTWd3KMGiEHwmLSilw,
        qhLNSpj2JzD2nV3PxroV,
        i9rXxmHVUVA3pqNypmAr,
        YEoZk4DZMvwfNHJrETaw,
        JO12h57aq4PMWkWSDDJl,
        fWx6Ubq742QlaQqK9e4z,
        v9NC8ZRjPBXOgrCeWuhC,
        a4gzdet9xvTkXoKDh989,
        JkJF9O1YKe8r2p3BGfmz,
        "0KoLtHsWdCvMpJqZlUsl": newField_1,
        qCFjBrTccs05CFOag6Vt: newField_2,
        nzdiDlCVE7sXUkyePmOF: newField_3,
        GfetwqDy5wQS2WvSdM30: newField_4,
        "6wWSo6j66T3IPwnbSTz0": newField_5,
        oQq0RZOr0RQyFhZFACT1: newField_6,
        "9vGxxGQCEk43mz3jMoXj": newField_7,
        Vpg8W9bMuHEkMVnKN0cw: newField_8,
        "84tGrhrAfnZFnyelbFNN": answer_8,
        yB3nAnX0V2Wn2tEm5kd1,
        "9UDCoybzi2y2xgSnmr7T": answer_10,
        edxudbdwpYW68ijGbA4V,
        Z5vvzKoV9xk5cOw06gzv,
        "5nqMhitQTndgnA9SPqSe": answer_13,
        "6FFZ7WxpITNKY6A9ebAS": answer_14,
        godo08Udepym17XiuhA1,
        kMJgRUoOSlJCj6uYAW6d,
        vveeGd7Y7giZSFIR9z8J,
        gcJPR4aiZdJn5A5IqcsM,
        FdccxS3LYfhGNN2ODIjZ,
        wV5gAq9TPL9tp2UQvWKX,
        By3l1KvKgo46nAEL738p: sales_goals,
        pn09m7As5qwiS6GN8b1Q: ad_placements,
        TRKNMcITeblW2L5WDK3U: marketing_strategies,
        lpzDWaptfESKosRpK7Sh,
        TI3rInDH2wSjoXkPgMsA,
        bzFNzVpXSPHAjooew3q9,
        vK5qCyTLvdBiSIIcQYvm,
        JdEpFctCu5JamqpprBew,
        fL24nsVKqiwVufL4BB9p,
        sYojiIitO0Iavfhnlva1,
        bxVi2KQismyUDcXY861x,
        RIMXydEeXQLMSlaiYStD,
        Ii2OwRLg2clYtYVr6Ufa,
        vfDdG0NaEcU6R4HYajiZ,
        XvsQ9pnik7yDabMhVMPD,
        IH0kE3qpVT7ekFyHAIaz,
        WLyOupyC4oqcmdhfbFxH,
        bOXD6fkMwvZfbr4WnJGm,
        cKUuOZzjkRhykgy9kZox,
        "1uk3Obc7GCvgIuVncM9E": answer_21,
        yfmwteC8oVTCuc57sN1O,
        k7hkWtxaHGMpcbqqNhwe,
        mtPZwjY6IoRjYSUcow2B,
        y2lucYVuo0datEPLaBTF,
        terms_and_conditions,
        MlMZTMng271w7Aq8Isne,
        sWwblt4RkSUcxHs1BSN2,
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
        answer_4: JO12h57aq4PMWkWSDDJl,
        answer_5: fWx6Ubq742QlaQqK9e4z,
        answer_6: v9NC8ZRjPBXOgrCeWuhC,
        answer_7: a4gzdet9xvTkXoKDh989,
        answer_8: answer_8,
        answer_9: yB3nAnX0V2Wn2tEm5kd1,
        answer_10: answer_10,
        answer_11: edxudbdwpYW68ijGbA4V,
        answer_12: Z5vvzKoV9xk5cOw06gzv,
        answer_13: answer_13,
        answer_14: answer_14,
        answer_15: godo08Udepym17XiuhA1,
        answer_16: kMJgRUoOSlJCj6uYAW6d,
        answer_17: vveeGd7Y7giZSFIR9z8J,
        answer_18: gcJPR4aiZdJn5A5IqcsM,
        answer_19: lpzDWaptfESKosRpK7Sh,
        answer_20: TI3rInDH2wSjoXkPgMsA,
        answer_21: bzFNzVpXSPHAjooew3q9,
        answer_22: vK5qCyTLvdBiSIIcQYvm,
        answer_23: JdEpFctCu5JamqpprBew,
        answer_24: fL24nsVKqiwVufL4BB9p,
        answer_25: sYojiIitO0Iavfhnlva1,
        answer_26: bxVi2KQismyUDcXY861x,
        answer_27: RIMXydEeXQLMSlaiYStD,
        answer_28: Ii2OwRLg2clYtYVr6Ufa,
        answer_29: vfDdG0NaEcU6R4HYajiZ,
        answer_30: XvsQ9pnik7yDabMhVMPD,
        answer_31: IH0kE3qpVT7ekFyHAIaz,
        answer_32: WLyOupyC4oqcmdhfbFxH,
        answer_33: bOXD6fkMwvZfbr4WnJGm,
        answer_34: cKUuOZzjkRhykgy9kZox,
        answer_35: answer_21,
        answer_36: yfmwteC8oVTCuc57sN1O,
        answer_37: k7hkWtxaHGMpcbqqNhwe,
        answer_38: mtPZwjY6IoRjYSUcow2B,
        answer_39: y2lucYVuo0datEPLaBTF,
        answer_40: YEoZk4DZMvwfNHJrETaw,
        answer_41: JkJF9O1YKe8r2p3BGfmz,
        answer_42: eqcvFXq0jkO3am4seuSQ,
        answer_43: P4Y5bi25ziMyWVXUv53C,
        answer_44: Hx4pdtM6Y13CybWp7l0z,
        answer_45: aVfawNKKVwVBIuF5ZD5q,
        answer_46: zHO8jp0OSu78iO9jJhwF,
        answer_47: u3Wu25TQ9C3FfpbY9vCw,
        answer_48: cKf2OPxVMsfckikhayyl,
        answer_49: dcQTWd3KMGiEHwmLSilw,
        answer_50: qhLNSpj2JzD2nV3PxroV,
        answer_51: i9rXxmHVUVA3pqNypmAr,
        answer_52: newField_1,
        answer_53: newField_2,
        answer_54: newField_3,
        answer_55: newField_4,
        answer_56: newField_5,
        answer_57: newField_6,
        answer_58: newField_7,
        answer_59: newField_8,
        answer_60: MlMZTMng271w7Aq8Isne,
        answer_61: sWwblt4RkSUcxHs1BSN2,
        sales_goals,
        ad_placements,
        marketing_strategies,
        consent: wV5gAq9TPL9tp2UQvWKX,
        terms_and_conditions,
      };

      let content = `**Email:** ${email}\n**Data:** ${JSON.stringify(
        filteredData,
        null,
        2
      )}`;
      if (content.length > 1800) {
        content = content.substring(0, 1800) + "...";
      }
      const payload = {
        title: "New Form Submission Retrieved",
        statusCode: 200,
        content,
        channelId: "1346272587088531499",
      };
      await sendDiscordMessage(payload);

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

    await sendDiscordMessage({
      title: "Error Fetching Form Submission",
      statusCode: 500,
      message: `<@336794456063737857> **Error:** ${error.message}\n**Email:** ${req.body.email}`,
      channelId: "1346272587088531499",
    });

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
