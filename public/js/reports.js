// ======================================
// WiTime Reports
// ======================================

const reportsTable = document.getElementById("reportsTable");

const successPayments = document.getElementById("successPayments");
const pendingPayments = document.getElementById("pendingPayments");
const failedPayments = document.getElementById("failedPayments");
const totalPayments = document.getElementById("totalPayments");

const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const filterBtn = document.getElementById("filterBtn");
const refreshBtn = document.getElementById("refreshReports");
const exportBtn = document.getElementById("exportCSV");
const printBtn = document.getElementById("printReport");
const viewFullReportBtn = document.getElementById("viewFullReport");

let allReports = [];

let revenueChart = null;
let statusChart = null;


// ======================================
// LOAD REPORTS
// ======================================

async function loadReports() {

    try {

        reportsTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Loading reports...
                </td>
            </tr>
        `;

        const response = await fetch("/api/reports");

        if (!response.ok) {
            throw new Error("Unable to load reports.");
        }

        allReports = await response.json();

        renderReports(allReports);

        updateSummary(allReports);

        updateCharts(allReports);

    } catch (err) {

        console.error("Reports error:", err);

        reportsTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load reports.
                </td>
            </tr>
        `;

    }

}


// ======================================
// UPDATE PAYMENT STATUS SUMMARY
// ======================================

function updateSummary(reports) {

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

    successPayments.textContent = success;
    pendingPayments.textContent = pending;
    failedPayments.textContent = failed;
    totalPayments.textContent = reports.length;

}


// ======================================
// RENDER ONLY FIRST 5 PAYMENTS
// ======================================

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


    // Only show the first five
    const recentReports = reports.slice(0, 5);


    recentReports.forEach(report => {

        reportsTable.innerHTML += `

            <tr>

                <td>
                    ${report.phone}
                </td>

                <td>
                    ${report.packageName}
                </td>

                <td>
                    KES ${report.amount}
                </td>

                <td>
                    <span class="status ${report.status}">
                        ${report.status}
                    </span>
                </td>

                <td>
                    ${report.transactionId || "-"}
                </td>

                <td>
                    ${new Date(report.createdAt)
                        .toLocaleString()}
                </td>

            </tr>

        `;

    });

}


// ======================================
// DATE FILTER
// ======================================

function filterReports() {

    let filtered = [...allReports];


    if (startDate.value) {

        const start = new Date(startDate.value);

        start.setHours(0, 0, 0, 0);

        filtered = filtered.filter(report => {

            return new Date(report.createdAt) >= start;

        });

    }


    if (endDate.value) {

        const end = new Date(endDate.value);

        end.setHours(23, 59, 59, 999);

        filtered = filtered.filter(report => {

            return new Date(report.createdAt) <= end;

        });

    }


    renderReports(filtered);

    updateSummary(filtered);

    updateCharts(filtered);

}


filterBtn.addEventListener("click", filterReports);


// ======================================
// REFRESH
// ======================================

refreshBtn.addEventListener("click", () => {

    loadReports();

});


// ======================================
// REVENUE CHART
// ======================================

function drawRevenueChart(reports) {

    const revenueByDay = {};


    reports.forEach(report => {

        if (report.status !== "success") {
            return;
        }


        const date = new Date(report.createdAt)
            .toLocaleDateString();


        revenueByDay[date] =
            (revenueByDay[date] || 0)
            + Number(report.amount || 0);

    });


    const labels = Object.keys(revenueByDay);

    const values = Object.values(revenueByDay);


    if (revenueChart) {

        revenueChart.destroy();

    }


    revenueChart = new Chart(

        document.getElementById("revenueChart"),

        {

            type: "bar",

            data: {

                labels: labels,

                datasets: [{

                    label: "Revenue (KES)",

                    data: values

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: true

                    }

                }

            }

        }

    );

}


// ======================================
// PAYMENT STATUS CHART
// ======================================

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


    if (statusChart) {

        statusChart.destroy();

    }


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


// ======================================
// UPDATE CHARTS
// ======================================

function updateCharts(reports) {

    drawRevenueChart(reports);

    drawStatusChart(reports);

}


// ======================================
// VIEW FULL REPORT
// ======================================

viewFullReportBtn.addEventListener("click", () => {

    window.location.href =
        "/admin/full-report.html";

});


// ======================================
// EXPORT CSV
// ======================================

exportBtn.addEventListener("click", () => {

    let csv =
        "Phone,Package,Amount,Status,Receipt,Date\n";


    allReports.forEach(report => {

        csv +=
            `"${report.phone}",` +
            `"${report.packageName}",` +
            `"${report.amount}",` +
            `"${report.status}",` +
            `"${report.transactionId || ""}",` +
            `"${new Date(report.createdAt)
                .toLocaleString()}"\n`;

    });


    const blob = new Blob(

        [csv],

        {
            type: "text/csv"
        }

    );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download = "reports.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);

});


// ======================================
// PRINT
// ======================================

printBtn.addEventListener("click", () => {

    window.print();

});


// ======================================
// AUTO REFRESH
// ======================================

setInterval(loadReports, 10000);


// ======================================
// START
// ======================================

loadReports();