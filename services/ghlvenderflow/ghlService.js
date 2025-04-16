// services/ghlService.js
const axios = require("axios");

const getGHLUserIdByEmail = async (email) => {
  try {
    let allUsers = [];
    let page = 1;
    const limit = 50;
    const locationId = "cgAQMEZGL1qQIq1fJXJ3";
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        "https://rest.gohighlevel.com/v1/users/",
        {
          headers: {
            Authorization: `Bearer ${process.env.GHL_VENDERFLOW}`,
            "Content-Type": "application/json",
          },
          params: { page, limit, locationId },
        }
      );

      let users;
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        users = response.data.users;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      } else {
        throw new Error("Unexpected users response format");
      }

      if (!users.length) {
        hasMore = false;
        break;
      }

      allUsers = allUsers.concat(users);

      if (users.length < limit) {
        hasMore = false;
      } else {
        page++;
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = allUsers.find(
      (user) =>
        user.email && user.email.trim().toLowerCase() === normalizedEmail
    );

    return matchedUser ? matchedUser.id : null;
  } catch (error) {
    console.error("Error fetching GHL users:", error.message);
    throw error;
  }
};

module.exports = { getGHLUserIdByEmail };
