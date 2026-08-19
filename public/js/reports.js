// ======================================
// WiTime Reports
// ======================================

const reportsTable =
    document.getElementById("reportsTable");

const totalRevenue =
    document.getElementById("totalRevenue");

const totalPayments =
    document.getElementById("totalPayments");

const successfulPayments =
    document.getElementById("successfulPayments");

const pendingPayments =
    document.getElementById("pendingPayments");

const failedPayments =
    document.getElementById("failedPayments");

const refreshReports =
    document.getElementById("refreshReports");

const exportReport =
    document.getElementById("exportReport");

const revenueCanvas =
    document.getElementById("revenueChart");

const statusCanvas =
    document.getElementById("statusChart");

const packageCanvas =
    document.getElementById("packageChart");


let payments = [];

let revenueChart = null;
let statusChart = null;
let packageChart = null;


// ======================================
// LOAD PAYMENTS
// ======================================

async function loadReports() {

    try {

        reportsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Loading reports...
                </td>
            </tr>
        `;

        const response =
            await fetch("/api/payments", {
                credentials: "include",
                cache: "no-store"
            });

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }

        const data =
            await response.json();


        if (Array.isArray(data)) {

            payments = data;

        } else if (Array.isArray(data.payments)) {

            payments = data.payments;

        } else {

            throw new Error(
                "Invalid payments response"
            );

        }


        updateSummary();

        renderCharts();

        renderTable();


    } catch (error) {

        console.error(
            "Reports error:",
            error
        );

        reportsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Unable to load reports.
                    <br>
                    <small>${error.message}</small>
                </td>
            </tr>
        `;

    }

}


// ======================================
// SUMMARY
// ======================================

function updateSummary() {

    let revenue = 0;

    let successful = 0;

    let pending = 0;

    let failed = 0;


    payments.forEach(payment => {

        const status =
            String(
                payment.status || ""
            ).toLowerCase();


        /*
         * Revenue is counted from
         * successful payments only.
         */

        if (status === "success") {

            revenue +=
                Number(payment.amount) || 0;

            successful++;

        }

        else if (status === "pending") {

            pending++;

        }

        else if (status === "failed") {

            failed++;

        }

    });


    totalRevenue.textContent =
        `KES ${revenue.toLocaleString()}`;

    totalPayments.textContent =
        payments.length;

    successfulPayments.textContent =
        successful;

    pendingPayments.textContent =
        pending;

    failedPayments.textContent =
        failed;

}


// ======================================
// CHARTS
// ======================================

function renderCharts() {

    renderRevenueChart();

    renderStatusChart();

    renderPackageChart();

}


// ======================================
// REVENUE CHART
// ======================================

function renderRevenueChart() {

    const dailyRevenue = {};


    payments.forEach(payment => {

        const status =
            String(
                payment.status || ""
            ).toLowerCase();


        if (status !== "success") {
            return;
        }


        const date =
            payment.createdAt
                ? new Date(
                    payment.createdAt
                  ).toLocaleDateString()
                : "Unknown";


        if (!dailyRevenue[date]) {

            dailyRevenue[date] = 0;

        }


        dailyRevenue[date] +=
            Number(payment.amount) || 0;

    });


    const labels =
        Object.keys(dailyRevenue);

    const values =
        Object.values(dailyRevenue);


    if (revenueChart) {

        revenueChart.destroy();

    }


    revenueChart =
        new Chart(
            revenueCanvas,
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label: "Revenue (KES)",

                            data: values,

                            borderColor: "#2563eb",

                            backgroundColor:
                                "rgba(37,99,235,.12)",

                            fill: true,

                            tension: 0.35,

                            borderWidth: 3,

                            pointRadius: 4

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: true
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true

                        }

                    }

                }

            }
        );

}


// ======================================
// STATUS CHART
// ======================================

function renderStatusChart() {

    let success = 0;

    let pending = 0;

    let failed = 0;


    payments.forEach(payment => {

        const status =
            String(
                payment.status || ""
            ).toLowerCase();


        if (status === "success") {
            success++;
        }

        else if (status === "pending") {
            pending++;
        }

        else if (status === "failed") {
            failed++;
        }

    });


    if (statusChart) {

        statusChart.destroy();

    }


    statusChart =
        new Chart(
            statusCanvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Successful",
                        "Pending",
                        "Failed"
                    ],

                    datasets: [

                        {

                            data: [
                                success,
                                pending,
                                failed
                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: "bottom"

                        }

                    }

                }

            }
        );

}


// ======================================
// PACKAGE REVENUE CHART
// ======================================

function renderPackageChart() {

    const packageRevenue = {};


    payments.forEach(payment => {

        const status =
            String(
                payment.status || ""
            ).toLowerCase();


        if (status !== "success") {
            return;
        }


        const packageName =
            payment.packageName ||
            "Unknown";


        if (!packageRevenue[packageName]) {

            packageRevenue[packageName] = 0;

        }


        packageRevenue[packageName] +=
            Number(payment.amount) || 0;

    });


    const labels =
        Object.keys(packageRevenue);

    const values =
        Object.values(packageRevenue);


    if (packageChart) {

        packageChart.destroy();

    }


    packageChart =
        new Chart(
            packageCanvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label: "Revenue (KES)",

                            data: values,

                            backgroundColor: "#2563eb",

                            borderRadius: 7

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true

                        }

                    }

                }

            }
        );

}


// ======================================
// REPORT TABLE
// ======================================

function renderTable() {

    reportsTable.innerHTML = "";


    const recent =
        payments.slice(0, 10);


    if (recent.length === 0) {

        reportsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No payment records found.
                </td>
            </tr>
        `;

        return;

    }


    recent.forEach(payment => {

        const status =
            String(
                payment.status || ""
            ).toLowerCase();


        let statusClass =
            "status-" + status;


        reportsTable.innerHTML += `

            <tr>

                <td>
                    ${escapeHtml(
                        payment.phone || "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        payment.packageName || "-"
                    )}
                </td>

                <td>
                    KES ${Number(
                        payment.amount || 0
                    ).toLocaleString()}
                </td>

                <td>

                    <span class="${statusClass}">
                        ${escapeHtml(
                            payment.status || "-"
                        )}
                    </span>

                </td>

                <td>
                    ${escapeHtml(
                        payment.transactionId || "-"
                    )}
                </td>

                <td>
                    ${
                        payment.createdAt
                            ? new Date(
                                payment.createdAt
                              ).toLocaleString()
                            : "-"
                    }
                </td>

            </tr>

        `;

    });

}


// ======================================
// EXPORT CSV
// ======================================

exportReport.addEventListener(
    "click",
    () => {

        let csv =
            "Phone,Package,Amount,Status,Transaction ID,Date\n";


        payments.forEach(payment => {

            csv +=
                `"${payment.phone || ""}",` +
                `"${payment.packageName || ""}",` +
                `"${payment.amount || 0}",` +
                `"${payment.status || ""}",` +
                `"${payment.transactionId || ""}",` +
                `"${payment.createdAt
                    ? new Date(
                        payment.createdAt
                      ).toLocaleString()
                    : ""}"\n`;

        });


        const blob =
            new Blob(
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

        link.download =
            "witime-reports.csv";


        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    }
);


// ======================================
// REFRESH
// ======================================

refreshReports.addEventListener(
    "click",
    async () => {

        refreshReports.disabled = true;

        refreshReports.textContent =
            "Refreshing...";


        await loadReports();


        refreshReports.disabled = false;

        refreshReports.textContent =
            "↻ Refresh";

    }
);


// ======================================
// ESCAPE HTML
// ======================================

function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// ======================================
// START
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    loadReports
);