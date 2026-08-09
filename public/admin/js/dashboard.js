const onlineUsers = document.getElementById("onlineUsers");
const totalPackages = document.getElementById("totalPackages");
const paymentsToday = document.getElementById("paymentsToday");
const revenueToday = document.getElementById("revenueToday");

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard/stats");

        const data = await response.json();

        onlineUsers.textContent = data.onlineUsers;

        totalPackages.textContent = data.totalPackages;

        paymentsToday.textContent = data.paymentsToday;

        revenueToday.textContent = "KES " + data.revenueToday;

    } catch (err) {

        console.log(err);

    }

}
// ======================================
// ADMIN LOGOUT
// ======================================

document.addEventListener("click", async function (event) {

    const logoutBtn = event.target.closest("#logoutBtn");

    if (!logoutBtn) return;

    if (!confirm("Are you sure you want to logout?")) {
        return;
    }

    try {

        const response = await fetch("/api/admin/logout", {
            method: "POST",
            credentials: "include"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {

            alert(result.message || "Logout failed.");

            return;
        }

        // Go back to login
        window.location.replace("/admin/login.html");

    } catch (error) {

        console.error("Logout error:", error);

        alert("Unable to logout. Please try again.");

    }

});


loadDashboard();

setInterval(loadDashboard, 10000);