// =======================================
// WiTime Package Management
// =======================================

const modal = document.getElementById("packageModal");
const addBtn = document.getElementById("addPackageBtn");
const closeBtn = document.querySelector(".close");
const saveBtn = document.getElementById("savePackage");

const table = document.getElementById("packageTable");
const searchBox = document.getElementById("searchPackage");

let editingId = null;
let packages = [];


// =======================================
// MODAL
// =======================================

addBtn.addEventListener("click", () => {

    editingId = null;

    document.querySelector(".modal-content h2").textContent =
        "Add Package";

    saveBtn.textContent = "Save Package";

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


window.addEventListener("click", (event) => {

    if (event.target === modal) {
        modal.style.display = "none";
    }

});


document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
        modal.style.display = "none";
    }

});


// =======================================
// LOAD PACKAGES
// =======================================

async function loadPackages() {

    table.innerHTML = `
        <tr>
            <td colspan="5" class="empty">
                Loading packages...
            </td>
        </tr>
    `;

    try {

        const response = await fetch("/api/packages", {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        });

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }

        const data = await response.json();

        console.log("WiTime packages:", data);


        // Support both:
        // [...]
        // and { packages: [...] }

        if (Array.isArray(data)) {

            packages = data;

        } else if (Array.isArray(data.packages)) {

            packages = data.packages;

        } else {

            throw new Error(
                "Invalid packages response from server"
            );

        }


        displayPackages(packages);


    } catch (error) {

        console.error(
            "Unable to load packages:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty error">
                    Unable to load packages.
                    <br>
                    <small>${escapeHtml(error.message)}</small>
                </td>
            </tr>
        `;

    }

}


// =======================================
// DISPLAY PACKAGES
// =======================================

function displayPackages(data) {

    table.innerHTML = "";

    if (!data || data.length === 0) {

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

        const status =
            pkg.status || "Inactive";

        const statusClass =
            status.toLowerCase() === "active"
                ? "status-active"
                : "status-inactive";


        table.innerHTML += `
            <tr>

                <td>
                    <strong>
                        ${escapeHtml(pkg.name || "-")}
                    </strong>
                </td>

                <td>
                    KES ${Number(pkg.price) || 0}
                </td>

                <td>
                    ${escapeHtml(pkg.duration || "-")}
                    ${escapeHtml(pkg.durationUnit || "")}
                </td>

                <td>
                    <span class="${statusClass}">
                        ${escapeHtml(status)}
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
// SEARCH
// =======================================

searchBox.addEventListener("input", () => {

    const keyword =
        searchBox.value
            .trim()
            .toLowerCase();


    if (!keyword) {

        displayPackages(packages);

        return;
    }


    const filtered =
        packages.filter(pkg => {

            const name =
                String(pkg.name || "")
                    .toLowerCase();

            const duration =
                String(pkg.duration || "")
                    .toLowerCase();

            const unit =
                String(pkg.durationUnit || "")
                    .toLowerCase();

            return (
                name.includes(keyword) ||
                duration.includes(keyword) ||
                unit.includes(keyword)
            );

        });


    displayPackages(filtered);

});


// =======================================
// EDIT / DELETE
// =======================================

document.addEventListener("click", async (event) => {


    // EDIT

    const editBtn =
        event.target.closest(".editBtn");

    if (editBtn) {

        const id = editBtn.dataset.id;

        const pkg =
            packages.find(
                item => item._id === id
            );

        if (!pkg) {

            alert("Package not found.");

            return;
        }


        editingId = id;

        document.querySelector(".modal-content h2")
            .textContent = "Edit Package";

        saveBtn.textContent = "Update Package";


        document.getElementById("packageName").value =
            pkg.name || "";

        document.getElementById("packagePrice").value =
            pkg.price || "";

        document.getElementById("packageDuration").value =
            pkg.duration || "";

        document.getElementById("durationUnit").value =
            pkg.durationUnit || "Hours";

        document.getElementById("packageStatus").value =
            pkg.status || "Active";


        modal.style.display = "flex";

        return;
    }


    // DELETE

    const deleteBtn =
        event.target.closest(".deleteBtn");

    if (deleteBtn) {

        const id = deleteBtn.dataset.id;

        if (!id) return;


        if (!confirm("Delete this package?")) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/packages/${encodeURIComponent(id)}`,
                    {
                        method: "DELETE",
                        credentials: "include"
                    }
                );


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                alert(
                    result.message ||
                    "Unable to delete package."
                );

                return;
            }


            await loadPackages();


        } catch (error) {

            console.error(error);

            alert("Server error.");

        }

    }

});


// =======================================
// SAVE / UPDATE
// =======================================

saveBtn.addEventListener("click", async () => {


    const name =
        document.getElementById("packageName")
            .value
            .trim();


    const price =
        Number(
            document.getElementById("packagePrice").value
        );


    const duration =
        Number(
            document.getElementById("packageDuration").value
        );


    const durationUnit =
        document.getElementById("durationUnit").value;


    const status =
        document.getElementById("packageStatus").value;


    if (
        !name ||
        price <= 0 ||
        duration <= 0
    ) {

        alert("Please complete all fields.");

        return;
    }


    const packageData = {
        name,
        price,
        duration,
        durationUnit,
        status
    };


    const url = editingId
        ? `/api/packages/${encodeURIComponent(editingId)}`
        : "/api/packages";


    const method = editingId
        ? "PUT"
        : "POST";


    saveBtn.disabled = true;

    saveBtn.textContent =
        editingId
            ? "Updating..."
            : "Saving...";


    try {

        const response =
            await fetch(url, {

                method,

                credentials: "include",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(packageData)

            });


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            alert(
                result.message ||
                "Unable to save package."
            );

            return;
        }


        modal.style.display = "none";

        editingId = null;

        await loadPackages();


    } catch (error) {

        console.error(
            "Save package error:",
            error
        );

        alert("Unable to contact the server.");

    } finally {

        saveBtn.disabled = false;

        saveBtn.textContent =
            editingId
                ? "Update Package"
                : "Save Package";

    }

});


// =======================================
// REFRESH
// =======================================

function refreshPackages() {
    loadPackages();
}


// =======================================
// ESCAPE HTML
// =======================================

function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =======================================
// INITIAL LOAD
// =======================================

document.addEventListener("DOMContentLoaded", () => {

    loadPackages();

});