// Detect which page we are on
const page = window.location.pathname;

// ----------------------
// RANDOM PERSON (index.html)
// ----------------------
if (page.endsWith("index.html")) {
    const btn = document.getElementById("randomBtn");
    if (btn) {
        btn.onclick = () => {
            fetch("/random")
                .then(res => res.json())
                .then(data => {
                    document.getElementById("randomResult").innerText =
                        `${data.entryNumber}. ${data.name} — ${data.info.join(", ")}`;
                });
        };
    }
}

// ----------------------
// SEARCH PAGE (search.html)
// ----------------------
if (page.endsWith("search.html")) {
    const input = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");

    document.getElementById("searchBtn").onclick = () => {
        const q = input.value.trim();
        fetch(`/search?q=${encodeURIComponent(q)}`)
            .then(res => res.json())
            .then(data => {
                results.innerHTML = "";
                data.forEach(p => {
                    const div = document.createElement("div");
                    div.innerText = `${p.entryNumber}. ${p.name} — ${p.info.join(", ")}`;
                    results.appendChild(div);
                });
            });
    };
}

// ----------------------
// ADMIN LOGIN (admin.html)
// ----------------------
function adminLogin() {
    const pw = document.getElementById("adminPassword").value;

    fetch("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("adminTools").style.display = "block";
        } else {
            document.getElementById("loginMessage").innerText = "Incorrect password.";
        }
    });
}

// ----------------------
// CHANGE PASSWORD
// ----------------------
function changePassword() {
    const newPw = document.getElementById("newPassword").value;

    fetch("/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPw })
    })
    .then(() => {
        alert("Password changed.");
    });
}

// ----------------------
// CREATE NEW ENTRY
// ----------------------
function createEntry() {
    const name = document.getElementById("newName").value;
    const info1 = document.getElementById("newInfo1").value;
    const info2 = document.getElementById("newInfo2").value;
    const info3 = document.getElementById("newInfo3").value;

    fetch("/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, info1, info2, info3 })
    })
    .then(() => location.reload());
}

// ----------------------
// ENTRIES PAGE (entries.html)
// ----------------------
if (page.endsWith("entries.html")) {
    loadEntries();
}

function loadEntries() {
    fetch("/admin/all")
        .then(res => res.json())
        .then(entries => {
            const container = document.getElementById("entriesContainer");
            container.innerHTML = "";

            entries.forEach((e, index) => {
                const row = document.createElement("div");
                row.className = "entryRow";

                row.innerHTML = `
                    <div class="entryText">
                        #${e.entryNumber} - ${e.name} : ${e.info.join(", ")}
                    </div>

                    <div class="entryButtons">
                        <span class="editBtn" onclick="editEntry(${index})">[Edit]</span>
                        <span class="deleteBtn" onclick="deleteEntry(${index})">[Delete]</span>
                    </div>
                `;

                container.appendChild(row);
            });
        });
}

// ----------------------
// EDIT ENTRY
// ----------------------
function editEntry(index) {
    fetch("/admin/all")
        .then(res => res.json())
        .then(entries => {
            const e = entries[index];
            const container = document.getElementById("entriesContainer");

            container.innerHTML = `
                <div class="entryEdit">
                    <h3>Edit Entry #${e.entryNumber}</h3>

                    <label>Name:</label><br>
                    <input id="editName" value="${e.name}"><br>

                    <label>Info 1:</label><br>
                    <input id="editInfo1" value="${e.info[0]}"><br>

                    <label>Info 2:</label><br>
                    <input id="editInfo2" value="${e.info[1]}"><br>

                    <label>Info 3:</label><br>
                    <input id="editInfo3" value="${e.info[2]}"><br><br>

                    <button onclick="saveEdit(${index})">Save</button>
                    <button onclick="loadEntries()">Cancel</button>
                </div>
            `;
        });
}

function saveEdit(index) {
    const name = document.getElementById("editName").value;
    const info1 = document.getElementById("editInfo1").value;
    const info2 = document.getElementById("editInfo2").value;
    const info3 = document.getElementById("editInfo3").value;

    fetch("/admin/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, name, info1, info2, info3 })
    })
    .then(() => loadEntries());
}

// ----------------------
// DELETE ENTRY
// ----------------------
function deleteEntry(index) {
    fetch("/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index })
    })
    .then(() => loadEntries());
}
