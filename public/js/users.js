// ======================================
// WiTime Users Management
// ======================================

const table = document.getElementById("userTable");
const searchBox = document.getElementById("searchUser");
const refreshBtn = document.getElementById("refreshUsers");
const viewAllBtn = document.getElementById("viewAllUsers");

let users = [];

const USERS_TO_SHOW = 5;


// ======================================
// Load MongoDB Users
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
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Unable to load users");
        }

        users = await response.json();

        // Load MikroTik active users
        let activeUsers = [];

        try {

            const mikrotikResponse =
                await fetch("/api/admin/mikrotik/active-users", {
                    credentials: "include"
                });

            if (mikrotikResponse.ok) {

                const mikrotikData =
                    await mikrotikResponse.json();

                if (mikrotikData.success) {
                    activeUsers = mikrotikData.users || [];
                }

            }

        } catch (error) {

            console.warn(
                "Unable to load MikroTik active users:",
                error
            );

        }


        // ==================================
        // Match MikroTik users
        // ==================================

        users = users.map(user => {

            let connection = null;

            // Match using saved MikroTik session ID
            if (user.mikrotikSessionId) {

                connection = activeUsers.find(
                    active =>
                        active.id === user.mikrotikSessionId
                );

            }


            // Match using MAC address
            if (!connection && user.macAddress) {

                connection = activeUsers.find(
                    active =>
                        active.macAddress === user.macAddress
                );

            }


            // Match using IP address
            if (!connection && user.ipAddress) {

                connection = activeUsers.find(
                    active =>
                        active.address === user.ipAddress
                );

            }


            return {

                ...user,

                connection

            };

        });


        displayUsers(users);

    } catch (err) {

        console.error(
            "Load users error:",
            err
        );

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Unable to load users.
                </td>
            </tr>
        `;

    }

}


// ======================================
// Display Users
// ======================================

function displayUsers(data) {

    table.innerHTML = "";

    if (data.length === 0) {

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


    const visibleUsers =
        data.slice(0, USERS_TO_SHOW);


    visibleUsers.forEach(user => {

        const isConnected =
            !!user.connection;


        const status =
            isConnected
                ? "Online"
                : (user.status || "Offline");


        const statusClass =
            status === "Online"
                ? "online"
                : "offline";


        let connectionText = "Not Connected";


        if (isConnected) {

            connectionText = `
                <div class="connection-info">

                    <strong>
                        🟢 Connected
                    </strong>

                    <small>
                        IP: ${user.connection.address || "-"}
                    </small>

                    <small>
                        MAC: ${user.connection.macAddress || "-"}
                    </small>

                    <small>
                        Uptime: ${user.connection.uptime || "-"}
                    </small>

                </div>
            `;

        }


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


    if (data.length > USERS_TO_SHOW) {

        viewAllBtn.style.display = "block";

        viewAllBtn.textContent =
            `View All Users (${data.length})`;

    } else {

        viewAllBtn.style.display = "none";

    }

}


// ======================================
// Search
// ======================================

searchBox.addEventListener(
    "keyup",
    () => {

        const keyword =
            searchBox.value
                .trim()
                .toLowerCase();


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


                return (
                    phone.includes(keyword) ||
                    packageName.includes(keyword)
                );

            });


        displayUsers(filtered);

    }
);


// ======================================
// Refresh
// ======================================

refreshBtn.addEventListener(
    "click",
    () => {

        loadUsers();

    }
);


// ======================================
// View User
// ======================================

document.addEventListener(
    "click",
    event => {

        if (
            event.target.classList
                .contains("viewBtn")
        ) {

            const id =
                event.target.dataset.id;


            if (!id) {

                alert(
                    "User ID not found."
                );

                return;

            }


            window.location.href =
                `/admin/user-details.html?id=${id}`;

        }

    }
);


// ======================================
// View All
// ======================================

viewAllBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "/admin/all-users.html";

    }
);


// ======================================
// Initialize
// ======================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUsers();

    }
);