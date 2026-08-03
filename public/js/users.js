const table = document.getElementById("usersTable");

const onlineUsers = document.getElementById("onlineUsers");
const expiredUsers = document.getElementById("expiredUsers");
const totalUsers = document.getElementById("totalUsers");

const searchUser = document.getElementById("searchUser");
const refreshBtn = document.getElementById("refreshBtn");

let allUsers = [];

// Load users
async function loadUsers() {

    try {

        const response = await fetch("/api/users");

        const users = await response.json();

        allUsers = users;

        displayUsers(users);

        updateCards(users);

    } catch (err) {

        console.error(err);

    }

}

// Display users
function displayUsers(users) {

    table.innerHTML = "";

    if (users.length === 0) {

        table.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;">
                No users connected.
            </td>
        </tr>
        `;

        return;

    }

    users.forEach(user => {

        table.innerHTML += `

        <tr>

            <td>${user.phone}</td>

            <td>${user.packageName}</td>

            <td>${user.remainingTime || "-"}</td>

            <td>

                <span class="${user.status === "Online" ? "online" : "offline"}">

                    ${user.status}

                </span>

            </td>

            <td>

                <button class="extendBtn">

                    Extend

                </button>

                <button class="disconnectBtn">

                    Disconnect

                </button>

            </td>

        </tr>

        `;

    });

}

// Update cards
function updateCards(users) {

    totalUsers.textContent = users.length;

    const online = users.filter(u => u.status === "Online").length;

    const expired = users.filter(u => u.status === "Expired").length;

    onlineUsers.textContent = online;

    expiredUsers.textContent = expired;

}

// Search
searchUser.addEventListener("input", () => {

    const search = searchUser.value.toLowerCase();

    const filtered = allUsers.filter(user =>

        user.phone.toLowerCase().includes(search)

    );

    displayUsers(filtered);

});

// Refresh
refreshBtn.addEventListener("click", loadUsers);

// Initial load
loadUsers();

// Auto refresh every 10 seconds
setInterval(loadUsers, 10000);