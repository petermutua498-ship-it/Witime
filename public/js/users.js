// =======================================
// WiTime Users Management
// =======================================

const table = document.getElementById("userTable");
const searchBox = document.getElementById("searchUser");
const refreshBtn = document.getElementById("refreshUsers");
const viewAllBtn = document.getElementById("viewAllUsers");

let users = [];

const USERS_TO_SHOW = 5;

// =======================================
// Load Users
// =======================================

async function loadUsers() {

    try {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Loading users...
                </td>
            </tr>
        `;

        const response = await fetch("/api/users");

        if (!response.ok) {
            throw new Error("Unable to load users");
        }

        users = await response.json();

        displayUsers(users);

    } catch (err) {

        console.error("Load users error:", err);

        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Unable to load users.
                </td>
            </tr>
        `;

    }

}


// =======================================
// Display Users
// =======================================

function displayUsers(data) {

    table.innerHTML = "";

    if (data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    No users found.
                </td>
            </tr>
        `;

        viewAllBtn.style.display = "none";

        return;
    }


    // Only show first 5 users
    const visibleUsers = data.slice(0, USERS_TO_SHOW);


    visibleUsers.forEach(user => {

        const statusClass =
            user.status === "Online"
                ? "online"
                : "offline";


        table.innerHTML += `

            <tr>

                <td>
                    ${user.phone || "-"}
                </td>

                <td>
                    ${user.packageName || "-"}
                </td>

                <td>
                    ${user.remainingTime || "-"}
                </td>

                <td>

                    <span class="${statusClass}">

                        ${user.status || "Offline"}

                    </span>

                </td>

                <td>

                    <button
                        class="viewBtn"
                        data-id="${user._id}">

                        👁 View

                    </button>

                </td>

            </tr>

        `;

    });


    // Show View All if there are more than 5 users

    if (data.length > USERS_TO_SHOW) {

        viewAllBtn.style.display = "block";

        viewAllBtn.textContent =
            `View All Users (${data.length})`;

    } else {

        viewAllBtn.style.display = "none";

    }

}


// =======================================
// Search Users
// =======================================

searchBox.addEventListener("keyup", () => {

    const keyword =
        searchBox.value.trim().toLowerCase();


    const filtered = users.filter(user => {

        const phone =
            String(user.phone || "").toLowerCase();

        const packageName =
            String(user.packageName || "").toLowerCase();

        return (
            phone.includes(keyword) ||
            packageName.includes(keyword)
        );

    });


    displayUsers(filtered);

});


// =======================================
// Refresh
// =======================================

refreshBtn.addEventListener("click", () => {

    loadUsers();

});


// =======================================
// View User
// =======================================

document.addEventListener("click", (event) => {

    if (event.target.classList.contains("viewBtn")) {

        const id =
            event.target.dataset.id;


        if (!id) {

            alert("User ID not found.");

            return;

        }


        window.location.href =
            `/admin/user-details.html?id=${id}`;

    }

});


// =======================================
// View All Users
// =======================================

viewAllBtn.addEventListener("click", () => {

    window.location.href =
        "/admin/all-users.html";

});


// =======================================
// Initialize
// =======================================

window.addEventListener("DOMContentLoaded", () => {

    loadUsers();

});