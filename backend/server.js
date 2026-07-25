const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Paths
const peoplePath = path.join(__dirname, "data", "people.json");
const adminPath = path.join(__dirname, "data", "admin.json");

// Helpers
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Root route (homepage)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Admin login
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const admin = JSON.parse(fs.readFileSync(adminPath, "utf8"));

  if (password === admin.password) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Create new person + auto-sync to your computer
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
  saveJSON(peoplePath, people);

  // AUTO-SYNC TO YOUR COMPUTER
  try {
    await fetch("http://192.168.0.47:3001/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(people)
    });
  } catch (err) {
    console.log("Local sync failed:", err.message);
  }

  res.json({ success: true, entryNumber });
});

// Search
app.get("/search", (req, res) => {
  const q = req.query.q?.toLowerCase() || "";
  const people = loadJSON(peoplePath);

  const results = people.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.info.some(i => i.toLowerCase().includes(q))
  );

  res.json(results);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
