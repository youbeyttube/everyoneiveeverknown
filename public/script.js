let isAdmin = false;

// ----------------------
// ADMIN LOGIN
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
            isAdmin = true;
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("adminTools").style.display = "block";
        } else {
            document.getElementById("loginMessage").innerText = "Incorrect password.";
        }
    });
}

// ----------------------
// ADD ENTRY
// ----------------------
function addEntry() {
    const name = document.getElementById("newName").value;
    const info1 = document.getElementById("newInfo1").value;
    const info2 = document.getElementById("newInfo2").value;
    const info3 = document.getElementById("newInfo3").value;

    fetch("/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, info1, info2, info3 })
    })
    .then(() => location.reload());
}

// ----------------------
// LOAD ENTRIES PAGE
// ----------------------
if (window.location.pathname.endsWith("entries.html")) {
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
                        #${index + 1} - ${e.name} : ${e.info1}, ${e.info2}, ${e.info3}
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

            const editBlock = document.createElement("div");
            editBlock.className = "entryEdit";

            editBlock.innerHTML = `
                <h3>Edit Entry #${index + 1}</h3>

                <label>Name:</label><br>
                <input id="editName" value="${e.name}"><br>

                <label>Info 1:</label><br>
                <input id="editInfo1" value="${e.info1}"><br>

                <label>Info 2:</label><br>
                <input id="editInfo2" value="${e.info2}"><br>

                <label>Info 3:</label><br>
                <input id="editInfo3" value="${e.info3}"><br><br>

                <button onclick="saveEdit(${index})">Save</button>
                <button onclick="loadEntries()">Cancel</button>
            `;

            container.innerHTML = "";
            container.appendChild(editBlock);
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
