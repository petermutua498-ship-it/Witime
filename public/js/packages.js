// ===============================
// WiTime Packages Management
// ===============================

const modal = document.getElementById("packageModal");
const addBtn = document.querySelector(".addBtn");
const closeBtn = document.querySelector(".close");

const saveBtn = document.getElementById("savePackage");

const table = document.getElementById("packageTable");

const search = document.getElementById("searchPackage");

let editingId = null;

// ----------------------
// Open Modal
// ----------------------

addBtn.onclick = () => {

    editingId = null;

    document.querySelector(".modal-content h2").innerText =
        "Add Package";

    saveBtn.innerText = "Save Package";

    document.getElementById("packageName").value = "";
    document.getElementById("packagePrice").value = "";
    document.getElementById("packageDuration").value = "";
    document.getElementById("durationUnit").value = "Hours";

    modal.style.display = "block";

};

// ----------------------
// Close Modal
// ----------------------

closeBtn.onclick = () => {

    modal.style.display = "none";

};

window.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

};

// ----------------------
// Load Packages
// ----------------------

async function loadPackages() {

    const response = await fetch("/api/packages");

    const packages = await response.json();

    table.innerHTML = "";

    packages.forEach(pkg => {

        table.innerHTML += `

<tr>

<td>${pkg.name}</td>

<td>KES ${pkg.price}</td>

<td>${pkg.duration} ${pkg.durationUnit}</td>

<td>
<span class="status active">
Active
</span>
</td>

<td>

<button
class="editBtn"
data-id="${pkg._id}">
✏ Edit
</button>

<button
class="deleteBtn"
data-id="${pkg._id}">
🗑 Delete
</button>

</td>

</tr>

`;

    });

}

loadPackages();

// ----------------------
// Save / Update Package
// ----------------------

saveBtn.onclick = async () => {

    const packageData = {

        name:
        document.getElementById("packageName").value,

        price:
        Number(document.getElementById("packagePrice").value),

        duration:
        Number(document.getElementById("packageDuration").value),

        durationUnit:
        document.getElementById("durationUnit").value

    };

    let url = "/api/packages";

    let method = "POST";

    if (editingId) {

        url += "/" + editingId;

        method = "PUT";

    }

    const response = await fetch(url, {

        method,

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify(packageData)

    });

    const data = await response.json();

    if (data.success) {

        modal.style.display = "none";

        loadPackages();

    } else {

        alert(data.message);

    }

};

// ----------------------
// Delete / Edit
// ----------------------

document.addEventListener("click", async (e) => {

    // DELETE

    if (e.target.classList.contains("deleteBtn")) {

        if (!confirm("Delete this package?")) return;

        const id = e.target.dataset.id;

        const response = await fetch(`/api/packages/${id}`, {

            method: "DELETE"

        });

        const data = await response.json();

        if (data.success) {

            loadPackages();

        }

    }

    // EDIT

    if (e.target.classList.contains("editBtn")) {

        const id = e.target.dataset.id;

        const response = await fetch("/api/packages");

        const packages = await response.json();

        const pkg = packages.find(p => p._id === id);

        if (!pkg) return;

        editingId = id;

        document.querySelector(".modal-content h2").innerText =
            "Edit Package";

        saveBtn.innerText = "Update Package";

        document.getElementById("packageName").value =
            pkg.name;

        document.getElementById("packagePrice").value =
            pkg.price;

        document.getElementById("packageDuration").value =
            pkg.duration;

        document.getElementById("durationUnit").value =
            pkg.durationUnit;

        modal.style.display = "block";

    }

});

// ----------------------
// Search Packages
// ----------------------

search.addEventListener("keyup", () => {

    const value = search.value.toLowerCase();

    const rows = table.querySelectorAll("tr");

    rows.forEach(row => {

        row.style.display =
            row.innerText.toLowerCase().includes(value)
            ? ""
            : "none";

    });

});