const getWelcomeMessage = (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Linkage Backend – Express + AWS</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
        <style>
          :root {
            --primary: #4e8cff;
            --accent: #ff6a3d;
            --bg: #f5f7fa;
            --text: #333;
            --light: #fff;
            --radius: 8px;
          }
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg); line-height: 1.6; }
          header { 
            background: linear-gradient(120deg, var(--primary), var(--accent)); 
            color: var(--light); 
            padding: 4rem 2rem; 
            text-align: center; 
            clip-path: ellipse(100% 80% at 50% 0);
          }
          header h1 { font-size: 3rem; margin-bottom: 0.5rem; }
          header p { font-size: 1.1rem; opacity: 0.9; }
          header h2 { margin-top: 1.5rem; font-weight: 400; }
  
          main { max-width: 960px; margin: -2rem auto 2rem; padding: 0 1rem; display: grid; gap: 2.5rem; }
          .card {
            background: var(--light);
            border-radius: var(--radius);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            padding: 1.5rem;
            transition: transform 0.2s;
          }
          .card:hover { transform: translateY(-4px); }
          .card h2 { margin-bottom: 1rem; color: var(--primary); }
          .card ul { list-style: inside disc; }
          .card ul li { margin-bottom: 0.5rem; }
  
          /* → Playground‑specific styling */
     .card.playground {
  background: #fffdfa;
  border: 1px solid #e0e0e0;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card.playground ul {
  background: #fcfcfc;
  border-radius: var(--radius);
  padding: 1rem;
  margin: 1rem 0;
  border-left: 4px solid var(--primary);
}

.card.playground code {
  background: #eef2f6;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  color: #333;
}

.card.playground .play-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius);
  text-align: center;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  align-self: flex-start;
}

.card.playground .play-btn:hover {
  background: #3a6fcc;
}

  
          footer {
            text-align: center;
            padding: 2rem 1rem;
            font-size: 0.9rem;
            color: #666;
          }
          footer a { color: var(--primary); text-decoration: none; }
          footer a:hover { text-decoration: underline; }
  
          @media (min-width: 768px) {
            main { grid-template-columns: repeat(2, 1fr); }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>🚀 Hello from Express!</h1>
          <p>Deployed via <strong>AWS ECS</strong>, <strong>GitHub Actions</strong>, and <strong>ECR</strong></p>
          <h2>🎯 Powering Linkage Service Automation</h2>
        </header>
  
        <main>
          <div class="card">
            <h2>🔧 Overview</h2>
            <p>This containerized Node.js backend drives Linkage’s workflow automation, deployed via GitHub Actions → ECR → AWS ECS. It uses <strong>DynamoDB</strong> for fast, scalable NoSQL data.</p>
          </div>
  
          <div class="card">
            <h2>📦 Deployment Stack</h2>
            <ul>
              <li><strong>Node.js & Express.js</strong></li>
              <li><strong>Docker</strong> (Fargate-ready)</li>
              <li><strong>GitHub Actions</strong> CI/CD</li>
              <li><strong>Amazon ECR</strong> registry</li>
              <li><strong>Amazon ECS (Fargate)</strong></li>
              <li><strong>CloudWatch</strong> monitoring</li>
            </ul>
          </div>
  
          <div class="card">
            <h2>🔌 Integrations</h2>
            <ul>
              <li>WooCommerce API</li>
              <li>GoHighLevel (GHL) API</li>
              <li>Discord Notifications</li>
              <li>Pancake CRM Sync</li>
              <li>Google Sheets</li>
              <li>Instantly Email Tool</li>
              <li>OpenAI (ChatGPT)</li>
              <li>WHMCS Sync</li>
              <li>Venderflow Wiki & Support</li>
              <li>Custom Test APIs</li>
              <li>DynamoDB Storage</li>
            </ul>
          </div>
  
       <div class="card playground">
  <h2>🧩 API Playground</h2>
  <p>This tool allows you to test external APIs right from your browser.</p>
  <ul>
    <li><strong>Step 1:</strong> Enter a full API URL (e.g., <code>https://api.example.com/data</code>)</li>
    <li><strong>Step 2:</strong> Optionally include an <code>Authorization</code> token and custom headers</li>
    <li><strong>Step 3:</strong> Submit and view the JSON response</li>
  </ul>

  <a href="/play" target="_blank" class="play-btn">🔗 Open API Playground</a>
</div>

        </main>
  
        <footer>
          &copy; 2025 Linkage • <a href="https://github.com/gmatsss/linkagebackend-express" target="_blank">View repo</a>
        </footer>
      </body>
      </html>
    `);
};

const showForm = (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>API Playground</title>
        <style>
          :root {
            --bg: #f5f7fa;
            --card-bg: #fff;
            --text: #333;
            --accent: #4e8cff;
            --radius: 8px;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg);
            font-family: Arial, sans-serif;
            color: var(--text);
            padding: 1rem;
          }
          .card {
            background: var(--card-bg);
            border-radius: var(--radius);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 600px;
            padding: 2rem;
          }
          h1 {
            text-align: center;
            margin-bottom: 1.5rem;
            color: var(--accent);
          }
          form {
            display: flex;
            flex-direction: column;
          }
          label {
            margin-bottom: 0.25rem;
            font-weight: bold;
          }
          input, textarea {
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: var(--radius);
            margin-bottom: 1rem;
            font-size: 1rem;
          }
          textarea {
            resize: vertical;
            min-height: 60px;
          }
          button {
            background: var(--accent);
            color: #fff;
            border: none;
            padding: 0.75rem;
            font-size: 1rem;
            border-radius: var(--radius);
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover {
            background: #3a6fcc;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🧩 API Playground</h1>
          <form method="post" action="/play/fetch">
            <label for="url">External API URL</label>
            <input id="url" name="url" type="url" placeholder="https://api.example.com/data" required />
  
            <label for="token">Access Token (Optional)</label>
            <input id="token" name="token" type="text" placeholder="Bearer YOUR_TOKEN_HERE" />
  
            <label for="headers">Custom Headers (JSON format)</label>
            <textarea id="headers" name="headers" placeholder='{ "X-Custom-Header": "value" }'></textarea>
  
            <button type="submit">Fetch</button>
          </form>
        </div>
      </body>
      </html>
    `);
};

module.exports = { getWelcomeMessage, showForm };
