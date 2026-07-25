// ADMIN LOGIN
document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const password = document.getElementById("adminPassword").value;

  const res = await fetch("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  const data = await res.json();

  if (data.success) {
    window.isAdmin = true;
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminSection").style.display = "block";
  } else {
    alert("Wrong password.");
  }
});

// CREATE NEW ENTRY
document.getElementById("createBtn")?.addEventListener("click", async () => {
  const name = document.getElementById("newName").value;
  const info = document.getElementById("newInfo").value.split("\n");

  const res = await fetch("/admin/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, info })
  });

  const data = await res.json();
  if (data.success) {
    alert("Created entry #" + data.entryNumber);
  }
});

// ⭐ OPEN EDIT PANEL
function openEditPanel(person) {
  document.getElementById("editPanel").style.display = "block";
  document.getElementById("editName").value = person.name;
  document.getElementById("editInfo").value = person.info.join("\n");

  document.getElementById("saveEdit").onclick = () => {
    saveEdit(person.entryNumber);
  };
}

// ⭐ SAVE EDIT
async function saveEdit(entryNumber) {
  const name = document.getElementById("editName").value;
  const info = document.getElementById("editInfo").value.split("\n");

  const res = await fetch("/admin/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entryNumber, name, info })
  });

  const data = await res.json();
  if (data.success) {
    alert("Entry updated.");
    location.reload();
  }
}

// ⭐ DELETE ENTRY
async function deleteEntry(entryNumber) {
  if (!confirm("Delete this entry?")) return;

  const res = await fetch("/admin/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entryNumber })
  });

  const data = await res.json();
  if (data.success) {
    alert("Entry deleted.");
    location.reload();
  }
}

// ⭐ ADD EDIT/DELETE BUTTONS TO SEARCH RESULTS
function attachAdminButtons(card, person) {
  if (!window.isAdmin) return;

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "admin-edit-btn";
  editBtn.onclick = () => openEditPanel(person);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "admin-delete-btn";
  deleteBtn.onclick = () => deleteEntry(person.entryNumber);

  card.appendChild(editBtn);
  card.appendChild(deleteBtn);
}
