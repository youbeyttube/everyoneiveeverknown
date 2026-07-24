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
    });

  } catch (err) {
    console.error("Error loading random human:", err);
  }
}

/* ⭐ NEW TELEPORTING SEARCH FUNCTION */
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

      // Fill the index card
      document.getElementById("entryNumber").textContent = "#" + person.id;
      document.getElementById("line1").textContent = person.line1;
      document.getElementById("line2").textContent = person.line2;
      document.getElementById("line3").textContent = person.line3;

      // Show the “1 of X with term ___ shown”
      document.getElementById("searchResults").innerHTML =
        `<p>${index + 1} of ${matches.length} with term "${term}" shown</p>
         <button id="prevResult">Previous</button>
         <button id="nextResult">Next</button>`;

      // Navigation buttons
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
      alert("Admin mode unlocked.");
      loadRandomHuman();
    } else {
      alert("Incorrect password.");
    }

  } catch (err) {
    console.error("Login error:", err);
  }
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

document.addEventListener("DOMContentLoaded", () => {
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
      if (window.isAdmin) {
        document.getElementById("loginPanel").style.display = "none";
        document.getElementById("adminTools").style.display = "block";
      }
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
});

/* ⭐ Placeholder fade logic */
document.querySelectorAll("input, textarea").forEach(field => {
  field.addEventListener("input", () => {
    if (field.value.trim() !== "") {
      field.classList.add("has-text");
    } else {
      field.classList.remove("has-text");
    }
  });
});