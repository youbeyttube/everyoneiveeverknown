const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Homepage
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

// Create new person
app.post("/admin/create", (req, res) => {
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

  res.json({ success: true, entryNumber });
});

// ⭐ EDIT PERSON
app.post("/admin/edit", (req, res) => {
  const { entryNumber, name, info } = req.body;

  const people = loadJSON(peoplePath);
  const person = people.find(p => p.entryNumber === entryNumber);

  if (!person) return res.json({ success: false });

  person.name = name;
  person.info = info;

  saveJSON(peoplePath, people);

  res.json({ success: true });
});

// ⭐ DELETE PERSON
app.post("/admin/delete", (req, res) => {
  const { entryNumber } = req.body;

  let people = loadJSON(peoplePath);
  people = people.filter(p => p.entryNumber !== entryNumber);

  saveJSON(peoplePath, people);

  res.json({ success: true });
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
