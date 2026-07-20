let transactions =
  JSON.parse(localStorage.getItem("spendwiseTransactions")) || [];

let currentType = "income";

let showAllTransactions = false;

let expenseChart;

/* DOM */

const modalOverlay = document.getElementById("modalOverlay");

const transactionForm = document.getElementById("transactionForm");

const transactionList = document.getElementById("transactionList");

const categoryList = document.getElementById("categoryList");

const searchInput = document.getElementById("searchInput");

const typeFilter = document.getElementById("typeFilter");

const toast = document.getElementById("toast");

/* CURRENCY */

function formatCurrency(amount) {
  return `৳ ${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* TOAST */

function showToast(message) {
  document.getElementById("toastMessage").textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* MODAL */

function openModal(type) {
  currentType = type;

  modalOverlay.classList.add("show");

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

document
  .getElementById("incomeBtn")
  .addEventListener("click", () => openModal("income"));

document
  .getElementById("expenseBtn")
  .addEventListener("click", () => openModal("expense"));

document.getElementById("closeModal").addEventListener("click", closeModal);

document.getElementById("cancelBtn").addEventListener("click", closeModal);

modalOverlay.addEventListener("click", function (e) {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

/* TYPE */

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

  document.getElementById("modalTitle").textContent =
    type === "income" ? "Add Income" : "Add Expense";
}

/* ADD TRANSACTION */

transactionForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const transaction = {
    id: Date.now(),

    title: document.getElementById("transactionTitle").value.trim(),

    amount: Number(document.getElementById("amount").value),

    date: document.getElementById("date").value,

    category: document.getElementById("category").value,

    note: document.getElementById("note").value.trim(),

    type: currentType,
  };

  transactions.unshift(transaction);

  saveData();

  renderAll();

  closeModal();

  showToast(
    currentType === "income"
      ? "Income added successfully!"
      : "Expense added successfully!",
  );
});

/* SAVE */

function saveData() {
  localStorage.setItem("spendwiseTransactions", JSON.stringify(transactions));
}

/* TOTALS */

function calculateTotals() {
  const income = transactions

    .filter((t) => t.type === "income")

    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions

    .filter((t) => t.type === "expense")

    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  document.getElementById("totalIncome").textContent = formatCurrency(income);

  document.getElementById("totalExpense").textContent = formatCurrency(expense);

  document.getElementById("totalBalance").textContent = formatCurrency(balance);

  const percentage = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

  document.getElementById("balancePercentage").textContent =
    `${percentage >= 0 ? "+" : ""}${percentage}%`;
}

/* DATE */

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* TRANSACTIONS */

function renderTransactions() {
  let filtered = [...transactions];

  const search = searchInput.value.toLowerCase().trim();

  const filter = typeFilter.value;

  if (search) {
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(search) ||
        t.category.toLowerCase().includes(search),
    );
  }

  if (filter !== "all") {
    filtered = filtered.filter((t) => t.type === filter);
  }

  if (!showAllTransactions) {
    filtered = filtered.slice(0, 5);
  }

  if (filtered.length === 0) {
    transactionList.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="empty-state">

                        <i class="fa-solid fa-receipt"></i>

                        <p>
                            No transactions found
                        </p>

                    </div>

                </td>

            </tr>

        `;

    return;
  }

  transactionList.innerHTML = filtered
    .map(
      (t) => `

            <tr>

                <td>

                    <div class="transaction-title">

                        <div class="
                            transaction-icon
                            ${t.type}
                        ">

                            <i class="fa-solid
                                ${
                                  t.type === "income"
                                    ? "fa-arrow-down"
                                    : "fa-arrow-up"
                                }
                            "></i>

                        </div>

                        <div>

                            <strong>
                                ${t.title}
                            </strong>

                            <small>
                                ${t.note || "No note"}
                            </small>

                        </div>

                    </div>

                </td>


                <td>

                    <span class="category-badge">

                        ${t.category}

                    </span>

                </td>


                <td>
                    ${formatDate(t.date)}
                </td>


                <td class="
                    ${t.type === "income" ? "income-amount" : "expense-amount"}
                ">

                    ${t.type === "income" ? "+" : "-"}

                    ${formatCurrency(t.amount)}

                </td>


                <td>

                    <button
                        class="delete-btn"
                        onclick="
                            deleteTransaction(${t.id})
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

/* DELETE */

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);

  saveData();

  renderAll();

  showToast("Transaction deleted successfully.");
}

/* CATEGORIES */

function getCategoryData() {
  const result = {};

  transactions

    .filter((t) => t.type === "expense")

    .forEach((t) => {
      result[t.category] = (result[t.category] || 0) + t.amount;
    });

  return Object.entries(result).sort((a, b) => b[1] - a[1]);
}

function renderCategories() {
  const categories = getCategoryData();

  if (!categories.length) {
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
                                Spending category
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

/* CHART */

function renderChart() {
  const categories = getCategoryData();

  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels: categories.map((item) => item[0]),

      datasets: [
        {
          data: categories.map((item) => item[1]),

          borderWidth: 0,

          hoverOffset: 10,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      cutout: "72%",

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            usePointStyle: true,

            padding: 18,

            font: {
              size: 10,
            },
          },
        },
      },
    },
  });
}

/* SEARCH */

searchInput.addEventListener("input", renderTransactions);

typeFilter.addEventListener("change", renderTransactions);

/* VIEW ALL */

document.getElementById("viewAllBtn").addEventListener("click", function () {
  showAllTransactions = !showAllTransactions;

  this.innerHTML = showAllTransactions
    ? `
                        Show Less
                        <i class="
                            fa-solid
                            fa-arrow-up
                        "></i>
                    `
    : `
                        View All
                        <i class="
                            fa-solid
                            fa-arrow-right
                        "></i>
                    `;

  renderTransactions();
});

/* DARK MODE */

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
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
});

/* LOAD THEME */

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

/* MOBILE SIDEBAR */

document.getElementById("menuBtn").addEventListener("click", function () {
  document.getElementById("sidebar").classList.toggle("open");
});

/* NAVIGATION ACTIVE */

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    document
      .querySelectorAll(".nav-item")
      .forEach((nav) => nav.classList.remove("active"));

    this.classList.add("active");
  });
});

/* RENDER */

function renderAll() {
  calculateTotals();

  renderTransactions();

  renderCategories();

  renderChart();
}

renderAll();
