document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");
    const routerIp = params.get("routerIp") || "192.168.88.1";

    if (!phone) {
        alert("Invalid session. Phone number missing.");
        window.location.href = "/";
        return;
    }

    // Set UI basic elements
    const phoneElement = document.getElementById("phone");
    if (phoneElement) phoneElement.innerText = phone;

    const packageElement = document.getElementById("package");
    if (packageElement) {
        packageElement.innerText = localStorage.getItem("packageName") || "Wi-Fi Package";
    }

    let countdownInterval = null;
    let statusPollInterval = null;
    let hasLoggedIntoMikrotik = false;

    // 1. Poll database until M-Pesa payment is confirmed
    function startStatusPolling() {
        fetchConnectionStatus();
        statusPollInterval = setInterval(fetchConnectionStatus, 2000);
    }

    async function fetchConnectionStatus() {
        try {
            const response = await fetch(`/api/connected/${encodeURIComponent(phone)}`, {
                cache: "no-store"
            });

            if (!response.ok) return;

            const data = await response.json();

            // Render timestamps
            const connectedAt = document.getElementById("connectedAt");
            if (connectedAt && data.loginTime) {
                connectedAt.innerText = new Date(data.loginTime).toLocaleString();
            }

            const expiresAt = document.getElementById("expiresAt");
            if (expiresAt && data.expiryTime) {
                expiresAt.innerText = new Date(data.expiryTime).toLocaleString();
            }

            // Once payment/user is ready, authenticate with MikroTik
            if (["Paid", "Online", "Active", "Offline", "success"].includes(data.status)) {
                // Stop database polling
                if (statusPollInterval) clearInterval(statusPollInterval);

                if (!hasLoggedIntoMikrotik) {
                    hasLoggedIntoMikrotik = true;
                    submitMikrotikAndVerify(data.expiryTime);
                }

            } else if (data.status === "Expired") {
                if (statusPollInterval) clearInterval(statusPollInterval);
                renderExpiredState();
            }

        } catch (error) {
            console.error("Status polling error:", error);
        }
    }

    // 2. Submit credentials to MikroTik Hotspot
    function submitMikrotikAndVerify(expiryTime) {
        const statusElement = document.getElementById("status");
        if (statusElement) statusElement.innerText = "Authenticating with Wi-Fi...";

        const linkLogin = params.get("link-login-only") || `http://${routerIp}/login`;

        let iframe = document.getElementById("mikrotik_iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "mikrotik_iframe";
            iframe.name = "mikrotik_iframe";
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = linkLogin;
        form.target = "mikrotik_iframe";

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

        // Check if MikroTik has opened network access before starting timer
        verifyNetworkAccess(expiryTime);
    }

    // 3. Verify actual network flow through MikroTik before starting timer
    function verifyNetworkAccess(expiryTime) {
        let attempts = 0;
        const maxAttempts = 12;
        const statusElement = document.getElementById("status");

        const checkInterval = setInterval(async () => {
            attempts++;
            if (statusElement) {
                statusElement.innerText = `Connecting (${attempts}s)...`;
            }

            try {
                // Ping external live health route through MikroTik hotspot gate
                const res = await fetch("https://witime-o2tz.onrender.com/api/health?cachebust=" + Date.now(), {
                    mode: "cors",
                    cache: "no-store"
                });

                if (res.ok) {
                    clearInterval(checkInterval);

                    // Network confirmed! Set status to Connected & launch timer
                    if (statusElement) statusElement.innerText = "Connected";

                    if (expiryTime) {
                        startTimerFromExpiry(new Date(expiryTime));
                    } else {
                        startTimerFromSeconds(3600);
                    }
                }
            } catch (err) {
                console.log("Waiting for MikroTik gateway to open internet pass...", err);
            }

            // Fallback: If 12 seconds pass, assume local connection active and start timer
            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (statusElement) statusElement.innerText = "Connected";

                if (expiryTime) {
                    startTimerFromExpiry(new Date(expiryTime));
                } else {
                    startTimerFromSeconds(3600);
                }
            }
        }, 1000);
    }

    // 4. Countdown Engine
    function startTimerFromExpiry(expiryDate) {
        if (countdownInterval) clearInterval(countdownInterval);

        function tick() {
            const now = Date.now();
            const diff = expiryDate.getTime() - now;

            if (diff <= 0) {
                renderExpiredState();
                return;
            }

            const totalSeconds = Math.floor(diff / 1000);
            displayTime(totalSeconds);
        }

        tick();
        countdownInterval = setInterval(tick, 1000);
    }

    function startTimerFromSeconds(initialSeconds) {
        if (countdownInterval) clearInterval(countdownInterval);
        let secondsLeft = initialSeconds;

        function tick() {
            if (secondsLeft <= 0) {
                renderExpiredState();
                return;
            }
            displayTime(secondsLeft);
            secondsLeft--;
        }

        tick();
        countdownInterval = setInterval(tick, 1000);
    }

    function displayTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const timeString = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        const timerElement = document.getElementById("timer") || document.getElementById("remainingTime");
        if (timerElement) {
            timerElement.innerText = timeString;
        }
    }

    function renderExpiredState() {
        if (countdownInterval) clearInterval(countdownInterval);
        if (statusPollInterval) clearInterval(statusPollInterval);

        const timerElement = document.getElementById("timer") || document.getElementById("remainingTime");
        if (timerElement) timerElement.innerText = "Expired";

        const statusElement = document.getElementById("status");
        if (statusElement) statusElement.innerText = "Expired";
    }

    // Start execution by polling payment status
    startStatusPolling();
});

function buyMore() {
    window.location.href = "/payment.html";
}