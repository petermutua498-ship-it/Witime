const onlineUsers = document.getElementById("onlineUsers");
const totalPackages = document.getElementById("totalPackages");
const paymentsToday = document.getElementById("paymentsToday");
const revenueToday = document.getElementById("revenueToday");

// ======================================
// CHECK ADMIN LOGIN
// ======================================

async function checkAdmin() {

    try {

        const response = await fetch("/api/admin/me", {
            credentials: "include"
        });

        if (!response.ok) {

            window.location.replace("/admin/login.html");

            return false;
        }

        const data = await response.json();

        if (!data.success || !data.admin) {

            window.location.replace("/admin/login.html");

            return false;
        }

        return true;

    } catch (error) {

        console.error("Authentication check failed:", error);

        window.location.replace("/admin/login.html");

        return false;
    }
}


// ======================================
// LOAD DASHBOARD
// ======================================

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard/stats", {
            credentials: "include"
        });

        if (response.status === 401) {

            window.location.replace("/admin/login.html");

            return;
        }

        const data = await response.json();

        onlineUsers.textContent =
            data.onlineUsers ?? 0;

        totalPackages.textContent =
            data.totalPackages ?? 0;

        paymentsToday.textContent =
            data.paymentsToday ?? 0;

        revenueToday.textContent =
            "KES " + (data.revenueToday ?? 0);

    } catch (err) {

        console.error("Dashboard error:", err);

    }

}


// ======================================
// ADMIN LOGOUT
// ======================================

document.addEventListener("click", async function (event) {

    const logoutBtn =
        event.target.closest("#logoutBtn");

    if (!logoutBtn) return;

    if (!confirm("Are you sure you want to logout?")) {
        return;
    }

    try {

        const response = await fetch(
            "/api/admin/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            alert(
                result.message ||
                "Logout failed."
            );

            return;
        }

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

});


// ======================================
// START DASHBOARD
// ======================================

async function startDashboard() {

    const authenticated =
        await checkAdmin();

    if (!authenticated) {
        return;
    }

    await loadDashboard();

    setInterval(loadDashboard, 10000);
}

startDashboard();