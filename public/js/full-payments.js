// ======================================
// WiTime - Full Payments
// ======================================


// ======================================
// DOM
// ======================================

const table =
    document.getElementById(
        "fullPaymentsTable"
    );


const searchPayment =
    document.getElementById(
        "searchPayment"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const backBtn =
    document.getElementById(
        "backBtn"
    );


const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );


const exportBtn =
    document.getElementById(
        "exportBtn"
    );


const printBtn =
    document.getElementById(
        "printBtn"
    );


// ======================================
// DATA
// ======================================

let allPayments = [];


// ======================================
// LOAD
// ======================================

async function loadPayments() {

    try {

        table.innerHTML = `

            <tr>

                <td colspan="7">

                    Loading payments...

                </td>

            </tr>

        `;


        const response =
            await fetch(
                "/api/payments"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load payments."
            );

        }


        allPayments =
            await response.json();


        renderPayments(
            allPayments
        );


    } catch (error) {

        console.error(error);


        table.innerHTML = `

            <tr>

                <td colspan="7">

                    Unable to load payments.

                </td>

            </tr>

        `;

    }

}


// ======================================
// RENDER
// ======================================

function renderPayments(payments) {

    table.innerHTML = "";


    if (payments.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="7">

                    No payments found.

                </td>

            </tr>

        `;

        return;

    }


    payments.forEach(
        (payment, index) => {

            const status =
                (payment.status || "")
                    .toLowerCase();


            table.innerHTML += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


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

                </tr>

            `;

        }
    );

}


// ======================================
// FILTER
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


    renderPayments(
        filtered
    );

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
// BACK
// ======================================

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "/admin/payments.html";

    }
);


// ======================================
// REFRESH
// ======================================

refreshBtn.addEventListener(
    "click",
    loadPayments
);


// ======================================
// EXPORT
// ======================================

exportBtn.addEventListener(
    "click",
    () => {

        let csv =
            "No,Phone,Package,Amount,Status,Receipt,Date\n";


        allPayments.forEach(
            (payment, index) => {

                csv +=
                    `"${index + 1}",` +
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

            }
        );


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
            "witime-full-payments.csv";


        document.body.appendChild(link);


        link.click();


        document.body.removeChild(link);


        URL.revokeObjectURL(url);

    }
);


// ======================================
// PRINT
// ======================================

printBtn.addEventListener(
    "click",
    () => {

        window.print();

    }
);


// ======================================
// START
// ======================================

loadPayments();