// ======================================
// WiTime Connected Page Script
// ======================================

const params = new URLSearchParams(window.location.search);
const phone = params.get("phone");
const routerIp = params.get("routerIp") || "192.168.88.1"; // Default MikroTik gateway

if (!phone) {
    alert("Invalid connection.");
    window.location.href = "/";
}

let countdownTimer = null;
let hasAttemptedLogin = false; // Prevents auto-login loop on every refresh
let pendingExpiryDate = null;  // Holds expiry date until network is verified

// ======================================
// MIKROTIK AUTO-LOGIN & NETWORK VERIFICATION
// ======================================

function submitMikrotikLogin(expiryDate) {
    pendingExpiryDate = expiryDate;

    if (!hasAttemptedLogin) {
        hasAttemptedLogin = true;

        const statusElement = document.getElementById("status");
        if (statusElement) statusElement.innerText = "Authenticating with Wi-Fi...";

        // Extract link-login-only parameter or construct default local login URL
        const linkLogin = params.get("link-login-only") || `http://${routerIp}/login`;

        // 1. Create a hidden background iframe to post credentials without re-navigating
        const iframeName = "mikrotik_login_iframe_" + Date.now();
        let iframe = document.createElement("iframe");
        iframe.name = iframeName;
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        // 2. Build dynamic hidden POST form
        const form = document.createElement("form");
        form.method = "POST";
        form.action = linkLogin;
        form.target = iframeName;

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

        document.body.appendChild(form);
        form.submit();

        console.log(`[WiTime] Posted login to MikroTik for user: ${phone}`);
    }

    // Verify network connectivity before starting countdown
    verifyNetworkAndStartTimer();
}

function verifyNetworkAndStartTimer() {
    let attempts = 0;
    const maxAttempts = 15;
    const statusElement = document.getElementById("status");

    // Don't re-run polling if timer is already active
    if (countdownTimer) return;

    const checkInterval = setInterval(async () => {
        attempts++;
        if (statusElement && !countdownTimer) {
            statusElement.innerText = `Establishing Internet (${attempts}s)...`;
        }

        try {
            // Ping external endpoint to verify internet routing through MikroTik
            const response = await fetch("https://witime-o2tz.onrender.com/api/health?cachebust=" + Date.now(), {
                mode: "cors",
                cache: "no-store"
            });

            if (response.ok) {
                clearInterval(checkInterval);
                updateStatus("Online");

                // 🚀 NETWORK ACCESS CONFIRMED — START COUNTDOWN TIMER NOW
                if (pendingExpiryDate) {
                    startCountdown(pendingExpiryDate);
                }
            }
        } catch (err) {
            console.log("Waiting for internet routing...", err);
        }

        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (statusElement && !countdownTimer) {
                statusElement.innerText = "Connecting taking longer than expected. Retrying...";
                hasAttemptedLogin = false; // Allow retry on next sync
            }
        }
    }, 1000);
}

// ======================================
// LOAD CONNECTION DATA FROM BACKEND
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

        // 1. Basic Information
        const phoneElement = document.getElementById("phone");
        if (phoneElement) {
            phoneElement.innerText = data.phone || phone;
        }

        const packageElement = document.getElementById("package");
        if (packageElement) {
            packageElement.innerText = data.packageName || "Unknown";
        }

        // 2. Login & Expiry Times
        const connectedAt = document.getElementById("connectedAt");
        if (connectedAt && data.loginTime) {
            connectedAt.innerText = new Date(data.loginTime).toLocaleString();
        }

        const expiresAt = document.getElementById("expiresAt");
        if (expiresAt && data.expiryTime) {
            expiresAt.innerText = new Date(data.expiryTime).toLocaleString();
        }

        // 3. Status Check
        if (data.status === "Expired" || data.remainingTime === "Expired") {
            updateStatus("Expired");
            const remainingElement = document.getElementById("remainingTime");
            if (remainingElement) remainingElement.innerText = "Expired";
            stopCountdown();
            return;
        }

        // 4. Handle Expiry Date Parsing
        let expiryDate = null;
        if (data.expiryTime) {
            const parsed = new Date(data.expiryTime);
            if (!Number.isNaN(parsed.getTime())) {
                expiryDate = parsed;
            }
        }

        // 5. Trigger Login and Defer Countdown Until Verified
        if (["Paid", "Online", "Active"].includes(data.status)) {
            submitMikrotikLogin(expiryDate);
        } else {
            updateStatus(data.status || "Pending");
        }

    } catch (error) {
        console.error("Connection loading error:", error);
    }
}

// ======================================
// STATUS & TIMER HELPERS
// ======================================

function updateStatus(status) {
    const statusElement = document.getElementById("status");
    if (statusElement) {
        statusElement.innerText = status;
    }
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

// Sync with server every 30 seconds
setInterval(loadConnection, 30 * 1000);

// Buy Again Button
const buyAgain = document.getElementById("buyAgain");
if (buyAgain) {
    buyAgain.addEventListener("click", () => {
        window.location.href = "/";
    });
}

// Initialize sequence
loadConnection();