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

// ==============================
// ADMIN LOGOUT
// ==============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            const response = await fetch("/api/admin/logout", {
                method: "POST"
            });

            const data = await response.json();

            if (data.success) {

                window.location.href = "admin-login.html";

            } else {

                alert(data.message || "Logout failed.");

            }

        } catch (error) {

            console.error("Logout error:", error);

            alert("Unable to logout. Please try again.");

        }

    });

}

loadDashboard();

setInterval(loadDashboard, 10000);