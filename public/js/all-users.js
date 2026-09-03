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
// LIVE COUNTDOWN
// ======================================

setInterval(() => {

    let changed = false;

    users.forEach(user => {

        if (
            user.status === "Online" &&
            Number.isFinite(Number(user.remainingSeconds))
        ) {

            if (user.remainingSeconds > 0) {

                user.remainingSeconds--;

                changed = true;

            }

        }

    });

    if (changed) {
        updateCountdownDisplays();
    }

}, 1000);


// ======================================
// UPDATE COUNTDOWN
// ======================================

function updateCountdownDisplays() {

    document
        .querySelectorAll("[data-user-countdown]")
        .forEach(element => {

            const phone =
                element.dataset.userCountdown;

            const user =
                users.find(
                    item =>
                        String(item.phone) ===
                        String(phone)
                );

            if (!user) return;

            if (
                user.status !== "Online" ||
                Number(user.remainingSeconds) <= 0
            ) {

                element.textContent =
                    "Expired";

                return;
            }

            element.textContent =
                formatRemainingSeconds(
                    user.remainingSeconds
                );

        });

}


// ======================================
// FORMAT COUNTDOWN
// ======================================

function formatRemainingSeconds(seconds) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const days =
        Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours =
        Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        seconds % 60;

    const parts = [];

    if (days > 0) {
        parts.push(`${days}d`);
    }

    if (hours > 0 || days > 0) {
        parts.push(`${hours}h`);
    }

    if (minutes > 0 || hours > 0 || days > 0) {
        parts.push(`${minutes}m`);
    }

    parts.push(`${secs}s`);

    return parts.join(" ");
}


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

        const response =
            await fetch(
                "/api/users",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log(
            "WiTime All Users response:",
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
                "Invalid users response from server"
            );

        }

        users.forEach(user => {

            user.remainingSeconds =
                Number(
                    user.remainingSeconds || 0
                );

        });

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

    return [...data].sort(
        (a, b) => {

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

        }
    );

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
            user =>
                user.status === "Online"
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

            const remaining =
                isOnline
                    ? formatRemainingSeconds(
                        user.remainingSeconds
                    )
                    : (
                        user.remainingTime ||
                        "-"
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

                    <td
                        data-user-countdown="${escapeHtml(
                            user.phone || ""
                        )}">
                        ${escapeHtml(
                            remaining
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

                    <td class="actions">

                        <button
                            class="viewBtn action-btn"
                            data-id="${escapeHtml(
                                user._id
                            )}">
                            👁 View
                        </button>

                        <button
                            class="disconnectBtn action-btn"
                            data-id="${escapeHtml(
                                user._id
                            )}"
                            data-phone="${escapeHtml(
                                user.phone || ""
                            )}">
                            🔴 Disconnect
                        </button>

                        <button
                            class="extendBtn action-btn"
                            data-id="${escapeHtml(
                                user._id
                            )}"
                            data-phone="${escapeHtml(
                                user.phone || ""
                            )}">
                            ⏱ Extend
                        </button>

                    </td>

                </tr>

            `;

        }
    );


    updateCountdownDisplays();

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
            users.filter(
                user => {

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

                }
            );

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
// ACTION BUTTONS
// ======================================

document.addEventListener(
    "click",
    async event => {

        const viewButton =
            event.target.closest(
                ".viewBtn"
            );

        const disconnectButton =
            event.target.closest(
                ".disconnectBtn"
            );

        const extendButton =
            event.target.closest(
                ".extendBtn"
            );


        // ==================================
        // VIEW
        // ==================================

        if (viewButton) {

            const id =
                viewButton.dataset.id;

            if (!id) {

                alert(
                    "User ID not found."
                );

                return;

            }

            window.location.href =
                `/admin/user-details.html?id=${encodeURIComponent(id)}`;

            return;

        }


        // ==================================
        // DISCONNECT
        // ==================================

        if (disconnectButton) {

            const id =
                disconnectButton.dataset.id;

            const phone =
                disconnectButton.dataset.phone;


            if (!id) {

                alert(
                    "User ID not found."
                );

                return;

            }


            const confirmed =
                confirm(
                    `Disconnect ${phone || "this user"} from WiFi?`
                );


            if (!confirmed) {
                return;
            }


            disconnectButton.disabled =
                true;

            disconnectButton.textContent =
                "Disconnecting...";


            try {

                const response =
                    await fetch(
                        `/api/users/${encodeURIComponent(id)}/disconnect`,
                        {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            }
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Disconnect failed."
                    );

                }


                alert(
                    result.message ||
                    "User disconnected successfully."
                );


                await loadUsers();


            }

            catch (error) {

                console.error(
                    "Disconnect error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to disconnect user."
                );

            }

            finally {

                disconnectButton.disabled =
                    false;

                disconnectButton.textContent =
                    "🔴 Disconnect";

            }

            return;

        }


        // ==================================
        // EXTEND
        // ==================================

        if (extendButton) {

            const id =
                extendButton.dataset.id;

            const phone =
                extendButton.dataset.phone;


            if (!id) {

                alert(
                    "User ID not found."
                );

                return;

            }


            // Ask how many minutes to add
            const minutes =
                prompt(
                    `How many minutes should be added to ${phone || "this user"}?`,
                    "60"
                );


            if (
                minutes === null ||
                minutes.trim() === ""
            ) {

                return;

            }


            const duration =
                Number(minutes);


            if (
                !Number.isFinite(duration) ||
                duration <= 0
            ) {

                alert(
                    "Please enter a valid number of minutes."
                );

                return;

            }


            extendButton.disabled =
                true;

            extendButton.textContent =
                "Extending...";


            try {

                const response =
                    await fetch(
                        `/api/users/${encodeURIComponent(id)}/extend`,
                        {
                            method: "POST",

                            credentials: "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                duration,

                                durationUnit:
                                    "minutes"

                            })

                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Extension failed."
                    );

                }


                alert(
                    result.message ||
                    `Added ${duration} minutes successfully.`
                );


                await loadUsers();


            }

            catch (error) {

                console.error(
                    "Extend error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to extend user."
                );

            }

            finally {

                extendButton.disabled =
                    false;

                extendButton.textContent =
                    "⏱ Extend";

            }

        }

    }
);


// ======================================
// FORMAT DATE
// ======================================

function formatDate(value) {

    if (!value) return "-";

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

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

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