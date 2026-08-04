const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static("."));

const PASSWORD = "admin123"; // change as needed

function loadData() {
    return JSON.parse(fs.readFileSync("data.json"));
}

function saveData(data) {
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// ----------------------
// LOGIN
// ----------------------
app.post("/admin/login", (req, res) => {
    res.json({ success: req.body.password === PASSWORD });
});

// ----------------------
// GET ALL ENTRIES
// ----------------------
app.get("/admin/all", (req, res) => {
    res.json(loadData());
});

// ----------------------
// ADD ENTRY
// ----------------------
app.post("/admin/add", (req, res) => {
    const data = loadData();
    data.push(req.body);
    saveData(data);
    res.json({ success: true });
});

// ----------------------
// EDIT ENTRY
// ----------------------
app.post("/admin/edit", (req, res) => {
    const data = loadData();
    const i = req.body.index;

    data[i].name = req.body.name;
    data[i].info1 = req.body.info1;
    data[i].info2 = req.body.info2;
    data[i].info3 = req.body.info3;

    saveData(data);
    res.json({ success: true });
});

// ----------------------
// DELETE ENTRY + REINDEX
// ----------------------
app.post("/admin/delete", (req, res) => {
    const data = loadData();
    const i = req.body.index;

    data.splice(i, 1); // remove entry
    saveData(data);    // numbers auto-align by index

    res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on port 3000"));
