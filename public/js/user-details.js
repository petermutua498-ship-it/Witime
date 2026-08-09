// =======================================
// WiTime User Details
// =======================================

const userPhone = document.getElementById("userPhone");
const userStatus = document.getElementById("userStatus");

const detailPhone = document.getElementById("detailPhone");
const detailPackage = document.getElementById("detailPackage");
const detailRemaining = document.getElementById("detailRemaining");
const detailStatus = document.getElementById("detailStatus");
const detailStart = document.getElementById("detailStart");
const detailExpiry = document.getElementById("detailExpiry");

const extendBtn = document.getElementById("extendBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const actionMessage = document.getElementById("actionMessage");


// =======================================
// Get User ID
// =======================================

const params = new URLSearchParams(
    window.location.search
);

const userId = params.get("id");


// =======================================
// Check ID
// =======================================

if (!userId) {

    actionMessage.textContent =
        "No user was selected.";

    extendBtn.disabled = true;
    disconnectBtn.disabled = true;

} else {

    loadUser();

}


// =======================================
// Load User
// =======================================

async function loadUser() {

    try {

        const response =
            await fetch(`/api/users/${userId}`);

        if (!response.ok) {

            throw new Error(
                "Unable to load user"
            );

        }

        const user =
            await response.json();


        // Header

        userPhone.textContent =
            user.phone || "-";


        // Details

        detailPhone.textContent =
            user.phone || "-";

        detailPackage.textContent =
            user.packageName || "-";

        detailRemaining.textContent =
            user.remainingTime || "-";

        detailStatus.textContent =
            user.status || "Offline";


        // Status

        userStatus.textContent =
            user.status || "Offline";

        userStatus.className =
            "status-badge " +
            (
                user.status === "Online"
                    ? "status-online"
                    : "status-offline"
            );


        // Dates

        detailStart.textContent =
            formatDate(user.startTime);

        detailExpiry.textContent =
            formatDate(user.expiryTime);


    } catch (error) {

        console.error(
            "Load user error:",
            error
        );

        actionMessage.textContent =
            "Unable to load user details.";

    }

}


// =======================================
// Format Date
// =======================================

function formatDate(date) {

    if (!date) {

        return "-";

    }

    const parsed =
        new Date(date);

    if (isNaN(parsed.getTime())) {

        return "-";

    }

    return parsed.toLocaleString();

}


// =======================================
// Extend Package
// =======================================

extendBtn.addEventListener(
    "click",
    async () => {

        if (!userId) return;


        const confirmed =
            confirm(
                "Extend this user's package?"
            );


        if (!confirmed) return;


        try {

            extendBtn.disabled = true;

            actionMessage.textContent =
                "Extending package...";


            const response =
                await fetch(
                    `/api/users/${userId}/extend`,
                    {
                        method: "POST"
                    }
                );


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                actionMessage.textContent =
                    result.message ||
                    "Unable to extend package.";

                return;

            }


            actionMessage.textContent =
                "Package extended successfully.";


            await loadUser();


        } catch (error) {

            console.error(
                "Extend error:",
                error
            );

            actionMessage.textContent =
                "Unable to contact server.";

        } finally {

            extendBtn.disabled = false;

        }

    }
);


// =======================================
// Disconnect User
// =======================================

disconnectBtn.addEventListener(
    "click",
    async () => {

        if (!userId) return;


        const confirmed =
            confirm(
                "Disconnect this user?"
            );


        if (!confirmed) return;


        try {

            disconnectBtn.disabled = true;

            actionMessage.textContent =
                "Disconnecting user...";


            const response =
                await fetch(
                    `/api/users/${userId}/disconnect`,
                    {
                        method: "POST"
                    }
                );


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                actionMessage.textContent =
                    result.message ||
                    "Unable to disconnect user.";

                return;

            }


            actionMessage.textContent =
                "User disconnected successfully.";


            await loadUser();


        } catch (error) {

            console.error(
                "Disconnect error:",
                error
            );

            actionMessage.textContent =
                "Unable to contact server.";

        } finally {

            disconnectBtn.disabled = false;

        }

    }
);