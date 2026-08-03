// =======================================
// WiTime Users Management
// =======================================

const table = document.getElementById("userTable");
const searchBox = document.getElementById("searchUser");
const refreshBtn = document.getElementById("refreshUsers");

let users = [];

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

        users = await response.json();

        displayUsers(users);

    } catch (err) {

        console.error(err);

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

        return;

    }

    data.forEach(user => {

        table.innerHTML += `

        <tr>

            <td>${user.phone}</td>

            <td>${user.packageName}</td>

            <td>${user.remainingTime}</td>

            <td>

                <span class="${user.status === "Online"
                    ? "online"
                    : "offline"}">

                    ${user.status}

                </span>

            </td>

            <td>

                <button
                    class="extendBtn"
                    data-id="${user._id}">

                    ➕ Extend

                </button>

                <button
                    class="disconnectBtn"
                    data-id="${user._id}">

                    🔌 Disconnect

                </button>

            </td>

        </tr>

        `;

    });

}

// =======================================
// Search Users
// =======================================

searchBox.addEventListener("keyup", () => {

    const keyword = searchBox.value.toLowerCase();

    const filtered = users.filter(user =>

        user.phone.toLowerCase().includes(keyword)

    );

    displayUsers(filtered);

});

// =======================================
// Refresh Button
// =======================================

refreshBtn.addEventListener("click", () => {

    loadUsers();

});

// =======================================
// Buttons
// =======================================

document.addEventListener("click", async (e) => {

    // Disconnect

    if (e.target.classList.contains("disconnectBtn")) {

        const id = e.target.dataset.id;

        if (!confirm("Disconnect this user?")) return;

        try {

            const response = await fetch(`/api/users/${id}/disconnect`, {

                method: "POST"

            });

            const result = await response.json();

            if (result.success) {

                loadUsers();

            } else {

                alert(result.message);

            }

        } catch (err) {

            console.error(err);

        }

    }

    // Extend

    if (e.target.classList.contains("extendBtn")) {

        const id = e.target.dataset.id;

        try {

            const response = await fetch(`/api/users/${id}/extend`, {

                method: "POST"

            });

            const result = await response.json();

            if (result.success) {

                loadUsers();

            } else {

                alert(result.message);

            }

        } catch (err) {

            console.error(err);

        }

    }

});

// =======================================
// Initialize
// =======================================

window.addEventListener("DOMContentLoaded", () => {

    loadUsers();

});