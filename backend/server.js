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

/* Random entry */
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

/* Search by term */
app.get("/search", (req, res) => {
  const term = req.query.term?.toLowerCase() || "";
  const people = loadJSON(peoplePath);

  const matches = people
    .map(p => ({
      id: p.entryNumber,
      line1: p.info[0] || "",
      line2: p.info[1] || "",
      line3: p.info[2] || ""
    }))
    .filter(p =>
      p.line1.toLowerCase().includes(term) ||
      p.line2.toLowerCase().includes(term) ||
      p.line3.toLowerCase().includes(term)
    );

  res.json(matches);
});

/* Admin login */
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const admin = loadJSON(adminPath);

  if (password === admin.adminPassword) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

/* Change password */
app.post("/admin/change-password", (req, res) => {
  const { oldPass, newPass } = req.body;
  const admin = loadJSON(adminPath);

  if (oldPass === admin.adminPassword) {
    admin.adminPassword = newPass;
    saveJSON(adminPath, admin);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

/* Create new entry */
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
