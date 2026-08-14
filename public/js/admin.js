async function loadOnlineUsers() {

    const onlineUsers =
        document.getElementById("onlineUsers");

    if (!onlineUsers) return;

    try {

        const response = await fetch(
            "/api/admin/mikrotik/active-users",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        const data = await response.json();

        console.log(
            "Active MikroTik users:",
            data
        );

        if (!response.ok || !data.success) {

            onlineUsers.textContent = "0";

            return;
        }

        onlineUsers.textContent =
            data.count ?? 0;

    } catch (error) {

        console.error(
            "Unable to load online users:",
            error
        );

        onlineUsers.textContent = "0";
    }
}


// Load when dashboard opens
loadOnlineUsers();


// Refresh every 10 seconds
setInterval(
    loadOnlineUsers,
    10000
);

async function loadConnectedUsers() {

    const table =
        document.getElementById("connectedUsers");

    if (!table) return;

    try {

        const response = await fetch(
            "/api/admin/mikrotik/active-users",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        const data = await response.json();

        console.log(
            "Connected users:",
            data
        );

        if (!response.ok || !data.success) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        Unable to load connected users.
                    </td>
                </tr>
            `;

            return;
        }

        if (!data.users || data.users.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        No connected users.
                    </td>
                </tr>
            `;

            return;
        }

        table.innerHTML = "";

        data.users.forEach(user => {

            const bytesIn =
                Number(user.bytesIn || 0);

            const bytesOut =
                Number(user.bytesOut || 0);

            const totalBytes =
                bytesIn + bytesOut;

            const totalMB =
                (totalBytes / 1024 / 1024)
                    .toFixed(2);

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${user.user || "-"}
                </td>

                <td>
                    ${user.address || "-"}
                </td>

                <td>
                    ${user.macAddress || "-"}
                </td>

                <td>
                    ${user.uptime || "0s"}
                </td>

                <td>
                    ${totalMB} MB
                </td>

                <td>

                    <button
                        class="disconnect-btn"
                        data-session-id="${user.id}"
                    >
                        Disconnect
                    </button>

                </td>

            `;

            table.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Connected users error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to connect to MikroTik.
                </td>
            </tr>
        `;

    }

}

document.addEventListener("click", async (event) => {

    if (!event.target.classList.contains("disconnect-btn")) {
        return;
    }

    const button = event.target;

    const sessionId =
        button.dataset.sessionId;

    if (!sessionId) {

        alert(
            "MikroTik session ID is missing."
        );

        return;
    }

    const confirmed =
        confirm(
            "Disconnect this user from WiTime?"
        );

    if (!confirmed) {
        return;
    }

    try {

        button.disabled = true;

        button.textContent =
            "Disconnecting...";

        const response =
            await fetch(
                "/api/admin/mikrotik/disconnect",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        sessionId
                    })
                }
            );

        const data =
            await response.json();

        console.log(
            "Disconnect response:",
            data
        );

        if (!response.ok || !data.success) {

            alert(
                data.message ||
                "Unable to disconnect user."
            );

            button.disabled = false;

            button.textContent =
                "Disconnect";

            return;
        }

        alert(
            "User disconnected successfully."
        );

        // Immediately refresh the table
        loadConnectedUsers();

        // Also refresh the number
        loadOnlineUsers();

    } catch (error) {

        console.error(
            "Disconnect error:",
            error
        );

        alert(
            "Unable to contact the WiTime server."
        );

        button.disabled = false;

        button.textContent =
            "Disconnect";

    }

});

loadConnectedUsers();

setInterval(
    loadConnectedUsers,
    10000
);

document
    .getElementById("refreshUsers")
    ?.addEventListener(
        "click",
        loadConnectedUsers
    );