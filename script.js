/* =====================================
   SPENDWISE PERSONAL FINANCE TRACKER
===================================== */

/* =========================
   VARIABLES
========================= */

let transactions =
  JSON.parse(localStorage.getItem("spendwiseTransactions")) || [];

let currentType = "income";

let showAllTransactions = false;

let expenseChart;

/* =========================
   DOM ELEMENTS
========================= */

const modalOverlay = document.getElementById("modalOverlay");

const modalTitle = document.getElementById("modalTitle");

const transactionForm = document.getElementById("transactionForm");

const transactionList = document.getElementById("transactionList");

const totalBalance = document.getElementById("totalBalance");

const totalIncome = document.getElementById("totalIncome");

const totalExpense = document.getElementById("totalExpense");

const categoryList = document.getElementById("categoryList");

const searchInput = document.getElementById("searchInput");

const typeFilter = document.getElementById("typeFilter");

const themeBtn = document.getElementById("themeBtn");

const sidebar = document.getElementById("sidebar");

/* =========================
   MODAL
========================= */

function openModal(type = "income") {
  currentType = type;

  modalOverlay.classList.add("show");

  modalTitle.textContent = type === "income" ? "Add Income" : "Add Expense";

  setTransactionType(type);

  document.getElementById("date").value = new Date()
    .toISOString()
    .split("T")[0];
}

function closeModal() {
  modalOverlay.classList.remove("show");

  transactionForm.reset();

  setTransactionType("income");
}

/* CLOSE MODAL */

document.getElementById("closeModal").addEventListener("click", closeModal);

document.getElementById("cancelBtn").addEventListener("click", closeModal);

modalOverlay.addEventListener("click", function (e) {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

/* =========================
   TYPE SELECT
========================= */

const typeOptions = document.querySelectorAll(".type-option");

typeOptions.forEach((option) => {
  option.addEventListener("click", function () {
    setTransactionType(this.dataset.type);
  });
});

function setTransactionType(type) {
  currentType = type;

  typeOptions.forEach((option) => {
    option.classList.remove("active", "expense-active");
  });

  const selected = document.querySelector(`[data-type="${type}"]`);

  selected.classList.add(type === "income" ? "active" : "expense-active");

  modalTitle.textContent = type === "income" ? "Add Income" : "Add Expense";
}

/* =========================
   ADD TRANSACTION
========================= */

transactionForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("transactionTitle").value.trim();

  const amount = Number(document.getElementById("amount").value);

  const date = document.getElementById("date").value;

  const category = document.getElementById("category").value;

  const note = document.getElementById("note").value.trim();

  if (!title || !amount || !date || !category) {
    alert("Please fill all required fields.");

    return;
  }

  const transaction = {
    id: Date.now(),

    title,

    amount,

    date,

    category,

    note,

    type: currentType,
  };

  transactions.unshift(transaction);

  saveTransactions();

  renderAll();

  closeModal();
});

/* =========================
   SAVE DATA
========================= */

function saveTransactions() {
  localStorage.setItem(
    "spendwiseTransactions",

    JSON.stringify(transactions),
  );
}

/* =========================
   CALCULATE TOTALS
========================= */

function calculateTotals() {
  const income = transactions

    .filter((transaction) => transaction.type === "income")

    .reduce((total, transaction) => total + transaction.amount, 0);

  const expense = transactions

    .filter((transaction) => transaction.type === "expense")

    .reduce((total, transaction) => total + transaction.amount, 0);

  const balance = income - expense;

  totalIncome.textContent = formatCurrency(income);

  totalExpense.textContent = formatCurrency(expense);

  totalBalance.textContent = formatCurrency(balance);

  const percentage = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

  document.getElementById("balancePercentage").textContent =
    `${percentage >= 0 ? "+" : ""}${percentage}%`;
}

/* =========================
   FORMAT CURRENCY
========================= */

function formatCurrency(amount) {
  return `৳ ${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* =========================
   FORMAT DATE
========================= */

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================
   RENDER TRANSACTIONS
========================= */

function renderTransactions() {
  let filteredTransactions = [...transactions];

  const searchTerm = searchInput.value.toLowerCase().trim();

  const selectedType = typeFilter.value;

  if (searchTerm) {
    filteredTransactions = filteredTransactions.filter(
      (transaction) =>
        transaction.title.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm),
    );
  }

  if (selectedType !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (transaction) => transaction.type === selectedType,
    );
  }

  if (!showAllTransactions) {
    filteredTransactions = filteredTransactions.slice(0, 5);
  }

  if (filteredTransactions.length === 0) {
    transactionList.innerHTML = `

            <tr class="empty-row">

                <td colspan="5">

                    <div class="empty-state">

                        <i class="fa-solid fa-receipt"></i>

                        <h3>
                            No transactions found
                        </h3>

                        <p>
                            Try adding a new transaction
                        </p>

                    </div>

                </td>

            </tr>

        `;

    return;
  }

  transactionList.innerHTML = filteredTransactions
    .map(
      (transaction) => `

        <tr>

            <td>

                <div class="transaction-title">

                    <div class="
                        transaction-icon
                        ${transaction.type}
                    ">

                        <i class="fa-solid
                            ${
                              transaction.type === "income"
                                ? "fa-arrow-down"
                                : "fa-arrow-up"
                            }
                        "></i>

                    </div>

                    <div>

                        <strong>
                            ${transaction.title}
                        </strong>

                        <small>
                            ${transaction.note || "No note"}
                        </small>

                    </div>

                </div>

            </td>


            <td>

                <span class="category-badge">

                    ${transaction.category}

                </span>

            </td>


            <td>

                ${formatDate(transaction.date)}

            </td>


            <td class="
                ${
                  transaction.type === "income"
                    ? "income-amount"
                    : "expense-amount"
                }
            ">

                ${transaction.type === "income" ? "+" : "-"}

                ${formatCurrency(transaction.amount)}

            </td>


            <td>

                <button

                    class="delete-btn"

                    onclick="
                        deleteTransaction(
                            ${transaction.id}
                        )
                    "

                >

                    <i class="
                        fa-solid
                        fa-trash
                    "></i>

                </button>

            </td>

        </tr>

    `,
    )
    .join("");
}

/* =========================
   DELETE TRANSACTION
========================= */

function deleteTransaction(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this transaction?",
  );

  if (!confirmDelete) {
    return;
  }

  transactions = transactions.filter((transaction) => transaction.id !== id);

  saveTransactions();

  renderAll();
}

/* =========================
   CATEGORY DATA
========================= */

function getCategoryData() {
  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const categoryTotals = {};

  expenses.forEach((transaction) => {
    if (!categoryTotals[transaction.category]) {
      categoryTotals[transaction.category] = 0;
    }

    categoryTotals[transaction.category] += transaction.amount;
  });

  return Object.entries(categoryTotals)

    .sort((a, b) => b[1] - a[1]);
}

/* =========================
   RENDER CATEGORIES
========================= */

function renderCategories() {
  const categories = getCategoryData();

  if (categories.length === 0) {
    categoryList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-chart-simple"></i>

                <p>
                    No expense data yet
                </p>

            </div>

        `;

    return;
  }

  const icons = {
    Food: "🍔",

    Transport: "🚗",

    Shopping: "🛍️",

    Bills: "💡",

    Entertainment: "🎮",

    Health: "🏥",

    Education: "📚",

    Other: "📦",
  };

  categoryList.innerHTML = categories
    .slice(0, 5)
    .map(
      ([category, amount]) => `

        <div class="category-item">

            <div class="category-icon">

                ${icons[category] || "📦"}

            </div>

            <div class="category-info">

                <strong>
                    ${category}
                </strong>

                <small>
                    Expense category
                </small>

            </div>

            <div class="category-amount">

                ${formatCurrency(amount)}

            </div>

        </div>

    `,
    )
    .join("");
}

/* =========================
   CHART
========================= */

function renderChart() {
  const categories = getCategoryData();

  const labels = categories.map((item) => item[0]);

  const data = categories.map((item) => item[1]);

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels,

      datasets: [
        {
          data,

          borderWidth: 0,

          hoverOffset: 8,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      cutout: "70%",

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            usePointStyle: true,

            padding: 18,

            font: {
              size: 11,
            },
          },
        },
      },
    },
  });
}

/* =========================
   SEARCH & FILTER
========================= */

searchInput.addEventListener(
  "input",

  renderTransactions,
);

typeFilter.addEventListener(
  "change",

  renderTransactions,
);

/* =========================
   VIEW ALL
========================= */

document.getElementById("viewAllBtn").addEventListener("click", function () {
  showAllTransactions = !showAllTransactions;

  this.innerHTML = showAllTransactions
    ? `Show Less
                        <i class="
                            fa-solid
                            fa-arrow-up
                        ">
                        </i>`
    : `View All
                        <i class="
                            fa-solid
                            fa-arrow-right
                        ">
                        </i>`;

  renderTransactions();
});

/* =========================
   DARK MODE
========================= */

themeBtn.addEventListener(
  "click",

  function () {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem("spendwiseDarkMode", isDark);

    this.innerHTML = isDark
      ? `
                <i class="
                    fa-solid
                    fa-sun
                "></i>

                <span>
                    Light Mode
                </span>
            `
      : `
                <i class="
                    fa-solid
                    fa-moon
                "></i>

                <span>
                    Dark Mode
                </span>
            `;
  },
);

/* LOAD DARK MODE */

if (localStorage.getItem("spendwiseDarkMode") === "true") {
  document.body.classList.add("dark");

  themeBtn.innerHTML = `

        <i class="
            fa-solid
            fa-sun
        "></i>

        <span>
            Light Mode
        </span>

    `;
}

/* =========================
   SIDEBAR MOBILE
========================= */

document.getElementById("menuBtn").addEventListener("click", function () {
  sidebar.classList.toggle("open");
});

/* =========================
   BUTTON EVENTS
========================= */

document
  .getElementById("incomeBtn")
  .addEventListener("click", () => openModal("income"));

document
  .getElementById("expenseBtn")
  .addEventListener("click", () => openModal("expense"));

/* =========================
   RENDER EVERYTHING
========================= */

function renderAll() {
  calculateTotals();

  renderTransactions();

  renderCategories();

  renderChart();
}

/* =========================
   INITIAL LOAD
========================= */

renderAll();
