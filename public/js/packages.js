// =======================================
// WiTime Package Management
// =======================================

// Elements
const modal = document.getElementById("packageModal");
const addBtn = document.getElementById("addPackageBtn");
const closeBtn = document.querySelector(".close");
const saveBtn = document.getElementById("savePackage");

const table = document.getElementById("packageTable");
const searchBox = document.getElementById("searchPackage");

let editingId = null;
let packages = [];

// =======================================
// Modal
// =======================================

addBtn.addEventListener("click", () => {

    editingId = null;

    document.querySelector(".modal-content h2").innerText = "Add Package";

    saveBtn.innerText = "Save Package";

    document.getElementById("packageName").value = "";
    document.getElementById("packagePrice").value = "";
    document.getElementById("packageDuration").value = "";
    document.getElementById("durationUnit").value = "Hours";
    document.getElementById("packageStatus").value = "Active";

    modal.style.display = "flex";

});

closeBtn.addEventListener("click", () => {

    modal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

});

// =======================================
// Load Packages
// =======================================

async function loadPackages() {

    try {

        table.innerHTML = `

        <tr>

            <td colspan="5" class="empty">

                Loading packages...

            </td>

        </tr>

        `;

        const response = await fetch("/api/packages");

        packages = await response.json();

        displayPackages(packages);

    } catch (err) {

        console.error(err);

        table.innerHTML = `

        <tr>

            <td colspan="5" class="empty">

                Unable to load packages.

            </td>

        </tr>

        `;

    }

}

// =======================================
// Display Packages
// =======================================

function displayPackages(data) {

    table.innerHTML = "";

    if (data.length === 0) {

        table.innerHTML = `

        <tr>

            <td colspan="5" class="empty">

                No packages found.

            </td>

        </tr>

        `;

        return;

    }

    data.forEach(pkg => {

        table.innerHTML += `

        <tr>

            <td>${pkg.name}</td>

            <td>KES ${pkg.price}</td>

            <td>${pkg.duration} ${pkg.durationUnit}</td>

            <td>

                <span class="${pkg.status === "Active"
                    ? "status-active"
                    : "status-inactive"}">

                    ${pkg.status}

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

// =======================================
// Search
// =======================================

searchBox.addEventListener("keyup", () => {

    const keyword = searchBox.value.toLowerCase();

    const filtered = packages.filter(pkg =>

        pkg.name.toLowerCase().includes(keyword)

    );

    displayPackages(filtered);

});

// =======================================
// EDIT & DELETE BUTTONS
// =======================================

document.addEventListener("click", async (e) => {

    // ==========================
    // EDIT PACKAGE
    // ==========================

    if (e.target.classList.contains("editBtn")) {

        const id = e.target.dataset.id;

        const pkg = packages.find(p => p._id === id);

        if (!pkg) return;

        editingId = id;

        document.querySelector(".modal-content h2").innerText =
            "Edit Package";

        saveBtn.innerText = "Update Package";

        document.getElementById("packageName").value = pkg.name;
        document.getElementById("packagePrice").value = pkg.price;
        document.getElementById("packageDuration").value = pkg.duration;
        document.getElementById("durationUnit").value = pkg.durationUnit;
        document.getElementById("packageStatus").value = pkg.status;

        modal.style.display = "flex";

    }

    // ==========================
    // DELETE PACKAGE
    // ==========================

    if (e.target.classList.contains("deleteBtn")) {

        const id = e.target.dataset.id;

        if (!confirm("Delete this package?")) return;

        try {

            const response = await fetch(`/api/packages/${id}`, {

                method: "DELETE"

            });

            const result = await response.json();

            if (result.success) {

                loadPackages();

            } else {

                alert(result.message || "Unable to delete package.");

            }

        } catch (err) {

            console.error(err);

            alert("Server error.");

        }

    }

});

// =======================================
// SAVE PACKAGE
// =======================================

saveBtn.addEventListener("click", async () => {

    const packageData = {

        name: document.getElementById("packageName").value.trim(),

        price: Number(
            document.getElementById("packagePrice").value
        ),

        duration: Number(
            document.getElementById("packageDuration").value
        ),

        durationUnit:
            document.getElementById("durationUnit").value,

        status:
            document.getElementById("packageStatus").value

    };

    if (
        packageData.name === "" ||
        packageData.price <= 0 ||
        packageData.duration <= 0
    ) {

        alert("Please complete all fields.");

        return;

    }

    try {

        const url = editingId
            ? `/api/packages/${editingId}`
            : "/api/packages";

        const method = editingId
            ? "PUT"
            : "POST";

        const response = await fetch(url, {

            method,

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(packageData)

        });

        const result = await response.json();

        if (result.success) {

            modal.style.display = "none";

            editingId = null;

            loadPackages();

        } else {

            alert(result.message);

        }

    } catch (err) {

        console.error(err);

        alert("Unable to save package.");

    }

});

// =======================================
// HELPERS
// =======================================

// Refresh package list
function refreshPackages() {

    loadPackages();

}

// Close modal after pressing ESC
document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {

        modal.style.display = "none";

    }

});

// Prevent empty spaces in package name
document.getElementById("packageName").addEventListener("input", function () {

    this.value = this.value.replace(/\s+/g, " ");

});

// =======================================
// INITIALIZE PAGE
// =======================================

window.addEventListener("DOMContentLoaded", () => {

    loadPackages();

});