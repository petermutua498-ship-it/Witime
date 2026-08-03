const table = document.getElementById("paymentsTable");

const totalPayments = document.getElementById("totalPayments");
const todayRevenue = document.getElementById("todayRevenue");
const pendingPayments = document.getElementById("pendingPayments");

const searchBox = document.getElementById("searchBox");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

let allPayments = [];

async function loadPayments() {

    try {

        const response = await fetch("/api/payments");

        const payments = await response.json();

        allPayments = payments;

        displayPayments(payments);

        updateCards(payments);

    } catch (err) {

        console.error(err);

    }

}

function displayPayments(payments) {

    table.innerHTML = "";

    if (payments.length === 0) {

        table.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;">
                No payments found.
            </td>
        </tr>
        `;

        return;
    }

    payments.forEach(payment => {

        table.innerHTML += `

        <tr>

            <td>${payment.phone}</td>

            <td>${payment.packageName}</td>

            <td>KES ${payment.amount}</td>

            <td>${payment.status}</td>

            <td>${payment.mpesaReceiptNumber || "-"}</td>

            <td>${new Date(payment.createdAt).toLocaleString()}</td>

            <td>

                <button class="viewBtn">

                    View

                </button>

            </td>

        </tr>

        `;

    });

}

function updateCards(payments) {

    totalPayments.textContent = payments.length;

    let revenue = 0;

    let pending = 0;

    payments.forEach(payment => {

        if (payment.status === "Success") {

            revenue += payment.amount;

        }

        if (payment.status === "Pending") {

            pending++;

        }

    });

    todayRevenue.textContent = "KES " + revenue;

    pendingPayments.textContent = pending;

}

searchBox.addEventListener("input", filterPayments);

statusFilter.addEventListener("change", filterPayments);

function filterPayments() {

    const search = searchBox.value.toLowerCase();

    const status = statusFilter.value;

    const filtered = allPayments.filter(payment => {

        const phoneMatch =
            payment.phone.toLowerCase().includes(search);

        const receiptMatch =
            (payment.mpesaReceiptNumber || "")
            .toLowerCase()
            .includes(search);

        const statusMatch =
            status === "" || payment.status === status;

        return (phoneMatch || receiptMatch) && statusMatch;

    });

    displayPayments(filtered);

}

refreshBtn.addEventListener("click", loadPayments);

loadPayments();

setInterval(loadPayments,10000);