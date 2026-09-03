const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

let remainingSeconds = 0;
let countdownTimer = null;

// ================================
// ELEMENTS
// ================================

const errorBox = document.getElementById("errorBox");

const userPhone = document.getElementById("userPhone");
const userStatus = document.getElementById("userStatus");

const phone = document.getElementById("phone");
const packageName = document.getElementById("packageName");
const remainingTime = document.getElementById("remainingTime");

const ipAddress = document.getElementById("ipAddress");
const macAddress = document.getElementById("macAddress");
const sessionId = document.getElementById("sessionId");

const loginTime = document.getElementById("loginTime");
const expiryTime = document.getElementById("expiryTime");
const createdAt = document.getElementById("createdAt");

const connectionBox = document.getElementById("connectionBox");
const connectionStatus = document.getElementById("connectionStatus");
const connectionMessage = document.getElementById("connectionMessage");


// ================================
// FORMAT DATE
// ================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString();
}


// ================================
// FORMAT REMAINING TIME
// ================================

function formatRemaining(seconds) {

    seconds = Math.max(0, Number(seconds) || 0);

    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
        (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
}


// ================================
// UPDATE STATUS
// ================================

function updateStatus(status) {

    const online = status === "Online";

    userStatus.textContent = online
        ? "Online"
        : "Offline";

    userStatus.className =
        `status ${online ? "online" : "offline"}`;


    connectionBox.className =
        `connection ${online ? "online" : "offline"}`;

    connectionStatus.textContent =
        online ? "Online" : "Offline";

    connectionMessage.textContent =
        online
            ? "User is currently connected to the WiFi."
            : "User is not currently connected.";
}


// ================================
// COUNTDOWN
// ================================

function startCountdown() {

    if (countdownTimer) {
        clearInterval(countdownTimer);
    }

    countdownTimer = setInterval(() => {

        if (remainingSeconds <= 0) {

            clearInterval(countdownTimer);

            remainingTime.textContent = "Expired";

            return;
        }

        remainingSeconds--;

        remainingTime.textContent =
            formatRemaining(remainingSeconds);

    }, 1000);
}


// ================================
// LOAD USER
// ================================

async function loadUser() {

    if (!userId) {

        errorBox.textContent =
            "No user ID was provided.";

        errorBox.style.display = "block";

        return;
    }

    try {

        const response = await fetch(
            `/api/users/${encodeURIComponent(userId)}`
        );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const result = await response.json();

        const user = result.user || result;

        if (!user) {

            throw new Error(
                "User not found"
            );

        }


        // ================================
        // BASIC INFORMATION
        // ================================

        userPhone.textContent =
            user.phone || "-";

        phone.textContent =
            user.phone || "-";

        packageName.textContent =
            user.packageName || "-";


        // ================================
        // STATUS
        // ================================

        updateStatus(
            user.status
        );


        // ================================
        // CONNECTION
        // ================================

        ipAddress.textContent =
            user.ipAddress || "-";

        macAddress.textContent =
            user.macAddress || "-";

        sessionId.textContent =
            user.mikrotikSessionId || "-";


        // ================================
        // REMAINING TIME
        // ================================

        remainingSeconds =
            Number(user.remainingSeconds || 0);

        if (remainingSeconds > 0) {

            remainingTime.textContent =
                formatRemaining(
                    remainingSeconds
                );

            startCountdown();

        } else {

            remainingTime.textContent =
                user.remainingTime || "Expired";
        }


        // ================================
        // DATES
        // ================================

        loginTime.textContent =
            formatDate(user.loginTime);

        expiryTime.textContent =
            formatDate(user.expiryTime);

        createdAt.textContent =
            formatDate(user.createdAt);


    } catch (error) {

        console.error(
            "User details error:",
            error
        );

        errorBox.textContent =
            "Unable to load this user's information.";

        errorBox.style.display =
            "block";
    }
}


// ================================
// BACK BUTTON
// ================================

const backButton =
    document.getElementById("backButton");

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "/admin/all-users.html";

        }
    );

}


// ================================
// START
// ================================

loadUser();