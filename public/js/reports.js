const todayRevenue = document.getElementById("todayRevenue");
const monthRevenue = document.getElementById("monthRevenue");
const totalRevenue = document.getElementById("totalRevenue");

const reportTable = document.getElementById("reportTable");

const exportBtn = document.getElementById("exportBtn");

let reportData = [];

// Load reports
async function loadReports() {

    try {

        const response = await fetch("/api/reports");

        const data = await response.json();

        reportData = data;

        updateCards(data);

        displayReport(data);

    } catch (err) {

        console.error(err);

    }

}

// Update summary cards
function updateCards(data) {

    let today = 0;
    let month = 0;
    let total = 0;

    const currentDate = new Date();

    data.forEach(item => {

        total += item.revenue;

        const reportDate = new Date(item.date);

        if (
            reportDate.toDateString() === currentDate.toDateString()
        ) {
            today += item.revenue;
        }

        if (
            reportDate.getMonth() === currentDate.getMonth() &&
            reportDate.getFullYear() === currentDate.getFullYear()
        ) {
            month += item.revenue;
        }

    });

    todayRevenue.textContent = "KES " + today.toLocaleString();

    monthRevenue.textContent = "KES " + month.toLocaleString();

    totalRevenue.textContent = "KES " + total.toLocaleString();

}

// Display report table
function displayReport(data) {

    reportTable.innerHTML = "";

    if (data.length === 0) {

        reportTable.innerHTML = `
        <tr>
            <td colspan="3" style="text-align:center;">
                No report available.
            </td>
        </tr>
        `;

        return;

    }

    data.forEach(item => {

        reportTable.innerHTML += `

        <tr>

            <td>${item.packageName}</td>

            <td>${item.sales}</td>

            <td>KES ${item.revenue.toLocaleString()}</td>

        </tr>

        `;

    });

}

// Export CSV
exportBtn.addEventListener("click", () => {

    let csv = "Package,Sales,Revenue\n";

    reportData.forEach(item => {

        csv += `${item.packageName},${item.sales},${item.revenue}\n`;

    });

    const blob = new Blob([csv], {

        type: "text/csv"

    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "WiTime_Report.csv";

    a.click();

    URL.revokeObjectURL(url);

});

loadReports();