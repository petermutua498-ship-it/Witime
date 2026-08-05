// ======================================
// WiTime Payments
// Part 1
// ======================================

const paymentsTable = document.getElementById("paymentsTable");

const totalRevenue = document.getElementById("totalRevenue");
const totalPayments = document.getElementById("totalPayments");
const successPayments = document.getElementById("successPayments");
const pendingPayments = document.getElementById("pendingPayments");
const failedPayments = document.getElementById("failedPayments");

const searchPayment = document.getElementById("searchPayment");
const statusFilter = document.getElementById("statusFilter");

const refreshBtn = document.getElementById("refreshPayments");
const exportBtn = document.getElementById("exportCSV");

const paymentModal = document.getElementById("paymentModal");
const paymentDetails = document.getElementById("paymentDetails");
const closeModal = document.querySelector(".close");

let allPayments = [];

// ===============================
// Load Payments
// ===============================

async function loadPayments() {

    try {

        const response = await fetch("/api/payments");

        allPayments = await response.json();

        renderPayments(allPayments);

    } catch (err) {

        console.error(err);

        paymentsTable.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load payments.
                </td>
            </tr>
        `;

    }

}

// ===============================
// Render Payments
// ===============================

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

        updateCards([]);

        return;

    }

    payments.forEach(payment => {

        paymentsTable.innerHTML += `

        <tr>

            <td>${payment.phone}</td>

            <td>${payment.packageName}</td>

            <td>KES ${payment.amount}</td>

            <td>${payment.status}</td>

            <td>${payment.transactionId || "-"}</td>

            <td>${new Date(payment.createdAt).toLocaleString()}</td>

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

    updateCards(payments);

}

// ===============================
// Dashboard Cards
// ===============================

function updateCards(payments) {

    let revenue = 0;

    let success = 0;

    let pending = 0;

    let failed = 0;

    payments.forEach(payment => {

        revenue += payment.amount || 0;

        switch (payment.status) {

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

    totalRevenue.innerText = `KES ${revenue}`;

    totalPayments.innerText = payments.length;

    successPayments.innerText = success;

    pendingPayments.innerText = pending;

    failedPayments.innerText = failed;

}

// ===============================
// Search + Filter
// ===============================

function applyFilters() {

    const keyword = searchPayment.value.toLowerCase();

    const status = statusFilter.value;

    const filtered = allPayments.filter(payment => {

        const searchMatch =

            payment.phone.toLowerCase().includes(keyword)

            ||

            payment.packageName.toLowerCase().includes(keyword)

            ||

            (payment.transactionId || "")
            .toLowerCase()
            .includes(keyword);

        const statusMatch =

            status === "all"

            ||

            payment.status === status;

        return searchMatch && statusMatch;

    });

    renderPayments(filtered);

}

searchPayment.addEventListener("keyup", applyFilters);

statusFilter.addEventListener("change", applyFilters);

refreshBtn.addEventListener("click", loadPayments);

// ======================================
// WiTime Payments
// Part 2
// ======================================

// ===============================
// View Payment
// ===============================

async function viewPayment(id) {

    try {

        const response = await fetch(`/api/payments/${id}`);

        const payment = await response.json();

        paymentDetails.innerHTML = `

            <p><strong>Phone:</strong> ${payment.phone}</p>

            <p><strong>Package:</strong> ${payment.packageName}</p>

            <p><strong>Duration:</strong> ${payment.packageDuration || "-"}</p>

            <p><strong>Amount:</strong> KES ${payment.amount}</p>

            <p><strong>Status:</strong> ${payment.status}</p>

            <p><strong>Transaction ID:</strong> ${payment.transactionId || "-"}</p>

            <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>

        `;

        paymentModal.style.display = "block";

    } catch (err) {

        console.error(err);

        alert("Unable to load payment details.");

    }

}

// ===============================
// Delete Payment
// ===============================

async function deletePayment(id) {

    const confirmed = confirm("Delete this payment permanently?");

    if (!confirmed) return;

    try {

        const response = await fetch(`/api/payments/${id}`, {

            method: "DELETE"

        });

        const result = await response.json();

        if (result.success) {

            loadPayments();

        } else {

            alert(result.message || "Unable to delete payment.");

        }

    } catch (err) {

        console.error(err);

        alert("Unable to contact the server.");

    }

}

// ===============================
// Export CSV
// ===============================

exportBtn.addEventListener("click", () => {

    let csv =
        "Phone,Package,Amount,Status,Transaction ID,Date\n";

    allPayments.forEach(payment => {

        csv += `"${payment.phone}","${payment.packageName}","${payment.amount}","${payment.status}","${payment.transactionId || ""}","${new Date(payment.createdAt).toLocaleString()}"\n`;

    });

    const blob = new Blob([csv], {

        type: "text/csv"

    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "payments.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

});

// ===============================
// Close Modal
// ===============================

closeModal.onclick = function () {

    paymentModal.style.display = "none";

};

window.onclick = function (e) {

    if (e.target === paymentModal) {

        paymentModal.style.display = "none";

    }

};

// ===============================
// Auto Refresh
// ===============================

setInterval(loadPayments, 10000);

// ===============================
// Start
// ===============================

loadPayments();