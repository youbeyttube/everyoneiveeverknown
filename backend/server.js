const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const peoplePath = path.join(__dirname, "data", "people.json");
const adminPath = path.join(__dirname, "data", "admin.json");

function load(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* LOGIN */
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const admin = load(adminPath);

  res.json({ success: password === admin.password });
});

/* CREATE */
app.post("/admin/create", (req, res) => {
  const people = load(peoplePath);
  const { name, info } = req.body;

  people.push({
    entryNumber: people.length + 1,
    name,
    info
  });

  save(peoplePath, people);
  res.json({ success: true });
});

/* GET ALL */
app.get("/admin/all", (req, res) => {
  res.json(load(peoplePath));
});

/* EDIT */
app.post("/admin/edit", (req, res) => {
  const { id, name, info } = req.body;
  const people = load(peoplePath);

  const entry = people.find(p => p.entryNumber === id);
  if (!entry) return res.json({ success: false });

  entry.name = name;
  entry.info = info;

  save(peoplePath, people);
  res.json({ success: true });
});

/* DELETE */
app.post("/admin/delete", (req, res) => {
  let people = load(peoplePath);
  const { id } = req.body;

  people = people.filter(p => p.entryNumber !== id);

  people.forEach((p, i) => {
    p.entryNumber = i + 1;
  });

  save(peoplePath, people);
  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running"));
