/* Existing functions remain unchanged above this point */

/* ⭐ Load all entries for entries.html */
async function loadAllEntries() {
  try {
    const res = await fetch("/admin/all");
    const entries = await res.json();

    const container = document.getElementById("entriesList");
    if (!container) return;

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

    /* ⭐ Attach edit/delete handlers */
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

/* ⭐ Inline editing */
function startInlineEdit(e) {
  const row = e.target.closest(".entry-row");
  const id = row.dataset.id;

  const line = row.querySelector(".entry-line").textContent;

  // Remove leading "#1 "
  const withoutNumber = line.replace(/^#\d+\s*/, "");

  // Split at first ":"
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


/* ⭐ Save edit */
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

/* ⭐ Delete entry */
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

/* ⭐ Routing */
document.addEventListener("DOMContentLoaded", () => {
  loadAdminState();
  updateLoginButtonText();

  /* Existing listeners remain unchanged */

  const viewEntriesBtn = document.getElementById("viewEntries");
  if (viewEntriesBtn) {
    viewEntriesBtn.addEventListener("click", () => {
      window.location.href = "entries.html";
    });
  }

  if (document.getElementById("entriesList")) {
    loadAllEntries();
  }
});
