document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");
    const routerIp = params.get("routerIp") || "192.168.88.1";

    if (!phone) {
        alert("Invalid session. Phone number missing.");
        window.location.href = "/";
        return;
    }

    // Set basic UI elements
    const phoneElement = document.getElementById("phone");
    if (phoneElement) phoneElement.innerText = phone;

    const packageElement = document.getElementById("package");
    if (packageElement) {
        packageElement.innerText = localStorage.getItem("packageName") || "Wi-Fi Package";
    }

    let countdownInterval = null;
    let hasLoggedIntoMikrotik = false;

    // 1. Fetch connection details from server
    async function fetchConnectionStatus() {
        try {
            const response = await fetch(`/api/connected/${encodeURIComponent(phone)}`, {
                cache: "no-store"
            });

            if (!response.ok) {
                console.error("Failed to fetch connection status");
                return;
            }

            const data = await response.json();

            // Set UI times if elements exist
            const connectedAt = document.getElementById("connectedAt");
            if (connectedAt && data.loginTime) {
                connectedAt.innerText = new Date(data.loginTime).toLocaleString();
            }

            const expiresAt = document.getElementById("expiresAt");
            if (expiresAt && data.expiryTime) {
                expiresAt.innerText = new Date(data.expiryTime).toLocaleString();
            }

            // Check if user is active/paid
            if (["Paid", "Online", "Active"].includes(data.status)) {
                if (!hasLoggedIntoMikrotik) {
                    hasLoggedIntoMikrotik = true;
                    submitMikrotikCredentials(data.expiryTime);
                }
            } else if (data.status === "Expired") {
                renderExpiredState();
            }

        } catch (error) {
            console.error("Error loading connection data:", error);
        }
    }

    // 2. Submit credentials to local MikroTik Gateway
    function submitMikrotikCredentials(expiryTime) {
        const statusElement = document.getElementById("status");
        if (statusElement) statusElement.innerText = "Authenticating with Wi-Fi...";

        const linkLogin = params.get("link-login-only") || `http://${routerIp}/login`;

        // Create background iframe
        let iframe = document.getElementById("mikrotik_iframe");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "mikrotik_iframe";
            iframe.name = "mikrotik_iframe";
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }

        // Post credentials
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

        // Verify gateway internet routing before running timer
        verifyNetworkAccess(expiryTime);
    }

    // 3. Ping external health route to verify internet flow
    function verifyNetworkAccess(expiryTime) {
        let attempts = 0;
        const maxAttempts = 15;
        const statusElement = document.getElementById("status");

        const checkInterval = setInterval(async () => {
            attempts++;
            if (statusElement && !countdownInterval) {
                statusElement.innerText = `Connecting (${attempts}s)...`;
            }

            try {
                const res = await fetch("https://witime-o2tz.onrender.com/api/health?cachebust=" + Date.now(), {
                    mode: "cors",
                    cache: "no-store"
                });

                if (res.ok) {
                    clearInterval(checkInterval);
                    if (statusElement) statusElement.innerText = "Online";

                    // Start timer now that internet is confirmed
                    if (expiryTime) {
                        startTimerFromExpiry(new Date(expiryTime));
                    } else {
                        startTimerFromSeconds(3600); // Fallback to 1 hour
                    }
                }
            } catch (err) {
                console.log("Waiting for network route...", err);
            }

            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (statusElement && !countdownInterval) {
                    statusElement.innerText = "Connection active";
                    startTimerFromSeconds(3600);
                }
            }
        }, 1000);
    }

    // 4. Countdown Timer Engine
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

        // Support both "timer" and "remainingTime" ID conventions
        const timerElement = document.getElementById("timer") || document.getElementById("remainingTime");
        if (timerElement) {
            timerElement.innerText = timeString;
        }
    }

    function renderExpiredState() {
        if (countdownInterval) clearInterval(countdownInterval);
        const timerElement = document.getElementById("timer") || document.getElementById("remainingTime");
        if (timerElement) timerElement.innerText = "Expired";

        const statusElement = document.getElementById("status");
        if (statusElement) statusElement.innerText = "Expired";
    }

    // Verify step success
    function verifySetup() {
        const timerTarget = document.getElementById("timer") || document.getElementById("remainingTime");
        if (!timerTarget) {
            console.warn("[WiTime] Warning: Neither #timer nor #remainingTime element was found in HTML.");
        } else {
            console.log("[WiTime] Target timer element localized successfully.");
        }
    }

    verifySetup();
    fetchConnectionStatus();
});

function buyMore() {
    window.location.href = "/payment.html";
}