// ======================================
// WiTime Admin Dashboard
// ======================================


// ======================================
// CHECK ADMIN SESSION
// ======================================

async function checkAdminSession() {

    try {

        const response = await fetch("/api/admin/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        });

        if (!response.ok) {

            console.log("Admin session not found.");

            window.location.replace("/admin/login.html");

            return false;
        }

        const data = await response.json();

        console.log("Admin session:", data);

        if (!data.success || !data.admin) {

            window.location.replace("/admin/login.html");

            return false;
        }

        return true;

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        window.location.replace("/admin/login.html");

        return false;
    }
}


// ======================================
// DASHBOARD ELEMENTS
// ======================================

const onlineUsers =
    document.getElementById("onlineUsers");

const totalPackages =
    document.getElementById("totalPackages");

const paymentsToday =
    document.getElementById("paymentsToday");

const revenueToday =
    document.getElementById("revenueToday");


// ======================================
// LOAD DASHBOARD
// ======================================

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/dashboard/stats",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );

        if (response.status === 401) {

            window.location.replace(
                "/admin/login.html"
            );

            return;
        }

        const data =
            await response.json();

        onlineUsers.textContent =
            data.onlineUsers ?? 0;

        totalPackages.textContent =
            data.totalPackages ?? 0;

        paymentsToday.textContent =
            data.paymentsToday ?? 0;

        revenueToday.textContent =
            "KES " +
            (data.revenueToday ?? 0);

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }
}


// ======================================
// LOGOUT
// ======================================

document.addEventListener(
    "click",
    async function(event) {

        const logoutBtn =
            event.target.closest("#logoutBtn");

        if (!logoutBtn) return;

        if (
            !confirm(
                "Are you sure you want to logout?"
            )
        ) {

            return;
        }

        try {

            const response =
                await fetch(
                    "/api/admin/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {

                alert(
                    result.message ||
                    "Logout failed."
                );

                return;
            }

            // Prevent browser from showing
            // cached dashboard after logout.

            window.location.replace(
                "/admin/login.html"
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Unable to logout. Please try again."
            );

        }

    }
);


// ======================================
// START
// ======================================

async function startDashboard() {

    console.log(
        "Checking administrator session..."
    );

    const authenticated =
        await checkAdminSession();

    if (!authenticated) {

        return;
    }

    console.log(
        "Administrator authenticated."
    );

    await loadDashboard();

    setInterval(
        loadDashboard,
        10000
    );

}

async function startDashboard() {

    console.log("Checking administrator session...");

    const authenticated = await checkAdminSession();

    if (!authenticated) {
        return;
    }

    console.log("Administrator authenticated.");

    await loadDashboard();

    setInterval(loadDashboard, 10000);
}

// ======================================
// START DASHBOARD
// ======================================

startDashboard();