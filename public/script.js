/* ============================
   ADMIN STATE HANDLING
   ============================ */

function loadAdminState() {
  const loginPanel = document.getElementById("loginPanel");
  const adminTools = document.getElementById("adminTools");

  // Only run admin logic on admin.html
  if (!loginPanel || !adminTools) return;

  const loggedIn = localStorage.getItem("adminLoggedIn") === "true";

  if (loggedIn) {
    loginPanel.style.display = "none";
    adminTools.style.display = "block";
  } else {
    loginPanel.style.display = "block";
    adminTools.style.display = "none";
  }
}

function updateLoginButtonText() {
  const btn = document.getElementById("loginSubmit");
  if (btn) btn.textContent = "Enter";
}

/* ============================
   PAGE INITIALIZATION
   ============================ */

document.addEventListener("DOMContentLoaded", () => {
  loadAdminState();
  updateLoginButtonText();

  /* ----- LOGIN BUTTON ----- */
  const loginBtn = document.getElementById("loginSubmit");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const pass = document.getElementById("adminPassword").value;

      const res = await fetch("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminLoggedIn", "true");
        loadAdminState();
      } else {
        alert("Incorrect password");
      }
    });
  }

  /* ----- LOGOUT BUTTON ----- */
  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("adminLoggedIn");
      loadAdminState();
    });
  }

  /* ----- CREATE ENTRY ----- */
  const createBtn = document.getElementById("createEntry");
  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const name = document.getElementById("newName").value;
      const info1 = document.getElementById("info1").value;
      const info2 = document.getElementById("info2").value;
      const info3 = document.getElementById("info3").value;

      const res = await fetch("/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          info: [info1, info2, info3]
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Entry created");
      }
    });
  }

  /* ----- VIEW ENTRIES BUTTON ----- */
  const viewEntriesBtn = document.getElementById("viewEntries");
  if (viewEntriesBtn) {
    viewEntriesBtn.addEventListener("click", () => {
      window.location.href = "entries.html";
    });
  }

  /* ----- LOAD ENTRIES PAGE ----- */
  if (document.getElementById("entriesList")) {
    loadAllEntries();
  }
});

/* ============================
   LOAD ALL ENTRIES
   ============================ */

async function loadAllEntries() {
  try {
    const res = await fetch("/admin/all");
    const entries = await res.json();

    const container = document.getElementById("entriesList");
    container.innerHTML = "";

    entries.forEach(person => {
      const div = document.createElement("div");
      div.className = "entry-row";
      div.dataset.id = person.entryNumber;

      div.innerHTML = `
        <p class="entry-line">
          #${person.entryNumber} ${person.name}: 
          ${person.info[0]} / ${person.info[1]} / ${person.info[2]}
        </p>

        <button class="secondary-button small editEntry">Edit</button>
        <button class="secondary-button small deleteEntry">Delete</button>
      `;

      container.appendChild(div);
    });

    document.querySelectorAll(".editEntry").forEach(btn => {
      btn.addEventListener("click", startInlineEdit);
    });

    document.querySelectorAll(".deleteEntry").forEach(btn => {
      btn.addEventListener("click", deleteEntry);
    });

  } catch (err) {
    console.error("Error loading entries:", err);
  }
}

/* ============================
   INLINE EDIT (FIXED PARSER)
   ============================ */

function startInlineEdit(e) {
  const row = e.target.closest(".entry-row");
  const id = row.dataset.id;

  const line = row.querySelector(".entry-line").textContent;

  // Remove "#number "
  const withoutNumber = line.replace(/^#\d+\s*/, "");

  // Split at first colon
  const firstColon = withoutNumber.indexOf(":");
  const name = withoutNumber.substring(0, firstColon).trim();

  // Extract sentences
  const sentencePart = withoutNumber.substring(firstColon + 1).trim();
  const sentences = sentencePart.split(" / ").map(s => s.trim());

  row.innerHTML = `
    <p>#${id}</p>
    <input type="text" class="editName" value="${name}">
    <input type="text" class="edit1" value="${sentences[0] || ""}">
    <input type="text" class="edit2" value="${sentences[1] || ""}">
    <input type="text" class="edit3" value="${sentences[2] || ""}">

    <button class="primary-button small saveEdit">Save</button>
    <button class="secondary-button small cancelEdit">Cancel</button>
  `;

  row.querySelector(".saveEdit").onclick = () => saveEdit(id, row);
  row.querySelector(".cancelEdit").onclick = () => loadAllEntries();
}

/* ============================
   SAVE EDIT
   ============================ */

async function saveEdit(id, row) {
  const name = row.querySelector(".editName").value;
  const info = [
    row.querySelector(".edit1").value,
    row.querySelector(".edit2").value,
    row.querySelector(".edit3").value
  ];

  const res = await fetch("/admin/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: Number(id), name, info })
  });

  const data = await res.json();
  if (data.success) {
    loadAllEntries();
  }
}

/* ============================
   DELETE ENTRY
   ============================ */

async function deleteEntry(e) {
  const row = e.target.closest(".entry-row");
  const id = Number(row.dataset.id);

  const res = await fetch("/admin/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  const data = await res.json();
  if (data.success) {
    loadAllEntries();
  }
}
