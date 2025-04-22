// controllers/apiPlayController.js
const axios = require("axios");

exports.fetchApi = async (req, res) => {
  const { url, token, headers } = req.body;

  if (!url) return res.redirect("/play");

  let parsedHeaders = {};

  // Try to parse headers from textarea if present
  if (headers) {
    try {
      parsedHeaders = JSON.parse(headers);
    } catch (err) {
      return res.send(`
          <html><body style="font-family:sans-serif; padding:2rem;">
            <h2 style="color:red;">❌ Invalid JSON in headers</h2>
            <pre>${err.message}</pre>
            <a href="/play">← Go back</a>
          </body></html>
        `);
    }
  }

  // Add token if provided
  if (token) {
    parsedHeaders["Authorization"] = token;
  }

  console.log("🚀 Final headers sent:", parsedHeaders);

  try {
    const { data } = await axios.get(url, {
      headers: parsedHeaders,
    });

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>API Response</title>
          <style>
            body {
              margin: 0;
              padding: 2rem;
              background: #f5f7fa;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .response-card {
              background: #ffffff;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              max-width: 800px;
              width: 100%;
            }
            h1 {
              font-size: 1.75rem;
              color: #4e8cff;
              margin-bottom: 1rem;
              text-align: center;
            }
            pre {
              background: #f4f4f4;
              padding: 1rem;
              border-radius: 8px;
              font-size: 0.95rem;
              font-family: Consolas, monospace;
              overflow-x: auto;
              white-space: pre-wrap;
              max-height: 70vh;
            }
            a {
              display: block;
              text-align: center;
              margin-top: 1.5rem;
              color: #4e8cff;
              text-decoration: none;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="response-card">
            <h1>✅ API Response</h1>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <a href="/play">← Try another</a>
          </div>
        </body>
        </html>
      `);
  } catch (err) {
    return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Invalid Request</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #fefefe;
              color: #333;
              padding: 2rem;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .error-card {
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              padding: 2rem;
              max-width: 600px;
              width: 100%;
              border-left: 6px solid #f44336;
            }
            h2 {
              color: #f44336;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            h2::before {
              content: "❌";
              font-size: 1.5rem;
            }
            p {
              margin: 1rem 0;
              line-height: 1.5;
            }
            pre {
              background: #f4f4f4;
              padding: 1rem;
              border-radius: 8px;
              overflow-x: auto;
              font-size: 0.9rem;
            }
            ul {
              margin-top: 0.5rem;
              padding-left: 1.2rem;
            }
            a {
              display: inline-block;
              margin-top: 1.5rem;
              color: #4e8cff;
              text-decoration: none;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="error-card">
            <h2>Invalid JSON in Headers</h2>
            <p>The headers you entered are not in valid JSON format. Here's what went wrong:</p>
            <pre>${err.message}</pre>
            <p>✅ Make sure your JSON headers look like this:</p>
            <pre>{
        "X-Custom-Header": "value"
      }</pre>
            <p>✅ For Authorization tokens, it’s safer to use the dedicated field and type:</p>
            <ul>
              <li><code>Bearer YOUR_API_TOKEN</code></li>
              <li>Not just the token alone</li>
            </ul>
            <a href="/play">← Go back and fix it</a>
          </div>
        </body>
        </html>
      `);
  }
};
