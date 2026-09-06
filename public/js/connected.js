// ======================================
// WiTime Connected Script
// ======================================

const params = new URLSearchParams(window.location.search);
const phone = params.get("phone");
const routerIp = params.get("routerIp") || "192.168.88.1";

if (!phone) {
    alert("Invalid connection.");
    window.location.href = "/";
}

let countdownTimer = null;
let hasAttemptedLogin = false;
let verifiedExpiryDate = null;

// ======================================
// 1. MIKROTIK AUTHENTICATION & VERIFICATION
// ======================================

function authenticateAndVerify(expiryDate) {
    verifiedExpiryDate = expiryDate;

    // Trigger MikroTik Login POST if not done already
    if (!hasAttemptedLogin) {
        hasAttemptedLogin = true;

        const statusElement = document.getElementById("status");
        if (statusElement) statusElement.innerText = "Authenticating with Wi-Fi...";

        const linkLogin = params.get("link-login-only") || `http://${routerIp}/login`;

        // Direct form POST to MikroTik local gateway
        const form = document.createElement("form");
        form.method = "POST";
        form.action = linkLogin;

        const user = document.createElement("input");
        user.type = "hidden";
        user.name = "username";
        user.value = phone;
        form.appendChild(user);

        const pass = document.createElement("input");
        pass.type = "hidden";
        pass.name = "password";
        pass.value = phone;
        form.appendChild(pass);

        // Target hidden iframe so page does not navigate away
        const iframeName = "mikrotik_auth_iframe";
        let iframe = document.getElementById(iframeName);
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.name = iframeName;
            iframe.id = iframeName;
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }

        form.target = iframeName;
        document.body.appendChild(form);
        form.submit();

        console.log(`[WiTime] Posted credentials (${phone}) to ${linkLogin}`);
    }

    // Ping external endpoint to ensure router granted network access
    verifyInternetAccess();
}

function verifyInternetAccess() {
    let attempts = 0;
    const maxAttempts = 15;
    const statusElement = document.getElementById("status");

    if (countdownTimer) return; // Stop redundant checks if timer is running

    const checkInterval = setInterval(async () => {
        attempts++;
        if (statusElement && !countdownTimer) {
            statusElement.innerText = `Establishing network connection (${attempts}s)...`;
        }

        try {
            const response = await fetch("https://witime-o2tz.onrender.com/api/health?cachebust=" + Date.now(), {
                mode: "cors",
                cache: "no-store"
            });

            if (response.ok) {
                clearInterval(checkInterval);
                updateStatus("Online");

                // 🚀 INTERNET ACCESS CONFIRMED — NOW START TIMER
                if (verifiedExpiryDate) {
                    startCountdown(verifiedExpiryDate);
                }
            }
        } catch (err) {
            console.log("Waiting for MikroTik routing...", err);
        }

        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (statusElement && !countdownTimer) {
                statusElement.innerText = "Connection taking longer than expected. Please retry.";
                hasAttemptedLogin = false;
            }
        }
    }, 1000);
}

// ======================================
// 2. FETCH DATA FROM SERVER
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

        // Render standard elements
        const phoneElement = document.getElementById("phone");
        if (phoneElement) phoneElement.innerText = data.phone || phone;

        const packageElement = document.getElementById("package");
        if (packageElement) packageElement.innerText = data.packageName || "Unknown";

        const connectedAt = document.getElementById("connectedAt");
        if (connectedAt && data.loginTime) {
            connectedAt.innerText = new Date(data.loginTime).toLocaleString();
        }

        const expiresAt = document.getElementById("expiresAt");
        if (expiresAt && data.expiryTime) {
            expiresAt.innerText = new Date(data.expiryTime).toLocaleString();
        }

        // Handle Expired State
        if (data.status === "Expired" || data.remainingTime === "Expired") {
            updateStatus("Expired");
            const remainingElement = document.getElementById("remainingTime");
            if (remainingElement) remainingElement.innerText = "Expired";
            stopCountdown();
            return;
        }

        // Parse expiry date without starting timer yet
        let expiryDate = null;
        if (data.expiryTime) {
            const parsed = new Date(data.expiryTime);
            if (!Number.isNaN(parsed.getTime())) {
                expiryDate = parsed;
            }
        }

        // Only authenticate if status is active/paid
        if (["Paid", "Online", "Active"].includes(data.status)) {
            authenticateAndVerify(expiryDate);
        } else {
            updateStatus(data.status || "Pending");
        }

    } catch (error) {
        console.error("Connection error:", error);
    }
}

// ======================================
// 3. UI HELPERS
// ======================================

function updateStatus(status) {
    const statusElement = document.getElementById("status");
    if (statusElement) statusElement.innerText = status;
}

function startCountdown(expiry) {
    stopCountdown();

    function update() {
        const now = Date.now();
        const diff = expiry.getTime() - now;

        if (diff <= 0) {
            const remainingElement = document.getElementById("remainingTime");
            if (remainingElement) remainingElement.innerText = "Expired";
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

function stopCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
}

setInterval(loadConnection, 30000);

const buyAgain = document.getElementById("buyAgain");
if (buyAgain) {
    buyAgain.addEventListener("click", () => {
        window.location.href = "/";
    });
}

// Initial Call
loadConnection();