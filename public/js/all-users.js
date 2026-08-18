// ======================================
// WiTime - All Users
// ======================================

const table =
    document.getElementById("allUsersTable");

const searchBox =
    document.getElementById("searchAllUsers");

const refreshBtn =
    document.getElementById("refreshAllUsers");

const backBtn =
    document.getElementById("backUsers");

const totalUsers =
    document.getElementById("totalUsers");

const onlineUsers =
    document.getElementById("onlineUsers");

const offlineUsers =
    document.getElementById("offlineUsers");


let users = [];


// ======================================
// LOAD ALL USERS
// ======================================

async function loadAllUsers() {

    try {

        table.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty">

                    Loading users...

                </td>
            </tr>
        `;


        const response =
            await fetch("/api/users", {

                method: "GET",

                credentials: "include",

                cache: "no-store"

            });


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "All users response:",
            data
        );


        if (Array.isArray(data)) {

            users = data;

        } else if (
            Array.isArray(data.users)
        ) {

            users = data.users;

        } else {

            throw new Error(
                "Invalid users response"
            );

        }


        updateSummary(users);

        displayAllUsers(users);


    } catch (error) {

        console.error(
            "❌ All users error:",
            error
        );


        table.innerHTML = `
            <tr>

                <td
                    colspan="9"
                    class="empty error">

                    Unable to load users.

                    <br>

                    <small>
                        ${escapeHtml(
                            error.message
                        )}
                    </small>

                </td>

            </tr>
        `;

    }

}


// ======================================
// SUMMARY
// ======================================

function updateSummary(data) {

    const online =
        data.filter(
            user =>
                user.status === "Online"
        ).length;


    const offline =
        data.length - online;


    totalUsers.textContent =
        data.length;


    onlineUsers.textContent =
        online;


    offlineUsers.textContent =
        offline;

}


// ======================================
// DISPLAY USERS
// ======================================

function displayAllUsers(data) {

    table.innerHTML = "";


    if (!data.length) {

        table.innerHTML = `
            <tr>

                <td
                    colspan="9"
                    class="empty">

                    No users found.

                </td>

            </tr>
        `;

        return;

    }


    data.forEach(
        (user, index) => {

            const online =
                user.status === "Online";


            const statusClass =
                online
                    ? "online"
                    : "offline";


            const created =
                user.createdAt
                    ? new Date(
                        user.createdAt
                    ).toLocaleString()
                    : "-";


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

                            ${online
                                ? "Online"
                                : "Offline"}

                        </span>

                    </td>


                    <td>
                        ${escapeHtml(
                            user.ipAddress || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            user.macAddress || "-"
                        )}
                    </td>


                    <td>
                        ${created}
                    </td>


                    <td>

                        <button
                            class="viewBtn"
                            data-id="${user._id}">

                            👁 View

                        </button>


                        ${
                            online
                                ? `
                                    <button
                                        class="disconnectBtn"
                                        data-id="${user._id}">

                                        Disconnect

                                    </button>
                                  `
                                : ""
                        }

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

            displayAllUsers(users);

            updateSummary(users);

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


        displayAllUsers(filtered);

        updateSummary(filtered);

    }
);


// ======================================
// VIEW / DISCONNECT
// ======================================

document.addEventListener(
    "click",
    async event => {


        // VIEW

        const viewButton =
            event.target.closest(
                ".viewBtn"
            );


        if (viewButton) {

            const id =
                viewButton.dataset.id;


            if (!id) {
                return;
            }


            window.location.href =
                `/admin/user-details.html?id=${encodeURIComponent(id)}`;

            return;

        }


        // DISCONNECT

        const disconnectButton =
            event.target.closest(
                ".disconnectBtn"
            );


        if (disconnectButton) {

            const id =
                disconnectButton.dataset.id;


            if (!id) {
                return;
            }


            const confirmed =
                confirm(
                    "Disconnect this user?"
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `/api/users/${encodeURIComponent(id)}/disconnect`,
                        {
                            method: "POST",
                            credentials: "include"
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok ||
                    !result.success) {

                    throw new Error(
                        result.message ||
                        "Unable to disconnect user"
                    );

                }


                await loadAllUsers();


            } catch (error) {

                console.error(
                    "Disconnect error:",
                    error
                );


                alert(
                    error.message
                );

            }

        }

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


        await loadAllUsers();


        refreshBtn.disabled = false;

        refreshBtn.textContent =
            "↻ Refresh";

    }
);


// ======================================
// BACK
// ======================================

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "/admin/users.html";

    }
);


// ======================================
// ESCAPE HTML
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
// INITIALIZE
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAllUsers();

    }
);