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

async function searchKeyword() {
  const keyword = document.getElementById("searchInput").value.trim();
  if (!keyword) return;

  try {
    const res = await fetch(`/search?keyword=${encodeURIComponent(keyword)}`);
    const results = await res.json();

    const container = document.getElementById("searchResults");
    container.innerHTML = "";

    results.forEach((person) => {
      const p = document.createElement("p");
      p.textContent = `${person.info[0]} / ${person.info[1]} / ${person.info[2]}`;
      container.appendChild(p);
    });

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
