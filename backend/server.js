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

/* Existing routes remain unchanged */

/* ⭐ Get all entries */
app.get("/admin/all", (req, res) => {
  const people = loadJSON(peoplePath);
  res.json(people);
});

/* ⭐ Edit entry */
app.post("/admin/edit", (req, res) => {
  const { id, name, info } = req.body;

  const people = loadJSON(peoplePath);
  const index = people.findIndex(p => p.entryNumber === id);

  if (index === -1) return res.json({ success: false });

  people[index].name = name;
  people[index].info = info;

  saveJSON(peoplePath, people);
  res.json({ success: true });
});

/* ⭐ Delete entry + reindex */
app.post("/admin/delete", (req, res) => {
  const { id } = req.body;

  let people = loadJSON(peoplePath);

  people = people.filter(p => p.entryNumber !== id);

  /* ⭐ Reindex */
  people.forEach((p, i) => {
    p.entryNumber = i + 1;
  });

  saveJSON(peoplePath, people);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
