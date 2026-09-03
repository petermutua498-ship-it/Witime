// ======================================
// WiTime Connected
// ======================================

const params = new URLSearchParams(window.location.search);
const phone = params.get("phone");
const routerIp = params.get("routerIp") || "192.168.88.1"; // Dynamic IP or default gateway

if (!phone) {
    alert("Invalid connection.");
    window.location.href = "/";
}

let countdownTimer = null;
let hasAttemptedLogin = false; // Prevents auto-login loop on every refresh

// ======================================
// MIKROTIK AUTO-LOGIN FUNCTION
// ======================================

function autoLoginToMikrotik(userPhone, ipAddress = "192.168.88.1") {
    if (hasAttemptedLogin) return;
    hasAttemptedLogin = true;

    console.log(`[WiTime] Redirecting user ${userPhone} to router gateway (${ipAddress})...`);

    // Standard MikroTik HTTP GET login URL with destination target
    const targetUrl = `http://${ipAddress}/login?username=${encodeURIComponent(userPhone)}&password=${encodeURIComponent(userPhone)}&dst=https://www.google.com`;

    // Direct browser redirect bypasses HTTPS mixed-content/CORS blocking
    window.location.href = targetUrl;
}

// ======================================
// LOAD CONNECTION
// ======================================

async function loadConnection() {
    try {
        const response = await fetch(
            `/api/connected/${encodeURIComponent(phone)}`,
            { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Connection error:", data);
            return;
        }

        // ==================================
        // BASIC INFORMATION
        // ==================================

        const phoneElement = document.getElementById("phone");
        if (phoneElement) {
            phoneElement.innerText = data.phone || phone;
        }

        const packageElement = document.getElementById("package");
        if (packageElement) {
            packageElement.innerText = data.packageName || "Unknown";
        }

        // ==================================
        // LOGIN TIME
        // ==================================

        const connectedAt = document.getElementById("connectedAt");
        if (connectedAt && data.loginTime) {
            connectedAt.innerText = new Date(data.loginTime).toLocaleString();
        }

        // ==================================
        // EXPIRY TIME
        // ==================================

        const expiresAt = document.getElementById("expiresAt");
        if (expiresAt && data.expiryTime) {
            expiresAt.innerText = new Date(data.expiryTime).toLocaleString();
        }

        // ==================================
        // STATUS
        // ==================================

        updateStatus(data.status);

        // ==================================
        // REMAINING TIME
        // ==================================

        updateRemainingTime(data);

        // ==================================
        // TRIGGER AUTO-LOGIN TO MIKROTIK
        // ==================================

        if (data.status === "Active" || data.status === "Connected" || data.status === "completed") {
            // Short delay ensures MikroTik scheduler finished creating user account
            setTimeout(() => {
                autoLoginToMikrotik(data.phone || phone, routerIp);
            }, 2000);
        }

    } catch (error) {
        console.error("Connection loading error:", error);
    }
}

// ======================================
// STATUS
// ======================================

function updateStatus(status) {
    const statusElement = document.getElementById("status");
    if (!statusElement) return;
    statusElement.innerText = status || "Offline";
}

// ======================================
// REMAINING TIME
// ======================================

function updateRemainingTime(data) {
    const remainingElement = document.getElementById("remainingTime");
    if (!remainingElement) return;

    if (
        data.status === "Expired" ||
        data.remainingTime === "Expired"
    ) {
        remainingElement.innerText = "Expired";
        stopCountdown();
        return;
    }

    if (!data.expiryTime) {
        remainingElement.innerText = data.remainingTime || "No expiry time";
        return;
    }

    const expiry = new Date(data.expiryTime);

    if (Number.isNaN(expiry.getTime())) {
        remainingElement.innerText = data.remainingTime || "Unknown";
        return;
    }

    startCountdown(expiry);
}

// ======================================
// START COUNTDOWN
// ======================================

function startCountdown(expiry) {
    stopCountdown();

    function update() {
        const now = Date.now();
        const diff = expiry.getTime() - now;

        if (diff <= 0) {
            document.getElementById("remainingTime").innerText = "Expired";
            updateStatus("Expired");
            stopCountdown();

            setTimeout(loadConnection, 1000);
            return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const remainingElement = document.getElementById("remainingTime");
        if (remainingElement) {
            remainingElement.innerText =
                `${String(hrs).padStart(2, "0")}:` +
                `${String(mins).padStart(2, "0")}:` +
                `${String(secs).padStart(2, "0")}`;
        }
    }

    update();
    countdownTimer = setInterval(update, 1000);
}

// ======================================
// STOP COUNTDOWN
// ======================================

function stopCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
}

// ======================================
// REFRESH SERVER DATA
// ======================================

setInterval(loadConnection, 30 * 1000);

// ======================================
// BUY AGAIN
// ======================================

const buyAgain = document.getElementById("buyAgain");
if (buyAgain) {
    buyAgain.addEventListener("click", () => {
        window.location.href = "/";
    });
}

// ======================================
// START
// ======================================

loadConnection();