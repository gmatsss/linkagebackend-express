const axios = require("axios");

exports.fetchApi = async (req, res) => {
  const { url, token, headers } = req.body;

  if (!url) return res.redirect("/play");

  let parsedHeaders = {};

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

  if (token) {
    parsedHeaders["Authorization"] = token;
  }

  try {
    const { data } = await axios.get(url, { headers: parsedHeaders });

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Loading...</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f5f7fa;
          }
          .loader {
            border: 8px solid #f3f3f3;
            border-top: 8px solid #4e8cff;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 {
            margin-top: 1.5rem;
            color: #4e8cff;
          }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h2>Loading API Response...</h2>
        <script>
          setTimeout(function() {
            document.body.innerHTML = \`
              <div style="max-width:800px;padding:2rem;margin:auto;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <h1 style="text-align:center;color:#4e8cff;">✅ API Response</h1>
                <pre style="background:#f4f4f4;padding:1rem;border-radius:8px;overflow:auto;font-family:Consolas,monospace;">${JSON.stringify(
                  data,
                  null,
                  2
                )}</pre>
                <div style="text-align:center;margin-top:1rem;">
                  <a href="/play" style="color:#4e8cff;text-decoration:none;font-weight:bold;">← Try another</a>
                </div>
              </div>
            \`;
          }, 1000);
        </script>
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
          pre {
            background: #f4f4f4;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 0.9rem;
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
          <h2>API Request Failed</h2>
          <pre>${err.message}</pre>
          <a href="/play">← Go back</a>
        </div>
      </body>
      </html>
    `);
  }
};
