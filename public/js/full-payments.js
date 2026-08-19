// ======================================
// WiTime - All Payments
// ======================================

const paymentsTable =
    document.getElementById("paymentsTable");

const totalRevenue =
    document.getElementById("totalRevenue");

const totalPayments =
    document.getElementById("totalPayments");

const successPayments =
    document.getElementById("successPayments");

const pendingPayments =
    document.getElementById("pendingPayments");

const failedPayments =
    document.getElementById("failedPayments");

const searchPayment =
    document.getElementById("searchPayment");

const statusFilter =
    document.getElementById("statusFilter");

const refreshBtn =
    document.getElementById("refreshPayments");

const exportBtn =
    document.getElementById("exportCSV");

const paymentModal =
    document.getElementById("paymentModal");

const paymentDetails =
    document.getElementById("paymentDetails");

const closeModal =
    document.querySelector(".close");


let allPayments = [];


// ======================================
// LOAD PAYMENTS
// ======================================

async function loadPayments() {

    try {

        paymentsTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    Loading payments...
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

            allPayments = data;

        } else if (Array.isArray(data.payments)) {

            allPayments = data.payments;

        } else {

            throw new Error(
                "Invalid payments response"
            );

        }

        updateCards(allPayments);

        applyFilters();

    } catch (error) {

        console.error(
            "Load payments error:",
            error
        );

        paymentsTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    Unable to load payments.
                    <br>
                    <small>${escapeHtml(error.message)}</small>
                </td>
            </tr>
        `;

    }

}


// ======================================
// SUMMARY CARDS
// ======================================

function updateCards(payments) {

    let revenue = 0;
    let success = 0;
    let pending = 0;
    let failed = 0;

    payments.forEach(payment => {

        const amount =
            Number(payment.amount) || 0;

        const status =
            String(payment.status || "")
                .toLowerCase();

        if (status === "success") {

            revenue += amount;
            success += amount;

        } else if (status === "pending") {

            pending += amount;

        } else if (status === "failed") {

            failed += amount;

        }

    });

    totalRevenue.innerText =
        `KES ${revenue.toLocaleString()}`;

    totalPayments.innerText =
        payments.length;

    successPayments.innerText =
        `KES ${success.toLocaleString()}`;

    pendingPayments.innerText =
        `KES ${pending.toLocaleString()}`;

    failedPayments.innerText =
        `KES ${failed.toLocaleString()}`;

}


// ======================================
// FILTERS
// ======================================

function applyFilters() {

    const keyword =
        searchPayment.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        statusFilter.value;

    const filtered =
        allPayments.filter(payment => {

            const phone =
                String(payment.phone || "")
                    .toLowerCase();

            const packageName =
                String(payment.packageName || "")
                    .toLowerCase();

            const transactionId =
                String(payment.transactionId || "")
                    .toLowerCase();

            const status =
                String(payment.status || "")
                    .toLowerCase();

            const matchesSearch =
                phone.includes(keyword) ||
                packageName.includes(keyword) ||
                transactionId.includes(keyword);

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return (
                matchesSearch &&
                matchesStatus
            );

        });

    renderPayments(filtered);

}


// ======================================
// RENDER
// ======================================

function renderPayments(payments) {

    paymentsTable.innerHTML = "";

    if (!payments.length) {

        paymentsTable.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    No payments found.
                </td>
            </tr>
        `;

        return;

    }

    payments.forEach((payment, index) => {

        const status =
            String(payment.status || "")
                .toLowerCase();

        const date =
            payment.createdAt
                ? new Date(
                    payment.createdAt
                  ).toLocaleString()
                : "-";

        paymentsTable.innerHTML += `

            <tr>

                <td>
                    ${index + 1}
                </td>

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
                    KES ${
                        Number(payment.amount || 0)
                            .toLocaleString()
                    }
                </td>

                <td>
                    <span class="payment-status ${status}">
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
                    ${date}
                </td>

                <td>

                    <button
                        class="view-btn"
                        data-id="${payment._id}">
                        View
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${payment._id}">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    });

}


// ======================================
// SEARCH
// ======================================

searchPayment.addEventListener(
    "input",
    applyFilters
);


// ======================================
// STATUS
// ======================================

statusFilter.addEventListener(
    "change",
    applyFilters
);


// ======================================
// REFRESH
// ======================================

refreshBtn.addEventListener(
    "click",
    async () => {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "Refreshing...";

        await loadPayments();

        refreshBtn.disabled = false;

        refreshBtn.textContent =
            "↻ Refresh";

    }
);


// ======================================
// TABLE BUTTONS
// ======================================

paymentsTable.addEventListener(
    "click",
    event => {

        const viewButton =
            event.target.closest(".view-btn");

        const deleteButton =
            event.target.closest(".delete-btn");


        if (viewButton) {

            viewPayment(
                viewButton.dataset.id
            );

            return;

        }


        if (deleteButton) {

            deletePayment(
                deleteButton.dataset.id
            );

        }

    }
);


// ======================================
// VIEW PAYMENT
// ======================================

async function viewPayment(id) {

    try {

        const response =
            await fetch(
                `/api/payments/${id}`,
                {
                    credentials: "include"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Payment not found."
            );

        }

        const payment =
            await response.json();

        paymentDetails.innerHTML = `

            <div class="payment-detail-row">
                <strong>Phone</strong>
                <span>
                    ${escapeHtml(payment.phone || "-")}
                </span>
            </div>

            <div class="payment-detail-row">
                <strong>Package</strong>
                <span>
                    ${escapeHtml(payment.packageName || "-")}
                </span>
            </div>

            <div class="payment-detail-row">
                <strong>Duration</strong>
                <span>
                    ${escapeHtml(payment.packageDuration || "-")}
                </span>
            </div>

            <div class="payment-detail-row">
                <strong>Amount</strong>
                <span>
                    KES ${Number(
                        payment.amount || 0
                    ).toLocaleString()}
                </span>
            </div>

            <div class="payment-detail-row">
                <strong>Status</strong>
                <span>
                    ${escapeHtml(payment.status || "-")}
                </span>
            </div>

            <div class="payment-detail-row">
                <strong>Transaction ID</strong>
                <span>
                    ${escapeHtml(
                        payment.transactionId || "-"
                    )}
                </span>
            </div>

            <div class="payment-detail-row">
                <strong>Date</strong>
                <span>
                    ${
                        payment.createdAt
                            ? new Date(
                                payment.createdAt
                              ).toLocaleString()
                            : "-"
                    }
                </span>
            </div>

        `;

        paymentModal.style.display =
            "flex";

    } catch (error) {

        console.error(error);

        alert(
            "Unable to load payment details."
        );

    }

}


// ======================================
// DELETE
// ======================================

async function deletePayment(id) {

    if (!id) return;

    const confirmed =
        confirm(
            "Delete this payment permanently?"
        );

    if (!confirmed) return;

    try {

        const response =
            await fetch(
                `/api/payments/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Unable to delete payment."
            );

        }

        await loadPayments();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// ======================================
// EXPORT CSV
// ======================================

exportBtn.addEventListener(
    "click",
    () => {

        let csv =
            "Phone,Package,Amount,Status,Transaction ID,Date\n";

        allPayments.forEach(payment => {

            csv +=
                `"${csvEscape(payment.phone)}",` +
                `"${csvEscape(payment.packageName)}",` +
                `"${payment.amount || 0}",` +
                `"${csvEscape(payment.status)}",` +
                `"${csvEscape(payment.transactionId)}",` +
                `"${payment.createdAt
                    ? new Date(
                        payment.createdAt
                      ).toLocaleString()
                    : ""}"\n`;

        });

        const blob =
            new Blob(
                [csv],
                { type: "text/csv;charset=utf-8;" }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "witime-all-payments.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }
);


// ======================================
// CLOSE MODAL
// ======================================

closeModal.addEventListener(
    "click",
    () => {

        paymentModal.style.display =
            "none";

    }
);


window.addEventListener(
    "click",
    event => {

        if (
            event.target === paymentModal
        ) {

            paymentModal.style.display =
                "none";

        }

    }
);


// ======================================
// ESCAPE HTML
// ======================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function csvEscape(value) {

    return String(value ?? "")
        .replaceAll('"', '""');

}


// ======================================
// AUTO REFRESH
// ======================================

setInterval(
    loadPayments,
    30000
);


// ======================================
// START
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    loadPayments
);