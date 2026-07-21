"use strict";

/* =========================
   STORAGE KEYS
========================= */

const USERS_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";
const THEME_KEY = "spendwise_theme";

const DEFAULT_IMAGE =
  "https://ui-avatars.com/api/?name=User&background=7c3aed&color=ffffff&size=200";

let currentUser = null;

/* =========================
   HELPERS
========================= */

function get(id) {
  return document.getElementById(id);
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser() {
  if (!currentUser) return;

  const users = getUsers();

  const index = users.findIndex((user) => user.id === currentUser.id);

  if (index !== -1) {
    users[index] = currentUser;
  } else {
    users.push(currentUser);
  }

  saveUsers(users);

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function showToast(message) {
  const toast = get("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  setupEvents();
  checkLogin();
});

/* =========================
   EVENTS
========================= */

function setupEvents() {
  // AUTH
  get("showSignup").addEventListener("click", () => {
    get("loginFormBox").classList.add("hidden");
    get("signupFormBox").classList.remove("hidden");
  });

  get("showLogin").addEventListener("click", () => {
    get("signupFormBox").classList.add("hidden");
    get("loginFormBox").classList.remove("hidden");
  });

  get("signupForm").addEventListener("submit", signup);
  get("loginForm").addEventListener("submit", login);

  // LOGOUT
  get("logoutBtn").addEventListener("click", logout);

  // THEME
  get("themeBtn").addEventListener("click", toggleTheme);

  // ADD INCOME
  get("addIncomeBtn").addEventListener("click", () => {
    openModal("income");
  });

  // ADD EXPENSE
  get("addExpenseBtn").addEventListener("click", () => {
    openModal("expense");
  });

  // MODAL
  get("closeModal").addEventListener("click", closeModal);

  get("transactionForm").addEventListener("submit", saveTransaction);

  // FILTERS
  get("typeFilter").addEventListener("change", renderAllTransactions);

  get("monthFilter").addEventListener("change", renderAllTransactions);

  // CSV
  get("downloadBtn").addEventListener("click", downloadCSV);

  // PROFILE
  get("profileForm").addEventListener("submit", updateProfile);

  get("imageInput").addEventListener("change", uploadProfileImage);

  get("removeImageBtn").addEventListener("click", removeProfileImage);

  get("deleteAccountBtn").addEventListener("click", deleteAccount);

  // VIEW ALL
  get("viewTransactions").addEventListener("click", () => {
    const button = document.querySelector('[data-page="transactions"]');

    openPage("transactions", button);
  });

  // NAVIGATION
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      openPage(button.dataset.page, button);
    });
  });
}

/* =========================
   AUTHENTICATION
========================= */

function checkLogin() {
  const savedUser = localStorage.getItem(CURRENT_USER_KEY);

  if (!savedUser) return;

  try {
    currentUser = JSON.parse(savedUser);

    if (!Array.isArray(currentUser.transactions)) {
      currentUser.transactions = [];
    }

    showApp();
  } catch (error) {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function signup(event) {
  event.preventDefault();

  const name = get("signupName").value.trim();

  const email = get("signupEmail").value.trim().toLowerCase();

  const password = get("signupPassword").value;

  const users = getUsers();

  const exists = users.some((user) => user.email === email);

  if (exists) {
    showToast("Email already exists");
    return;
  }

  currentUser = {
    id: Date.now(),

    name,

    email,

    password,

    image: DEFAULT_IMAGE,

    transactions: [],
  };

  users.push(currentUser);

  saveUsers(users);

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

  get("signupForm").reset();

  showToast("Account created successfully");

  showApp();
}

function login(event) {
  event.preventDefault();

  const email = get("loginEmail").value.trim().toLowerCase();

  const password = get("loginPassword").value;

  const user = getUsers().find(
    (item) => item.email === email && item.password === password,
  );

  if (!user) {
    showToast("Invalid email or password");
    return;
  }

  currentUser = user;

  if (!Array.isArray(currentUser.transactions)) {
    currentUser.transactions = [];
  }

  saveCurrentUser();

  showApp();
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);

  currentUser = null;

  get("app").classList.add("hidden");

  get("authPage").classList.remove("hidden");
}

/* =========================
   SHOW APP
========================= */

function showApp() {
  get("authPage").classList.add("hidden");

  get("app").classList.remove("hidden");

  updateUserUI();

  updateSummary();

  renderRecentTransactions();

  renderAllTransactions();

  renderCharts();
}

/* =========================
   USER UI
========================= */

function updateUserUI() {
  if (!currentUser) return;

  const image = currentUser.image || DEFAULT_IMAGE;

  get("topName").textContent = currentUser.name;

  get("welcomeText").textContent = `Welcome back, ${currentUser.name} 👋`;

  get("topAvatar").src = image;

  get("profileAvatar").src = image;

  get("profileName").textContent = currentUser.name;

  get("profileEmail").textContent = currentUser.email;

  get("profileNameInput").value = currentUser.name;

  get("profileEmailInput").value = currentUser.email;
}

/* =========================
   NAVIGATION
========================= */

function openPage(page, button) {
  document.querySelectorAll(".page").forEach((section) => {
    section.classList.add("hidden");
  });

  const pageMap = {
    dashboard: "dashboardPage",

    transactions: "transactionsPage",

    profile: "profilePage",
  };

  const selectedPage = get(pageMap[page]);

  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  const titleMap = {
    dashboard: "Dashboard",

    transactions: "Transactions",

    profile: "Profile",
  };

  get("pageTitle").textContent = titleMap[page];

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }
}

/* =========================
   MODAL
========================= */

function openModal(type) {
  get("modal").classList.remove("hidden");

  get("transactionForm").reset();

  get("editId").value = "";

  get("transactionType").value = type;

  get("dateInput").value = today();

  get("modalTitle").textContent =
    type === "income" ? "Add Income" : "Add Expense";
}

function closeModal() {
  get("modal").classList.add("hidden");
}

/* =========================
   TRANSACTIONS
========================= */

function saveTransaction(event) {
  event.preventDefault();

  if (!currentUser) return;

  const editId = get("editId").value;

  const type = get("transactionType").value;

  const amount = Number(get("amountInput").value);

  const category = get("categoryInput").value;

  const description = get("descriptionInput").value.trim() || "No description";

  const date = get("dateInput").value;

  if (!amount || amount <= 0 || !category || !date) {
    showToast("Please enter valid information");

    return;
  }

  const transaction = {
    id: editId ? Number(editId) : Date.now(),

    type,

    amount,

    category,

    description,

    date,
  };

  if (editId) {
    currentUser.transactions = currentUser.transactions.map((item) =>
      item.id === Number(editId) ? transaction : item,
    );
  } else {
    currentUser.transactions.unshift(transaction);
  }

  saveCurrentUser();

  closeModal();

  updateSummary();

  renderRecentTransactions();

  renderAllTransactions();

  renderCharts();

  showToast("Transaction saved successfully");
}

/* =========================
   SUMMARY
========================= */

function getTotals() {
  let income = 0;

  let expense = 0;

  currentUser.transactions.forEach((transaction) => {
    if (transaction.type === "income") {
      income += Number(transaction.amount);
    }

    if (transaction.type === "expense") {
      expense += Number(transaction.amount);
    }
  });

  return {
    income,

    expense,

    balance: income - expense,

    savings: income - expense,
  };
}

function updateSummary() {
  const totals = getTotals();

  get("income").textContent = formatMoney(totals.income);

  get("expense").textContent = formatMoney(totals.expense);

  get("balance").textContent = formatMoney(totals.balance);

  get("savings").textContent = formatMoney(totals.savings);

  get("income2").textContent = formatMoney(totals.income);

  get("expense2").textContent = formatMoney(totals.expense);
}

/* =========================
   RENDER TRANSACTIONS
========================= */

function renderRecentTransactions() {
  renderTransactionList(
    get("recentList"),

    currentUser.transactions.slice(0, 5),

    false,
  );
}

function renderAllTransactions() {
  let data = [...currentUser.transactions];

  const type = get("typeFilter").value;

  const month = get("monthFilter").value;

  if (type !== "all") {
    data = data.filter((item) => item.type === type);
  }

  if (month) {
    data = data.filter((item) => item.date.startsWith(month));
  }

  renderTransactionList(
    get("allList"),

    data,

    true,
  );
}

function renderTransactionList(container, data, showActions) {
  if (!container) return;

  if (!data.length) {
    container.innerHTML = `
        <div class="empty">
          No transactions found
        </div>
      `;

    return;
  }

  container.innerHTML = data
    .map((transaction) => {
      const isIncome = transaction.type === "income";

      return `

          <div class="transaction">

            <div class="transaction-left">

              <div class="
                transaction-icon
                ${transaction.type}
              ">

                <i class="
                  fa-solid
                  ${isIncome ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}
                "></i>

              </div>

              <div class="transaction-info">

                <strong>
                  ${transaction.description}
                </strong>

                <small>
                  ${transaction.category}
                  •
                  ${formatDate(transaction.date)}
                </small>

              </div>

            </div>

            <div class="transaction-right">

              <strong class="
                ${isIncome ? "income-text" : "expense-text"}
              ">

                ${isIncome ? "+" : "-"}

                ৳${formatMoney(transaction.amount)}

              </strong>

              ${
                showActions
                  ? `

                    <div class="
                      transaction-actions
                    ">

                      <button
                        class="edit-btn"
                        data-id="${transaction.id}"
                      >

                        <i class="
                          fa-solid
                          fa-pen
                        "></i>

                      </button>

                      <button
                        class="delete-btn"
                        data-id="${transaction.id}"
                      >

                        <i class="
                          fa-solid
                          fa-trash
                        "></i>

                      </button>

                    </div>

                  `
                  : ""
              }

            </div>

          </div>

        `;
    })
    .join("");

  if (showActions) {
    container.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
        editTransaction(Number(button.dataset.id));
      });
    });

    container.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", () => {
        deleteTransaction(Number(button.dataset.id));
      });
    });
  }
}

/* =========================
   EDIT
========================= */

function editTransaction(id) {
  const transaction = currentUser.transactions.find((item) => item.id === id);

  if (!transaction) return;

  get("modal").classList.remove("hidden");

  get("modalTitle").textContent = "Edit Transaction";

  get("editId").value = transaction.id;

  get("transactionType").value = transaction.type;

  get("amountInput").value = transaction.amount;

  get("categoryInput").value = transaction.category;

  get("descriptionInput").value = transaction.description;

  get("dateInput").value = transaction.date;
}

/* =========================
   DELETE TRANSACTION
========================= */

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) {
    return;
  }

  currentUser.transactions = currentUser.transactions.filter(
    (item) => item.id !== id,
  );

  saveCurrentUser();

  updateSummary();

  renderRecentTransactions();

  renderAllTransactions();

  renderCharts();

  showToast("Transaction deleted");
}

/* =========================
   CHARTS
========================= */

function getMonthlyTrend(monthsCount) {
  const count = monthsCount || 6;

  const now = new Date();

  const months = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,

      label: d.toLocaleDateString("en-US", { month: "short" }),

      income: 0,

      expense: 0,
    });
  }

  currentUser.transactions.forEach((transaction) => {
    const key = String(transaction.date).slice(0, 7);

    const month = months.find((item) => item.key === key);

    if (!month) return;

    if (transaction.type === "income") {
      month.income += Number(transaction.amount);
    } else {
      month.expense += Number(transaction.amount);
    }
  });

  months.forEach((month) => {
    month.savings = month.income - month.expense;
  });

  return months;
}

function renderTrendChart() {
  const months = getMonthlyTrend(6);

  const width = 600;

  const height = 260;

  const paddingLeft = 46;

  const paddingRight = 16;

  const paddingTop = 20;

  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;

  const chartHeight = height - paddingTop - paddingBottom;

  const values = months.flatMap((month) => [
    month.income,
    month.expense,
    month.savings,
  ]);

  const maxValue = Math.max(...values, 1);

  const minValue = Math.min(...values, 0);

  const range = maxValue - minValue || 1;

  const xStep = chartWidth / Math.max(months.length - 1, 1);

  const xPos = (index) => paddingLeft + index * xStep;

  const yPos = (value) =>
    paddingTop + chartHeight - ((value - minValue) / range) * chartHeight;

  const buildPoints = (key) =>
    months
      .map((month, index) => `${xPos(index)},${yPos(month[key])}`)
      .join(" ");

  const baselineY = yPos(0);

  const savingsAreaPoints = `${xPos(0)},${baselineY} ${buildPoints(
    "savings",
  )} ${xPos(months.length - 1)},${baselineY}`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((fraction) => {
      const y = paddingTop + chartHeight * fraction;

      const value = maxValue - range * fraction;

      return `

          <line
            class="grid-line"
            x1="${paddingLeft}"
            y1="${y}"
            x2="${width - paddingRight}"
            y2="${y}"
          ></line>

          <text x="4" y="${y + 3}">৳${Math.round(value)}</text>

        `;
    })
    .join("");

  const monthLabels = months
    .map(
      (month, index) => `
        <text x="${xPos(index)}" y="${height - 8}" text-anchor="middle">
          ${month.label}
        </text>
      `,
    )
    .join("");

  const buildDots = (key, className) =>
    months
      .map((month, index) => {
        const cx = xPos(index);

        const cy = yPos(month[key]);

        return `<circle class="${className}" cx="${cx}" cy="${cy}" r="4"><title>${
          month.label
        } ${key}: ৳${formatMoney(month[key])}</title></circle>`;
      })
      .join("");

  get("chart").innerHTML = `

      <div class="chart-legend">
        <div class="legend-item">
          <span class="legend-dot income-dot"></span>
          Income
        </div>

        <div class="legend-item">
          <span class="legend-dot expense-dot"></span>
          Expense
        </div>

        <div class="legend-item">
          <span class="legend-dot savings-dot"></span>
          Savings
        </div>
      </div>

      <svg
        class="trend-chart"
        viewBox="0 0 ${width} ${height}"
        xmlns="http://www.w3.org/2000/svg"
      >

        <defs>
          <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style="stop-color:var(--secondary); stop-opacity:0.6"></stop>
            <stop offset="100%" style="stop-color:var(--secondary); stop-opacity:0"></stop>
          </linearGradient>
        </defs>

        ${gridLines}

        <polygon class="savings-area" points="${savingsAreaPoints}"></polygon>

        <polyline class="line-income" points="${buildPoints("income")}"></polyline>

        <polyline class="line-expense" points="${buildPoints("expense")}"></polyline>

        <polyline class="line-savings" points="${buildPoints("savings")}"></polyline>

        ${buildDots("income", "income-text")}
        ${buildDots("expense", "expense-text")}
        ${buildDots("savings", "savings-text")}

        ${monthLabels}

      </svg>

    `;
}

function renderCharts() {
  renderTrendChart();

  const categories = {};

  currentUser.transactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = 0;
      }

      categories[item.category] += Number(item.amount);
    });

  const values = Object.values(categories);

  if (!values.length) {
    get("categoryList").innerHTML = `
        <div class="empty">
          No expense data yet
        </div>
      `;

    return;
  }

  const maxValue = Math.max(...values);

  get("categoryList").innerHTML = Object.entries(categories)
    .map(([category, amount]) => {
      const width = (amount / maxValue) * 100;

      return `

            <div
              class="category-item"
            >

              <div
                class="category-header"
              >

                <span>
                  ${category}
                </span>

                <strong>
                  ৳${formatMoney(amount)}
                </strong>

              </div>

              <div
                class="progress"
              >

                <div
                  style="width:${width}%"
                ></div>

              </div>

            </div>

          `;
    })
    .join("");
}

/* =========================
   PROFILE UPDATE
========================= */

function updateProfile(event) {
  event.preventDefault();

  if (!currentUser) return;

  const name = get("profileNameInput").value.trim();

  const email = get("profileEmailInput").value.trim().toLowerCase();

  if (!name || !email) {
    showToast("Please fill all information");

    return;
  }

  const emailExists = getUsers().some(
    (user) => user.email === email && user.id !== currentUser.id,
  );

  if (emailExists) {
    showToast("This email is already used");

    return;
  }

  currentUser.name = name;

  currentUser.email = email;

  saveCurrentUser();

  updateUserUI();

  showToast("Profile updated successfully");
}

/* =========================
   UPLOAD PROFILE IMAGE
========================= */

function uploadProfileImage(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file");

    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    currentUser.image = reader.result;

    saveCurrentUser();

    updateUserUI();

    showToast("Profile photo updated");
  };

  reader.readAsDataURL(file);
}

/* =========================
   REMOVE PROFILE IMAGE
========================= */

function removeProfileImage() {
  if (!confirm("Remove your profile photo?")) {
    return;
  }

  currentUser.image = DEFAULT_IMAGE;

  saveCurrentUser();

  updateUserUI();

  get("imageInput").value = "";

  showToast("Profile photo removed");
}

/* =========================
   DELETE ACCOUNT
========================= */

function deleteAccount() {
  if (!confirm("Are you sure you want to permanently delete your account?")) {
    return;
  }

  const users = getUsers().filter((user) => user.id !== currentUser.id);

  saveUsers(users);

  localStorage.removeItem(CURRENT_USER_KEY);

  currentUser = null;

  get("app").classList.add("hidden");

  get("authPage").classList.remove("hidden");

  showToast("Account deleted successfully");
}

/* =========================
   THEME
========================= */

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY);

  if (theme === "dark") {
    document.body.classList.add("dark");
  }

  updateThemeUI();
}

function toggleTheme() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");

  updateThemeUI();
}

function updateThemeUI() {
  const isDark = document.body.classList.contains("dark");

  get("themeIcon").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";

  get("themeText").textContent = isDark ? "Light Mode" : "Dark Mode";
}

/* =========================
   DOWNLOAD CSV
========================= */

function downloadCSV() {
  if (!currentUser.transactions.length) {
    showToast("No transactions available");

    return;
  }

  const headers = ["Type", "Amount", "Category", "Description", "Date"];

  const rows = currentUser.transactions.map((item) => [
    item.type,

    item.amount,

    item.category,

    item.description,

    item.date,
  ]);

  const csv = [headers, ...rows]

    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "spendwise-transactions.csv";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  showToast("CSV downloaded successfully");
}
