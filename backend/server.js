const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());

// Serve the PUBLIC folder (this fixes "Cannot GET /")
app.use(express.static(path.join(__dirname, "../public")));

// Paths to your JSON files
const adminPath = path.join(__dirname, "data/admin.json");
const peoplePath = path.join(__dirname, "data/people.json");

// Helpers
function loadAdmin() {
    return JSON.parse(fs.readFileSync(adminPath));
}

function saveAdmin(data) {
    fs.writeFileSync(adminPath, JSON.stringify(data, null, 2));
}

function loadPeople() {
    return JSON.parse(fs.readFileSync(peoplePath));
}

function savePeople(data) {
    fs.writeFileSync(peoplePath, JSON.stringify(data, null, 2));
}

/* --------------------------------------------------
   ROUTES
-------------------------------------------------- */

// RANDOM PERSON
app.get("/random", (req, res) => {
    const people = loadPeople();
    if (people.length === 0) return res.json({ error: "No entries" });

    const random = people[Math.floor(Math.random() * people.length)];
    res.json(random);
});

// SEARCH PERSON
app.get("/search", (req, res) => {
    const q = (req.query.q || "").toLowerCase();
    const people = loadPeople();

    const results = people.filter(p =>
        p.name.toLowerCase().includes(q)
    );

    res.json(results);
});

// ADMIN LOGIN
app.post("/admin/login", (req, res) => {
    const { adminPassword } = loadAdmin();
    res.json({ success: req.body.password === adminPassword });
});

// CHANGE PASSWORD
app.post("/admin/change-password", (req, res) => {
    const admin = loadAdmin();
    admin.adminPassword = req.body.newPassword;
    saveAdmin(admin);
    res.json({ success: true });
});

// CREATE NEW ENTRY
app.post("/admin/create", (req, res) => {
    const people = loadPeople();

    const newEntry = {
        entryNumber: people.length + 1,
        name: req.body.name,
        created: new Date().toISOString().split("T")[0],
        info: [
            req.body.info1,
            req.body.info2,
            req.body.info3
        ]
    };

    people.push(newEntry);
    savePeople(people);

    res.json({ success: true });
});

// GET ALL ENTRIES
app.get("/admin/all", (req, res) => {
    res.json(loadPeople());
});

// EDIT ENTRY
app.post("/admin/edit", (req, res) => {
    const people = loadPeople();
    const i = req.body.index;

    people[i].name = req.body.name;
    people[i].info = [
        req.body.info1,
        req.body.info2,
        req.body.info3
    ];

    savePeople(people);
    res.json({ success: true });
});

// DELETE ENTRY + REINDEX
app.post("/admin/delete", (req, res) => {
    const people = loadPeople();
    const i = req.body.index;

    people.splice(i, 1);

    // Reindex entry numbers
    people.forEach((p, idx) => {
        p.entryNumber = idx + 1;
    });

    savePeople(people);
    res.json({ success: true });
});

// START SERVER
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
