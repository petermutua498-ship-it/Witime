// ======================================
// WiTime - ALL USERS MANAGEMENT
// ======================================

const table = document.getElementById("allUsersTable");
const searchBox = document.getElementById("searchAllUsers");
const refreshBtn = document.getElementById("refreshAllUsers");
const backBtn = document.getElementById("backUsers");

const totalUsersEl = document.getElementById("totalUsers");
const onlineUsersEl = document.getElementById("onlineUsers");
const offlineUsersEl = document.getElementById("offlineUsers");

let users = [];


// ======================================
// LOAD USERS
// ======================================

async function loadUsers() {

    try {

        table.innerHTML = `
            <tr>
                <td colspan="9" class="empty">
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

        console.log(
            "WiTime All Users response:",
            data
        );


        // ======================================
        // ACCEPT ARRAY RESPONSE
        // ======================================

        if (Array.isArray(data)) {

            users = data;

        }

        else if (Array.isArray(data.users)) {

            users = data.users;

        }

        else {

            throw new Error(
                "Invalid users response from server"
            );

        }


        displayUsers(users);

    }

    catch (error) {

        console.error(
            "❌ All Users load error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="9" class="empty error">
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
// SORT USERS
// ======================================

function sortUsers(data) {

    return [...data].sort((a, b) => {

        // Online users first
        if (
            a.status === "Online" &&
            b.status !== "Online"
        ) {

            return -1;

        }

        if (
            a.status !== "Online" &&
            b.status === "Online"
        ) {

            return 1;

        }


        // Newest updated records first
        const dateA =
            new Date(
                a.updatedAt ||
                a.createdAt ||
                0
            );

        const dateB =
            new Date(
                b.updatedAt ||
                b.createdAt ||
                0
            );


        return dateB - dateA;

    });

}


// ======================================
// DISPLAY USERS
// ======================================

function displayUsers(data) {

    table.innerHTML = "";


    // ======================================
    // SUMMARY
    // ======================================

    const total =
        data.length;


    const online =
        data.filter(
            user => user.status === "Online"
        ).length;


    const offline =
        total - online;


    totalUsersEl.textContent =
        total;


    onlineUsersEl.textContent =
        online;


    offlineUsersEl.textContent =
        offline;


    // ======================================
    // EMPTY
    // ======================================

    if (total === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="9" class="empty">
                    No users found.
                </td>
            </tr>
        `;

        return;

    }


    // ======================================
    // SORT
    // ======================================

    const sortedUsers =
        sortUsers(data);


    // ======================================
    // RENDER
    // ======================================

    sortedUsers.forEach(
        (user, index) => {

            const isOnline =
                user.status === "Online";


            const statusClass =
                isOnline
                    ? "online"
                    : "offline";


            const statusText =
                isOnline
                    ? "Online"
                    : "Offline";


            const ip =
                isOnline
                    ? (
                        user.ipAddress ||
                        "-"
                    )
                    : "-";


            const mac =
                isOnline
                    ? (
                        user.macAddress ||
                        "-"
                    )
                    : "-";


            const created =
                formatDate(
                    user.createdAt
                );


            table.innerHTML += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


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

                            ${statusText}

                        </span>

                    </td>


                    <td>
                        ${escapeHtml(ip)}
                    </td>


                    <td>
                        ${escapeHtml(mac)}
                    </td>


                    <td>
                        ${escapeHtml(created)}
                    </td>


                    <td>

                        <button
                            class="viewBtn"
                            data-id="${escapeHtml(
                                user._id
                            )}">

                            👁 View

                        </button>

                    </td>

                </tr>

            `;

        }
    );

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


                const ip =
                    String(
                        user.ipAddress || ""
                    ).toLowerCase();


                const mac =
                    String(
                        user.macAddress || ""
                    ).toLowerCase();


                return (

                    phone.includes(keyword) ||

                    packageName.includes(keyword) ||

                    status.includes(keyword) ||

                    ip.includes(keyword) ||

                    mac.includes(keyword)

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
// BACK TO USERS
// ======================================

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "/admin/users.html";

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
// FORMAT DATE
// ======================================

function formatDate(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleString(
        "en-KE",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// ======================================
// HTML ESCAPE
// ======================================

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ======================================
// INITIAL LOAD
// ======================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUsers();

    }
);