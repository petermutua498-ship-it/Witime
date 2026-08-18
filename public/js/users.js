// ======================================
// WiTime - Users Management
// ======================================

const table = document.getElementById("userTable");
const searchBox = document.getElementById("searchUser");
const refreshBtn = document.getElementById("refreshUsers");
const viewAllBtn = document.getElementById("viewAllUsers");

let users = [];

const USERS_TO_SHOW = 5;


// ======================================
// LOAD USERS
// ======================================

async function loadUsers() {

    try {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Loading users...
                </td>
            </tr>
        `;

        const response = await fetch("/api/users", {
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

        console.log("WiTime Users:", data);

        // Support both:
        // [users]
        // { users: [users] }

        if (Array.isArray(data)) {

            users = data;

        } else if (Array.isArray(data.users)) {

            users = data.users;

        } else {

            throw new Error(
                "Invalid users response"
            );

        }

        displayUsers(users);

    } catch (error) {

        console.error(
            "❌ Users loading error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty error">
                    Unable to load users.
                    <br>
                    <small>
                        ${escapeHtml(error.message)}
                    </small>
                </td>
            </tr>
        `;

    }

}


// ======================================
// DISPLAY USERS
// ======================================

function displayUsers(data) {

    table.innerHTML = "";

    if (!data || data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No users found.
                </td>
            </tr>
        `;

        viewAllBtn.style.display = "none";

        return;
    }

    // ======================================
    // PUT ONLINE USERS FIRST
    // ======================================

    const sortedUsers = [...data].sort((a, b) => {

        // Online users first
        if (a.status === "Online" && b.status !== "Online") {
            return -1;
        }

        if (a.status !== "Online" && b.status === "Online") {
            return 1;
        }

        // Then newest updated user
        const dateA =
            new Date(a.updatedAt || a.createdAt || 0);

        const dateB =
            new Date(b.updatedAt || b.createdAt || 0);

        return dateB - dateA;
    });


    // ======================================
    // SHOW FIRST 5
    // ======================================

    const visibleUsers =
        sortedUsers.slice(0, USERS_TO_SHOW);


    visibleUsers.forEach(user => {

        const isOnline =
            user.status === "Online";


        const status =
            isOnline
                ? "Online"
                : "Offline";


        const statusClass =
            isOnline
                ? "online"
                : "offline";


        let connectionText =
            "Not Connected";


        if (isOnline) {

            connectionText = `

                <div class="connection-info">

                    <strong>
                        🟢 Connected
                    </strong>

                    <small>
                        IP:
                        ${escapeHtml(
                            user.ipAddress || "-"
                        )}
                    </small>

                    <small>
                        MAC:
                        ${escapeHtml(
                            user.macAddress || "-"
                        )}
                    </small>

                </div>

            `;
        }


        table.innerHTML += `

            <tr>

                <td>
                    <strong>
                        ${escapeHtml(
                            user.phone || "-"
                        )}
                    </strong>
                </td>


                <td>
                    ${escapeHtml(
                        user.packageName || "-"
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        user.remainingTime || "-"
                    )}
                </td>


                <td>

                    <span
                        class="status ${statusClass}">

                        ${status}

                    </span>

                </td>


                <td>
                    ${connectionText}
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


    // ======================================
    // VIEW ALL
    // ======================================

    if (sortedUsers.length > USERS_TO_SHOW) {

        viewAllBtn.style.display =
            "inline-block";

        viewAllBtn.textContent =
            `View All Users (${sortedUsers.length})`;

    } else {

        viewAllBtn.style.display =
            "none";

    }

}


// ======================================
// SEARCH
// ======================================

searchBox.addEventListener(
    "input",
    () => {

        const keyword =
            searchBox.value
                .trim()
                .toLowerCase();


        if (!keyword) {

            displayUsers(users);

            return;

        }


        const filtered =
            users.filter(user => {

                const phone =
                    String(
                        user.phone || ""
                    ).toLowerCase();


                const packageName =
                    String(
                        user.packageName || ""
                    ).toLowerCase();


                const status =
                    String(
                        user.status || ""
                    ).toLowerCase();


                return (

                    phone.includes(keyword) ||

                    packageName.includes(keyword) ||

                    status.includes(keyword)

                );

            });


        displayUsers(filtered);

    }
);


// ======================================
// REFRESH
// ======================================

refreshBtn.addEventListener(
    "click",
    async () => {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "Refreshing...";


        await loadUsers();


        refreshBtn.disabled = false;

        refreshBtn.textContent =
            "↻ Refresh";

    }
);


// ======================================
// VIEW USER
// ======================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".viewBtn"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;


        if (!id) {

            alert(
                "User ID not found."
            );

            return;

        }


        window.location.href =
            `/admin/user-details.html?id=${encodeURIComponent(id)}`;

    }
);


// ======================================
// VIEW ALL
// ======================================

viewAllBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "/admin/all-users.html";

    }
);


// ======================================
// HTML ESCAPE
// ======================================

function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// ======================================
// INITIAL LOAD
// ======================================

loadUsers();