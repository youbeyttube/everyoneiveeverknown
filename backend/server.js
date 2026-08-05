const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const peoplePath = path.join(__dirname, "data", "people.json");
const adminPath = path.join(__dirname, "data", "admin.json");

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ============================
   GitHub-as-a-database sync
   ============================
   Render's free web services reset their local filesystem on every
   restart/spin-down. To survive that, we treat the repo's JSON files
   as the source of truth: pull the latest copy on startup, and push
   any change straight back to GitHub after saving locally.
*/

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const GITHUB_PEOPLE_PATH = process.env.GITHUB_PEOPLE_PATH || "backend/data/people.json";
const GITHUB_ADMIN_PATH = process.env.GITHUB_ADMIN_PATH || "backend/data/admin.json";

const githubEnabled = !!(GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO);

async function githubGetFile(repoPath) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub GET ${repoPath} failed: ${res.status}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { content, sha: data.sha };
}

async function githubPutFile(repoPath, contentStr, message, sha) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`;

  const body = {
    message,
    content: Buffer.from(contentStr, "utf8").toString("base64"),
    branch: GITHUB_BRANCH
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT ${repoPath} failed: ${res.status} ${text}`);
  }

  return res.json();
}

// Pull the latest people.json / admin.json from GitHub before the server
// starts serving, so we pick up whatever was last saved.
async function loadLatestFromGitHub() {
  if (!githubEnabled) {
    console.log("GitHub sync not configured — using local files only. Data will NOT survive a restart on Render's free tier.");
    return;
  }

  try {
    const people = await githubGetFile(GITHUB_PEOPLE_PATH);
    fs.writeFileSync(peoplePath, people.content);
    console.log("Loaded people.json from GitHub.");
  } catch (err) {
    console.error("Could not load people.json from GitHub, falling back to local copy:", err.message);
  }

  try {
    const admin = await githubGetFile(GITHUB_ADMIN_PATH);
    fs.writeFileSync(adminPath, admin.content);
    console.log("Loaded admin.json from GitHub.");
  } catch (err) {
    console.error("Could not load admin.json from GitHub, falling back to local copy:", err.message);
  }
}

// Save locally, then push the same content to GitHub so it survives a restart.
async function saveAndSync(localPath, repoPath, data, commitMessage) {
  saveJSON(localPath, data);

  if (!githubEnabled) return;

  try {
    let sha;
    try {
      const current = await githubGetFile(repoPath);
      sha = current.sha;
    } catch (err) {
      // File may not exist yet on GitHub — that's fine, PUT will create it.
    }

    await githubPutFile(repoPath, JSON.stringify(data, null, 2), commitMessage, sha);
  } catch (err) {
    console.error(`GitHub sync failed for ${repoPath}:`, err.message);
  }
}

app.get("/random", (req, res) => {
  const people = loadJSON(peoplePath);

  if (people.length === 0) {
    return res.json({
      entryNumber: 0,
      name: "No entries yet",
      created: "",
      info: ["No entries yet.", "", ""]
    });
  }

  const person = people[Math.floor(Math.random() * people.length)];
  res.json(person);
});

app.get("/search", (req, res) => {
  const term = req.query.term?.toLowerCase() || "";
  const people = loadJSON(peoplePath);

  const matches = people
    .map(p => ({
      id: p.entryNumber,
      name: p.name,
      created: p.created,
      line1: p.info[0] || "",
      line2: p.info[1] || "",
      line3: p.info[2] || ""
    }))
    .filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.line1.toLowerCase().includes(term) ||
      p.line2.toLowerCase().includes(term) ||
      p.line3.toLowerCase().includes(term)
    );

  res.json(matches);
});

app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const admin = loadJSON(adminPath);

  if (password === admin.adminPassword) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post("/admin/change-password", async (req, res) => {
  const { oldPass, newPass } = req.body;
  const admin = loadJSON(adminPath);

  if (oldPass === admin.adminPassword) {
    admin.adminPassword = newPass;
    await saveAndSync(adminPath, GITHUB_ADMIN_PATH, admin, "Update admin password");
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.post("/admin/create", async (req, res) => {
  const { name, info } = req.body;

  const people = loadJSON(peoplePath);
  const entryNumber = people.length + 1;

  const newPerson = {
    entryNumber,
    name,
    created: new Date().toISOString().split("T")[0],
    info
  };

  people.push(newPerson);
  await saveAndSync(peoplePath, GITHUB_PEOPLE_PATH, people, `Add entry #${entryNumber}: ${name}`);

  res.json({ success: true, entryNumber });
});

// Return every entry, for the admin "view all" page
app.get("/admin/entries", (req, res) => {
  const people = loadJSON(peoplePath);
  res.json(people);
});

// Update a single entry's name/info
app.put("/admin/entries/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, info } = req.body;

  const people = loadJSON(peoplePath);
  const idx = people.findIndex(p => p.entryNumber === id);

  if (idx === -1) {
    return res.json({ success: false, error: "Entry not found" });
  }

  people[idx].name = name;
  people[idx].info = info;
  await saveAndSync(peoplePath, GITHUB_PEOPLE_PATH, people, `Edit entry #${id}`);

  res.json({ success: true, entry: people[idx] });
});

// Delete a single entry
app.delete("/admin/entries/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const people = loadJSON(peoplePath);
  const idx = people.findIndex(p => p.entryNumber === id);

  if (idx === -1) {
    return res.json({ success: false, error: "Entry not found" });
  }

  people.splice(idx, 1);
  await saveAndSync(peoplePath, GITHUB_PEOPLE_PATH, people, `Delete entry #${id}`);

  res.json({ success: true });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const PORT = process.env.PORT || 3000;

// Pull the latest data from GitHub before we start accepting requests.
loadLatestFromGitHub().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
