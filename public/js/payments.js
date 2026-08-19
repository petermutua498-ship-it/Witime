// ======================================
// WiTime Payments
// ======================================


// ======================================
// DOM ELEMENTS
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


const viewFullPayments =
    document.getElementById("viewFullPayments");


const paymentModal =
    document.getElementById("paymentModal");


const paymentDetails =
    document.getElementById("paymentDetails");


const closeModal =
    document.querySelector(".close");


const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================
// DATA
// ======================================

let allPayments = [];


// ======================================
// LOAD PAYMENTS
// ======================================

async function loadPayments() {

    try {

        paymentsTable.innerHTML = `

            <tr>

                <td colspan="7">

                    Loading payments...

                </td>

            </tr>

        `;


        const response =
            await fetch("/api/payments");


        if (!response.ok) {

            throw new Error(
                "Unable to load payments."
            );

        }


        allPayments =
            await response.json();


        // Update statistics
        // using ALL payments

        updateCards(allPayments);


        // Show only first five
        // payments in this page

        renderPayments(
            allPayments.slice(0, 5)
        );


    } catch (err) {

        console.error(
            "Load payments error:",
            err
        );


        paymentsTable.innerHTML = `

            <tr>

                <td colspan="7">

                    Unable to load payments.

                </td>

            </tr>

        `;

    }

}


// ======================================
// RENDER PAYMENTS
// ======================================

function renderPayments(payments) {

    paymentsTable.innerHTML = "";


    if (payments.length === 0) {

        paymentsTable.innerHTML = `

            <tr>

                <td colspan="7">

                    No payments found.

                </td>

            </tr>

        `;

        return;

    }


    payments.forEach(payment => {

        const status =
            (payment.status || "")
                .toLowerCase();


        paymentsTable.innerHTML += `

            <tr>

                <td>
                    ${payment.phone || "-"}
                </td>


                <td>
                    ${payment.packageName || "-"}
                </td>


                <td>
                    KES ${payment.amount || 0}
                </td>


                <td>

                    <span
                        class="payment-status ${status}">

                        ${payment.status || "-"}

                    </span>

                </td>


                <td>
                    ${payment.transactionId || "-"}
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


                <td>

                    <button
                        class="view-btn"
                        onclick="viewPayment('${payment._id}')">

                        View

                    </button>


                    <button
                        class="delete-btn"
                        onclick="deletePayment('${payment._id}')">

                        Delete

                    </button>

                </td>

            </tr>

        `;

    });

}

// ======================================
// UPDATE PAYMENT SUMMARY CARDS
// ======================================

function updateCards(payments) {

    let successfulAmount = 0;
    let pendingAmount = 0;
    let failedAmount = 0;

    payments.forEach(payment => {

        const amount =
            Number(payment.amount) || 0;

        const status =
            String(payment.status || "")
                .toLowerCase();

        if (status === "success") {

            successfulAmount += amount;

        }

        else if (status === "pending") {

            pendingAmount += amount;

        }

        else if (status === "failed") {

            failedAmount += amount;

        }

    });


    // Total revenue means
    // successful money only

    const totalRevenueAmount =
        successfulAmount;


    totalRevenue.innerText =
        `KES ${totalRevenueAmount.toLocaleString()}`;


    successPayments.innerText =
        `KES ${successfulAmount.toLocaleString()}`;


    pendingPayments.innerText =
        `KES ${pendingAmount.toLocaleString()}`;


    failedPayments.innerText =
        `KES ${failedAmount.toLocaleString()}`;

}


// ======================================
// SEARCH + FILTER
// ======================================

function applyFilters() {

    const keyword =
        searchPayment.value
            .toLowerCase()
            .trim();


    const status =
        statusFilter.value;


    const filtered =
        allPayments.filter(payment => {

            const phone =
                (payment.phone || "")
                    .toLowerCase();


            const packageName =
                (payment.packageName || "")
                    .toLowerCase();


            const transactionId =
                (payment.transactionId || "")
                    .toLowerCase();


            const searchMatch =

                phone.includes(keyword)

                ||

                packageName.includes(keyword)

                ||

                transactionId.includes(keyword);


            const statusMatch =

                status === "all"

                ||

                (payment.status || "")
                    .toLowerCase()
                    === status;


            return (
                searchMatch &&
                statusMatch
            );

        });


    // Statistics use all
    // matching records

    updateCards(filtered);


    // Table only shows
    // first five matches

    renderPayments(
        filtered.slice(0, 5)
    );

}


// ======================================
// SEARCH EVENT
// ======================================

searchPayment.addEventListener(
    "input",
    applyFilters
);


// ======================================
// STATUS FILTER
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
    loadPayments
);


// ======================================
// VIEW FULL PAYMENTS
// ======================================

viewFullPayments.addEventListener(
    "click",
    () => {

        window.location.href =
            "/admin/full-payments.html";

    }
);


// ======================================
// VIEW PAYMENT
// ======================================

async function viewPayment(id) {

    try {

        const response =
            await fetch(
                `/api/payments/${id}`
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

                <strong>
                    Phone:
                </strong>

                <span>
                    ${payment.phone || "-"}
                </span>

            </div>


            <div class="payment-detail-row">

                <strong>
                    Package:
                </strong>

                <span>
                    ${payment.packageName || "-"}
                </span>

            </div>


            <div class="payment-detail-row">

                <strong>
                    Duration:
                </strong>

                <span>
                    ${payment.packageDuration || "-"}
                </span>

            </div>


            <div class="payment-detail-row">

                <strong>
                    Amount:
                </strong>

                <span>
                    KES ${payment.amount || 0}
                </span>

            </div>


            <div class="payment-detail-row">

                <strong>
                    Status:
                </strong>

                <span>
                    ${payment.status || "-"}
                </span>

            </div>


            <div class="payment-detail-row">

                <strong>
                    Transaction ID:
                </strong>

                <span>
                    ${payment.transactionId || "-"}
                </span>

            </div>


            <div class="payment-detail-row">

                <strong>
                    Date:
                </strong>

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


    } catch (err) {

        console.error(
            "View payment error:",
            err
        );


        alert(
            "Unable to load payment details."
        );

    }

}


// ======================================
// DELETE PAYMENT
// ======================================

async function deletePayment(id) {

    const confirmed =
        confirm(
            "Delete this payment permanently?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/payments/${id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (result.success) {

            await loadPayments();

        } else {

            alert(
                result.message ||
                "Unable to delete payment."
            );

        }


    } catch (err) {

        console.error(
            "Delete payment error:",
            err
        );


        alert(
            "Unable to contact the server."
        );

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
            "witime-payments.csv";


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        URL.revokeObjectURL(url);

    }
);


// ======================================
// CLOSE MODAL
// ======================================

closeModal.onclick =
    function () {

        paymentModal.style.display =
            "none";

    };


// ======================================
// CLOSE MODAL OUTSIDE
// ======================================

window.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            paymentModal
        ) {

            paymentModal.style.display =
                "none";

        }

    }
);


// ======================================
// LOGOUT
// ======================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    "/api/admin/logout",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } catch (error) {

                console.error(error);

            }


            window.location.href =
                "/admin/login.html";

        }
    );

}


// ======================================
// AUTO REFRESH
// ======================================

setInterval(
    loadPayments,
    10000
);


// ======================================
// START
// ======================================

loadPayments();