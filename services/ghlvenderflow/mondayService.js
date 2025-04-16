// services/mondayService.js
const axios = require("axios");

const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_API_KEY = process.env.MONDAY_API;

const fetchItem = async (id) => {
  // Build the query based on the provided id.
  const query = `
    query {
      items(ids: [${id}]) {
        id
        name
        created_at
        updated_at
        url
        column_values {
          id
          text
          type
          value
        }
      }
    }
  `;

  const response = await axios.post(
    MONDAY_API_URL,
    { query },
    {
      headers: {
        Authorization: MONDAY_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  // Depending on the structure returned from Monday, adjust as needed.
  return response.data.data.items || response.data.data.items_by_column_values;
};

const fetchUsersForItem = async (userIds) => {
  const userQuery = `
    query {
      users(ids: [${userIds.join(",")}]) {
        id
        name
        email
      }
    }
  `;
  const response = await axios.post(
    MONDAY_API_URL,
    { query: userQuery },
    {
      headers: {
        Authorization: MONDAY_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.users || [];
};

module.exports = { fetchItem, fetchUsersForItem };
