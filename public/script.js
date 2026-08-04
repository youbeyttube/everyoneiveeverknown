function fadeCard(callback) {
  const card = document.querySelector(".index-card");
  if (!card) {
    callback();
    return;
  }
  card.style.opacity = 0;
  setTimeout(() => {
    callback();
    card.style.opacity = 1;
  }, 150);
}

/* ⭐ Persistent admin state */
function loadAdminState() {
  window.isAdmin = localStorage.getItem("isAdmin") === "true";
}

function saveAdminState() {
  localStorage.setItem("isAdmin", window.isAdmin ? "true" : "false");
}

/* ⭐ Update login/admin button text */
function updateLoginButtonText() {
  const btns = document.querySelectorAll("#goAdmin");
  btns.forEach(btn => {
    btn.textContent = window.isAdmin ? "Admin" : "Login";
  });
}

async function loadRandomHuman() {
  try {
    const res = await fetch("/random");
    const person = await res.json();

    fadeCard(() => {
      document.getElementById("entryNumber").textContent = `#${person.entryNumber}`;
      document.getElementById("line1").textContent = person.info[0] || "";
      document.getElementById("line2").textContent = person.info[1] || "";
      document.getElementById("line3").textContent = person.info[2] || "";

      if (window.isAdmin) {
        document.getElementById("adminFields").style.display = "block";
        document.getElementById("adminName").textContent = person.name || "";
        document.getElementById("adminDate").textContent = person.created || "";
      }

      // ⭐ CLEAR SEARCH RESULTS WHEN NEXT HUMAN IS CLICKED
      const sr = document.getElementById("searchResults");
      if (sr) sr.innerHTML = "";
    });

  } catch (err) {
    console.error("Error loading random human:", err);
  }
}

/* ⭐ TELEPORTING SEARCH */
async function searchKeyword() {
  const term = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!term) return;

  try {
    const res = await fetch(`/search?term=${encodeURIComponent(term)}`);
    const matches = await res.json();

    if (matches.length === 0) {
      alert(`No entries found with term: "${term}"`);
      return;
    }

    let index = 0;

    function showCard() {
      const person = matches[index];

      document.getElementById("entryNumber").textContent = "#" + person.id;
      document.getElementById("line1").textContent = person.line1;
      document.getElementById("line2").textContent = person.line2;
      document.getElementById("line3").textContent = person.line3;

      // ⭐ SHOW NAME + DATE FOR ADMINS DURING SEARCH
      if (window.isAdmin) {
        document.getElementById("adminFields").style.display = "block";
        document.getElementById("adminName").textContent = person.name || "";
        document.getElementById("adminDate").textContent = person.created || "";
      }

      document.getElementById("searchResults").innerHTML =
        `<p>${index + 1} of ${matches.length} with term "${term}" shown</p>
         <button id="prevResult" class="secondary-button small">Previous</button>
         <button id="nextResult" class="secondary-button small">Next</button>`;

      document.getElementById("prevResult").onclick = () => {
        index = (index - 1 + matches.length) % matches.length;
        showCard();
      };

      document.getElementById("nextResult").onclick = () => {
        index = (index + 1) % matches.length;
        showCard();
      };
    }

    showCard();

  } catch (err) {
    console.error("Search error:", err);
  }
}

async function adminLogin(password) {
  try {
    const res = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (data.success) {
      window.isAdmin = true;
      saveAdminState(); // ⭐ persist login
      updateLoginButtonText(); // ⭐ switch Login → Admin

      alert("Admin mode unlocked.");
      document.getElementById("loginPanel").style.display = "none";
      document.getElementById("adminTools").style.display = "block";
      loadRandomHuman();
    } else {
      alert("Incorrect password.");
    }

  } catch (err) {
    console.error("Login error:", err);
  }
}

function adminLogout() {
  window.isAdmin = false;
  saveAdminState(); // ⭐ persist logout
  updateLoginButtonText(); // ⭐ switch Admin → Login

  const tools = document.getElementById("adminTools");
  const login = document.getElementById("loginPanel");
  if (tools) tools.style.display = "none";
  if (login) login.style.display = "block";
}

async function changePassword(oldPass, newPass) {
  try {
    const res = await fetch("/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPass, newPass })
    });

    const data = await res.json();

    if (data.success) {
      alert("Password updated.");
    } else {
      alert("Incorrect current password.");
    }

  } catch (err) {
    console.error("Password change error:", err);
  }
}

/* ⭐ VIEW ALL ENTRIES (admin) */
async function loadAllEntries() {
  const list = document.getElementById("entriesList");
  if (!list) return;

  try {
    const res = await fetch("/admin/entries");
    const people = await res.json();

    if (people.length === 0) {
      list.innerHTML = "<p>No entries yet.</p>";
      return;
    }

    list.innerHTML = "";

    people.forEach(person => {
      const card = document.createElement("div");
      card.className = "entry-card";
      card.dataset.id = person.entryNumber;

      card.innerHTML = `
        <div class="entry-card-header">
          <span class="entry-card-number">#${person.entryNumber}</span>
          <span class="entry-card-date">${person.created || ""}</span>
        </div>
        <input type="text" class="entry-name" value="${escapeAttr(person.name || "")}" placeholder="Name">
        <input type="text" class="entry-line" value="${escapeAttr(person.info[0] || "")}" placeholder="Sentence 1">
        <input type="text" class="entry-line" value="${escapeAttr(person.info[1] || "")}" placeholder="Sentence 2">
        <input type="text" class="entry-line" value="${escapeAttr(person.info[2] || "")}" placeholder="Sentence 3">
        <div class="entry-card-actions">
          <button class="primary-button small entry-save">Save</button>
          <button class="secondary-button small entry-delete">Delete</button>
        </div>
      `;

      card.querySelector(".entry-save").addEventListener("click", () => saveEntry(person.entryNumber, card));
      card.querySelector(".entry-delete").addEventListener("click", () => deleteEntry(person.entryNumber, card));

      list.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading entries:", err);
    list.innerHTML = "<p>Could not load entries.</p>";
  }
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function saveEntry(id, card) {
  const name = card.querySelector(".entry-name").value;
  const lines = card.querySelectorAll(".entry-line");
  const info = [lines[0].value, lines[1].value, lines[2].value];

  try {
    const res = await fetch(`/admin/entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, info })
    });

    const data = await res.json();
    if (data.success) {
      alert(`Entry #${id} saved.`);
    } else {
      alert("Could not save entry.");
    }
  } catch (err) {
    console.error("Save entry error:", err);
    alert("Could not save entry.");
  }
}

async function deleteEntry(id, card) {
  if (!confirm(`Delete entry #${id}? This cannot be undone.`)) return;

  try {
    const res = await fetch(`/admin/entries/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (data.success) {
      card.remove();
    } else {
      alert("Could not delete entry.");
    }
  } catch (err) {
    console.error("Delete entry error:", err);
    alert("Could not delete entry.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdminState(); // ⭐ restore admin state
  updateLoginButtonText(); // ⭐ update button text on load

  const nextBtn = document.getElementById("nextButton");
  const searchBtn = document.getElementById("searchButton");

  if (nextBtn) nextBtn.addEventListener("click", loadRandomHuman);
  if (searchBtn) searchBtn.addEventListener("click", searchKeyword);

  if (document.querySelector(".search-page")) {
    loadRandomHuman();
  }

  const loginBtn = document.getElementById("loginSubmit");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const pw = document.getElementById("adminPassword").value;
      await adminLogin(pw);
    });
  }

  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      adminLogout();
    });
  }

  const createBtn = document.getElementById("createEntry");
  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const name = document.getElementById("newName").value;
      const info = [
        document.getElementById("info1").value,
        document.getElementById("info2").value,
        document.getElementById("info3").value
      ];

      const res = await fetch("/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, info })
      });

      const data = await res.json();
      if (data.success) alert(`Entry #${data.entryNumber} created.`);
    });
  }

  const changeBtn = document.getElementById("changePass");
  if (changeBtn) {
    changeBtn.addEventListener("click", () => {
      const oldPass = document.getElementById("oldPass").value;
      const newPass = document.getElementById("newPass").value;
      changePassword(oldPass, newPass);
    });
  }

  const viewAllBtn = document.getElementById("viewAllButton");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      window.location.href = "entries.html";
    });
  }

  const goAdminButtons = document.querySelectorAll("#goAdmin");
  goAdminButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = "admin.html";
    });
  });

  const goHomeButtons = document.querySelectorAll("#goHome");
  goHomeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  });

  document.querySelectorAll("input, textarea").forEach(field => {
    field.addEventListener("input", () => {
      if (field.value.trim() !== "") {
        field.classList.add("has-text");
      } else {
        field.classList.remove("has-text");
      }
    });
  });

  // ⭐ If admin is already logged in, show admin tools immediately
  if (window.isAdmin) {
    const tools = document.getElementById("adminTools");
    const login = document.getElementById("loginPanel");
    if (tools) tools.style.display = "block";
    if (login) login.style.display = "none";
  }

  // ⭐ Entries page: only admins may view it, and it loads its own data
  if (document.querySelector(".entries-page")) {
    if (!window.isAdmin) {
      alert("Please log in as admin first.");
      window.location.href = "admin.html";
    } else {
      loadAllEntries();
    }
  }
});
