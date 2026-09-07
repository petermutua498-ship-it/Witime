document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone");
    const routerIp = params.get("routerIp") || "192.168.88.1";

    if (!phone) {
        alert("Invalid session. Phone number missing.");
        window.location.href = "/";
        return;
    }

    // Update basic UI labels
    const phoneElement = document.getElementById("phone");
    if (phoneElement) phoneElement.innerText = phone;

    const packageElement = document.getElementById("package");
    if (packageElement) {
        packageElement.innerText = localStorage.getItem("packageName") || "Wi-Fi Package";
    }

    let countdownInterval = null;
    let statusPollInterval = null;
    let hasLoggedIntoMikrotik = false;

    // 1. Polling loop to check payment & status until active
    function startStatusPolling() {
        fetchConnectionStatus(); // Run immediately
        statusPollInterval = setInterval(fetchConnectionStatus, 2000); // Poll every 2 seconds
    }

    async function fetchConnectionStatus() {
        try {
            const response = await fetch(`/api/connected/${encodeURIComponent(phone)}`, {
                cache: "no-store"
            });

            if (!response.ok) return;

            const data = await response.json();

            // Set timestamps on UI
            const connectedAt = document.getElementById("connectedAt");
            if (connectedAt && data.loginTime) {
                connectedAt.innerText = new Date(data.loginTime).toLocaleString();
            }

            const expiresAt = document.getElementById("expiresAt");
            if (expiresAt && data.expiryTime) {
                expiresAt.innerText = new Date(data.expiryTime).toLocaleString();
            }

            // Check if backend confirmed payment / user creation
            if (["Paid", "Online", "Active", "Offline", "success"].includes(data.status)) {
                // Stop polling once active payment is confirmed
                if (statusPollInterval) clearInterval(statusPollInterval);

                const statusElement = document.getElementById("status");
                if (statusElement) statusElement.innerText = "Connected";

                // Start timer immediately using DB expiry date
                if (data.expiryTime && !countdownInterval) {
                    startTimerFromExpiry(new Date(data.expiryTime));
                }

                // Authenticate with MikroTik once
                if (!hasLoggedIntoMikrotik) {
                    hasLoggedIntoMikrotik = true;
                    submitMikrotikCredentials();
                }

            } else if (data.status === "Expired") {
                if (statusPollInterval) clearInterval(statusPollInterval);
                renderExpiredState();
            }

        } catch (error) {
            console.error("Status check error:", error);
        }
    }

    // 2. Submit credentials to local MikroTik Hotspot via hidden iframe
    function submitMikrotikCredentials() {
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
    }

    // 3. Robust Countdown Engine
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

        tick(); // Run first tick immediately
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

    // Kick off status check loop
    startStatusPolling();
});

function buyMore() {
    window.location.href = "/payment.html";
}