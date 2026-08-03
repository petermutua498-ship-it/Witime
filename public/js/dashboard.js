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

loadDashboard();

setInterval(loadDashboard, 10000);