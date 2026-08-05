// ======================================
// WiTime Reports
// Part 1
// ======================================

const reportsTable = document.getElementById("reportsTable");

const totalRevenue = document.getElementById("totalRevenue");
const todayRevenue = document.getElementById("todayRevenue");
const monthRevenue = document.getElementById("monthRevenue");
const totalPayments = document.getElementById("totalPayments");

const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const filterBtn = document.getElementById("filterBtn");
const refreshBtn = document.getElementById("refreshReports");
const exportBtn = document.getElementById("exportCSV");
const printBtn = document.getElementById("printReport");

let allReports = [];

let revenueChart;
let statusChart;

// ===============================
// Load Reports
// ===============================

async function loadReports() {

    try {

        const response = await fetch("/api/reports");

        allReports = await response.json();

        renderReports(allReports);

        loadSummary();

    } catch (err) {

        console.error(err);

        reportsTable.innerHTML = `

        <tr>

            <td colspan="6">

                Unable to load reports.

            </td>

        </tr>

        `;

    }

}

// ===============================
// Load Summary
// ===============================

async function loadSummary() {

    try {

        const response =
            await fetch("/api/reports/summary");

        const data = await response.json();

        totalRevenue.innerText =
            `KES ${data.totalRevenue}`;

        todayRevenue.innerText =
            `KES ${data.todayRevenue}`;

        monthRevenue.innerText =
            `KES ${data.monthRevenue}`;

        totalPayments.innerText =
            data.totalPayments;

    } catch (err) {

        console.error(err);

    }

}

// ===============================
// Render Reports Table
// ===============================

function renderReports(reports) {

    reportsTable.innerHTML = "";

    if (reports.length === 0) {

        reportsTable.innerHTML = `

        <tr>

            <td colspan="6">

                No reports found.

            </td>

        </tr>

        `;

        return;

    }

    reports.forEach(report => {

        reportsTable.innerHTML += `

        <tr>

            <td>${report.phone}</td>

            <td>${report.packageName}</td>

            <td>KES ${report.amount}</td>

            <td>${report.status}</td>

            <td>${report.transactionId || "-"}</td>

            <td>

                ${new Date(report.createdAt)
                    .toLocaleString()}

            </td>

        </tr>

        `;

    });

}

// ===============================
// Date Filter
// ===============================

function filterReports() {

    let filtered = [...allReports];

    if (startDate.value) {

        const start = new Date(startDate.value);

        filtered = filtered.filter(report =>

            new Date(report.createdAt) >= start

        );

    }

    if (endDate.value) {

        const end = new Date(endDate.value);

        end.setHours(23,59,59,999);

        filtered = filtered.filter(report =>

            new Date(report.createdAt) <= end

        );

    }

    renderReports(filtered);

    updateCharts(filtered);

}

filterBtn.addEventListener("click", filterReports);

refreshBtn.addEventListener("click", loadReports);

// ======================================
// WiTime Reports
// Part 2
// ======================================

// ===============================
// Revenue Chart
// ===============================

function drawRevenueChart(reports) {

    const revenueByDay = {};

    reports.forEach(report => {

        if (report.status !== "success") return;

        const date = new Date(report.createdAt)
            .toLocaleDateString();

        revenueByDay[date] =
            (revenueByDay[date] || 0) + report.amount;

    });

    const labels = Object.keys(revenueByDay);
    const values = Object.values(revenueByDay);

    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(
        document.getElementById("revenueChart"),
        {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Revenue (KES)",
                    data: values
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }
    );

}

// ===============================
// Status Chart
// ===============================

function drawStatusChart(reports) {

    let success = 0;
    let pending = 0;
    let failed = 0;

    reports.forEach(report => {

        switch (report.status) {

            case "success":
                success++;
                break;

            case "pending":
                pending++;
                break;

            case "failed":
                failed++;
                break;

        }

    });

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(
        document.getElementById("statusChart"),
        {
            type: "pie",
            data: {
                labels: [
                    "Success",
                    "Pending",
                    "Failed"
                ],
                datasets: [{
                    data: [
                        success,
                        pending,
                        failed
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }
    );

}

// ===============================
// Update Charts
// ===============================

function updateCharts(reports) {

    drawRevenueChart(reports);

    drawStatusChart(reports);

}

// ===============================
// Export CSV
// ===============================

exportBtn.addEventListener("click", () => {

    let csv =
        "Phone,Package,Amount,Status,Receipt,Date\n";

    allReports.forEach(report => {

        csv += `"${report.phone}","${report.packageName}","${report.amount}","${report.status}","${report.transactionId || ""}","${new Date(report.createdAt).toLocaleString()}"\n`;

    });

    const blob = new Blob([csv], {

        type: "text/csv"

    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "reports.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

});

// ===============================
// Print Report
// ===============================

printBtn.addEventListener("click", () => {

    window.print();

});

// ===============================
// Auto Refresh
// ===============================

setInterval(loadReports, 10000);

// ===============================
// Start
// ===============================

loadReports();

setTimeout(() => {

    updateCharts(allReports);

}, 500);