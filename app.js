const STORAGE_KEY = "pennywise-v1";

const defaultData = {
  accounts: [
    { id: "acc-1", name: "Everyday account", type: "Bank", opening: 13850000 },
    { id: "acc-2", name: "Cash wallet", type: "Cash", opening: 500000 },
    { id: "acc-3", name: "Travel card", type: "Credit card", opening: 0 }
  ],
  categories: [
    { name: "Salary", kind: "income", icon: "↗", color: "#5b9e70", hidden: false },
    { name: "Other income", kind: "income", icon: "✦", color: "#84ad64", hidden: false },
    { name: "Food", kind: "expense", icon: "☕", color: "#dd9e68", hidden: false },
    { name: "Groceries", kind: "expense", icon: "◉", color: "#a9bf72", hidden: false },
    { name: "Rent", kind: "expense", icon: "⌂", color: "#8f7bc4", hidden: false },
    { name: "Utilities", kind: "expense", icon: "ϟ", color: "#70a9b0", hidden: false },
    { name: "Transport", kind: "expense", icon: "↗", color: "#d4a557", hidden: false },
    { name: "Fuel", kind: "expense", icon: "◈", color: "#ce8266", hidden: false },
    { name: "Shopping", kind: "expense", icon: "◇", color: "#cf8090", hidden: false },
    { name: "Health", kind: "expense", icon: "✚", color: "#78a882", hidden: false },
    { name: "Education", kind: "expense", icon: "▤", color: "#7297bd", hidden: false },
    { name: "Entertainment", kind: "expense", icon: "♫", color: "#b188bc", hidden: false },
    { name: "EMI", kind: "expense", icon: "▦", color: "#bc8e65", hidden: false },
    { name: "Investments", kind: "expense", icon: "↗", color: "#58a294", hidden: false },
    { name: "Others", kind: "expense", icon: "•••", color: "#9b9f9b", hidden: false }
  ],
  transactions: [
    { id: "tx-1", type: "income", amount: 8500000, date: "2026-11-01", category: "Salary", account: "acc-1", note: "Monthly salary" },
    { id: "tx-2", type: "expense", amount: 2200000, date: "2026-11-02", category: "Rent", account: "acc-1", note: "November rent" },
    { id: "tx-3", type: "expense", amount: 245000, date: "2026-11-04", category: "Groceries", account: "acc-1", note: "Weekly groceries" },
    { id: "tx-4", type: "expense", amount: 68000, date: "2026-11-06", category: "Food", account: "acc-2", note: "Coffee with friends" },
    { id: "tx-5", type: "expense", amount: 125000, date: "2026-11-08", category: "Transport", account: "acc-2", note: "Metro & cab" },
    { id: "tx-6", type: "expense", amount: 399900, date: "2026-11-10", category: "Shopping", account: "acc-3", note: "Running shoes" },
    { id: "tx-7", type: "expense", amount: 180000, date: "2026-11-12", category: "Utilities", account: "acc-1", note: "Electricity bill" },
    { id: "tx-8", type: "expense", amount: 94000, date: "2026-11-14", category: "Food", account: "acc-2", note: "Sunday brunch" }
  ],
  budgets: [
    { category: "Food", limit: 600000, month: "2026-11" },
    { category: "Groceries", limit: 1000000, month: "2026-11" },
    { category: "Transport", limit: 500000, month: "2026-11" },
    { category: "Shopping", limit: 700000, month: "2026-11" },
    { category: "Utilities", limit: 400000, month: "2026-11" },
    { category: "Health", limit: 300000, month: "2026-11" }
  ],
  goals: [
    { id: "goal-1", name: "Japan, here I come!", target: 18000000, saved: 6850000, date: "2027-10-01", icon: "✈" },
    { id: "goal-2", name: "Rainy day fund", target: 15000000, saved: 9200000, date: "", icon: "☂" }
  ]
};

let data = loadData();
let activePage = "dashboard";
let selectedMonth = new Date();
let toastTimer;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultData);
    const parsed = JSON.parse(saved);
    const restored = { ...structuredClone(defaultData), ...parsed };
    restored.budgets = restored.budgets.map((item) => ({
      ...item,
      month: item.month || monthKey(new Date())
    }));
    return restored;
  } catch (error) {
    console.error("Could not load saved finance data.", error);
    return structuredClone(defaultData);
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Could not save finance data.", error);
    showToast("Could not save changes in this browser.");
  }
}

function money(amount, compact = false) {
  const absolute = Math.abs(Number(amount) || 0) / 100;
  if (compact && absolute >= 100000) {
    return `₹${(absolute / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}L`;
  }
  if (compact && absolute >= 1000) {
    return `₹${(absolute / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k`;
  }
  return `₹${absolute.toLocaleString("en-IN")}`;
}

function dateLabel(date, options) {
  const parsed = new Date(`${date}T00:00:00`);
  if (options) return new Intl.DateTimeFormat("en-IN", options).format(parsed);
  return `${String(parsed.getDate()).padStart(2, "0")}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${parsed.getFullYear()}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthTransactions(date = selectedMonth) {
  const key = monthKey(date);
  return data.transactions.filter((item) => item.date.slice(0, 7) === key);
}

function monthBudgets(date = selectedMonth) {
  return data.budgets.filter((item) => item.month === monthKey(date));
}

function expensesForMonth(date = selectedMonth) {
  return monthTransactions(date).filter((item) => item.type === "expense");
}

function totalFor(items, type) {
  return items.filter((item) => item.type === type).reduce((sum, item) => sum + Number(item.amount), 0);
}

function categorySpent(category, date = selectedMonth) {
  return expensesForMonth(date)
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

function getAccountBalance(account) {
  return data.transactions.reduce((balance, item) => {
    if (item.type === "income" && item.account === account.id) return balance + Number(item.amount);
    if (item.type === "expense" && item.account === account.id) return balance - Number(item.amount);
    if (item.type === "transfer" && item.account === account.id) return balance - Number(item.amount);
    if (item.type === "transfer" && item.toAccount === account.id) return balance + Number(item.amount);
    return balance;
  }, Number(account.opening) || 0);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function monthSelect() {
  const value = monthKey(selectedMonth);
  return `<select class="month-select" id="month-select" aria-label="Select month">
    ${[-2, -1, 0, 1].map((offset) => {
      const month = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1);
      return `<option value="${monthKey(month)}" ${monthKey(month) === value ? "selected" : ""}>${month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</option>`;
    }).join("")}
  </select>`;
}

function pageHeading(title, subtitle, controls = "") {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  return `<div class="page-heading"><div><p class="eyebrow">${escapeHtml(title === "Dashboard" ? today : "YOUR FINANCES")}</p><h1>${escapeHtml(title)}</h1><p class="heading-subtitle">${subtitle}</p></div><div class="heading-controls">${controls}</div></div>`;
}

function metricCard(label, value, note, icon, iconClass, variation = "") {
  return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${iconClass}">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${variation ? `<span class="${variation.class}">${variation.text}</span>` : ""}${note}</div></article>`;
}

function lineChart() {
  const values = [];
  for (let offset = -5; offset <= 0; offset += 1) {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1);
    const items = monthTransactions(date);
    values.push({
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      income: totalFor(items, "income"),
      expense: totalFor(items, "expense")
    });
  }
  const max = Math.max(1000, ...values.flatMap((item) => [item.income, item.expense]));
  const x = (index) => 37 + index * 64;
  const y = (value) => 140 - (value / max) * 112;
  const incomePoints = values.map((item, index) => `${x(index)},${y(item.income)}`).join(" ");
  const expensePoints = values.map((item, index) => `${x(index)},${y(item.expense)}`).join(" ");
  const fillPoints = `${x(0)},140 ${incomePoints} ${x(5)},140`;
  return `<svg viewBox="0 0 370 165" role="img" aria-label="Income and expense trend for the last six months">
    <defs><linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6da981" stop-opacity=".16"/><stop offset="1" stop-color="#6da981" stop-opacity="0"/></linearGradient></defs>
    ${[28, 65, 102, 140].map((lineY) => `<line class="chart-grid" x1="29" x2="356" y1="${lineY}" y2="${lineY}"/>`).join("")}
    <polygon class="chart-fill" points="${fillPoints}"/>
    <polyline class="chart-expense" points="${expensePoints}"/>
    <polyline class="chart-income" points="${incomePoints}"/>
    ${values.map((item, index) => `<text class="chart-label" text-anchor="middle" x="${x(index)}" y="158">${item.label}</text>`).join("")}
    ${values.map((item, index) => index === values.length - 1 ? `<circle class="chart-dot" cx="${x(index)}" cy="${y(item.income)}" r="4"/>` : "").join("")}
  </svg>`;
}

function categorySummary() {
  const totals = new Map();
  expensesForMonth().forEach((item) => totals.set(item.category || "Others", (totals.get(item.category || "Others") || 0) + Number(item.amount)));
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3).map(([name, amount]) => ({ name, amount, category: data.categories.find((item) => item.name === name) }));
  const remainder = sorted.slice(3).reduce((sum, [, amount]) => sum + amount, 0);
  if (remainder) top.push({ name: "Other categories", amount: remainder, category: null });
  return top;
}

function donutStyle(categories, total) {
  if (!total) return "conic-gradient(#edf1ec 0deg 360deg)";
  const colors = categories.map((item) => item.category?.color || "#9b9f9b");
  let start = 0;
  const segments = categories.map((item, index) => {
    const end = start + (item.amount / total) * 360;
    const segment = `${colors[index]} ${start}deg ${end}deg`;
    start = end;
    return segment;
  });
  return `conic-gradient(${segments.join(", ")})`;
}

function transactionRows(items, limit, grouped = false) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const visible = limit ? sorted.slice(0, limit) : sorted;
  if (!visible.length) {
    return `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">↕</div><strong>No transactions yet</strong><p>Add your first transaction to see it here.</p></div></td></tr>`;
  }
  let previousDate = "";
  return visible.map((item) => {
    const category = data.categories.find((entry) => entry.name === item.category);
    const account = data.accounts.find((entry) => entry.id === item.account);
    const title = item.note || item.category || (item.type === "transfer" ? "Account transfer" : "Transaction");
    const categoryName = item.type === "transfer" ? "Transfer" : item.category || "Uncategorised";
    const sign = item.type === "income" ? "+" : item.type === "expense" ? "−" : "";
    const dateHeading = grouped && item.date !== previousDate ? `<tr class="transaction-date-heading"><td colspan="4">${dateLabel(item.date)}</td></tr>` : "";
    previousDate = item.date;
    return `${dateHeading}<tr data-edit-transaction="${escapeHtml(item.id)}" tabindex="0" aria-label="Edit ${escapeHtml(title)}, ${dateLabel(item.date)}, ${money(item.amount)}">
      <td><span class="transaction-title"><span class="transaction-icon">${category?.icon || (item.type === "income" ? "↗" : "↔")}</span>${escapeHtml(title)}</span></td>
      <td><span class="transaction-category">${escapeHtml(categoryName)}</span></td>
      <td>${escapeHtml(account?.name || "Account")} · ${dateLabel(item.date)}</td>
      <td class="amount ${item.type === "income" ? "income" : ""}">${sign}${money(item.amount)}</td>
    </tr>`;
  }).join("");
}

function dashboardPage() {
  const items = monthTransactions();
  const income = totalFor(items, "income");
  const expense = totalFor(items, "expense");
  const saved = income - expense;
  const savingsRate = income ? Math.max(0, Math.round((saved / income) * 100)) : 0;
  const summary = categorySummary();
  const spent = totalFor(expensesForMonth(), "expense");
  const budgets = monthBudgets().slice(0, 4);
  return `${pageHeading("Dashboard", "Here’s your money at a glance.", `${monthSelect()}<button class="primary-button" data-action="add-transaction"><span class="plus">+</span> Add transaction</button>`)}
    <div class="metric-grid">
      ${metricCard("Total income", money(income), "Income this month", "↗", "icon-income", { class: "positive", text: "↑ " })}
      ${metricCard("Total spending", money(expense), "Outflow this month", "↘", "icon-spend")}
      ${metricCard("Net savings", money(saved), saved >= 0 ? "You’re keeping more" : "Spending is above income", "◒", "icon-savings")}
      ${metricCard("Savings rate", `${savingsRate}%`, "of your income saved", "✳", "icon-rate")}
    </div>
    <div class="content-grid">
      <section class="panel cashflow-panel"><div class="panel-heading"><div><h2>Cash flow</h2><p class="panel-caption">Income vs. spending · last 6 months</p></div><button class="text-button" data-page-link="transactions">Details ↗</button></div>
        <div class="chart-legend"><span class="legend-item"><i class="legend-dot legend-income"></i>Income</span><span class="legend-item"><i class="legend-dot legend-expense"></i>Expenses</span></div><div class="cashflow-chart">${lineChart()}</div>
      </section>
      <div class="right-stack">
        <section class="panel spending-panel"><div class="panel-heading"><div><h2>Where it goes</h2><p class="panel-caption">Spending by category</p></div><button class="text-button" data-page-link="transactions">See all</button></div>
          <div class="spending-content">${spent ? `<div class="donut-wrap"><div class="donut" style="background:${donutStyle(summary, spent)}"></div><div class="donut-center"><strong>${money(spent, true)}</strong><small>total spent</small></div></div><div class="category-legend">${summary.map((item) => `<div class="category-row"><i class="category-dot" style="background:${item.category?.color || "#9b9f9b"}"></i>${escapeHtml(item.name)}<strong>${Math.round(item.amount / spent * 100)}%</strong></div>`).join("")}</div>` : `<div class="spending-empty">Your spending breakdown will appear here.</div>`}</div>
        </section>
        <section class="panel budget-panel"><div class="panel-heading"><div><h2>Monthly budgets</h2><p class="panel-caption">${budgets.length} categories set up</p></div><button class="text-button" data-page-link="budgets">Manage</button></div>
          <div class="budget-list">${budgets.length ? budgets.map((item) => budgetRow(item)).join("") : `<div class="empty-state"><strong>No budgets yet</strong><p>Set a limit to stay on track.</p></div>`}</div>
        </section>
      </div>
      <section class="panel recent-panel"><div class="panel-heading"><div><h2>Recent transactions</h2><p class="panel-caption">Your latest money moves</p></div><button class="text-button" data-page-link="transactions">View all ↗</button></div>
        <div class="table-wrap"><table class="transaction-table"><thead><tr><th>Description</th><th>Category</th><th>Account · date</th><th style="text-align:right">Amount</th></tr></thead><tbody>${transactionRows(items, 5)}</tbody></table></div>
      </section>
    </div>`;
}

function budgetRow(item) {
  const spent = categorySpent(item.category);
  const limit = Number(item.limit) || 0;
  const ratio = limit ? spent / limit : 0;
  const level = ratio >= 1 ? "over" : ratio >= .8 ? "warning" : "";
  const category = data.categories.find((entry) => entry.name === item.category);
  return `<div class="budget-row"><div class="budget-line"><span class="budget-label"><span>${category?.icon || "◇"}</span>${escapeHtml(item.category)}</span><span class="budget-numbers"><strong>${money(spent, true)}</strong> / ${money(limit, true)}</span></div><div class="progress-track"><div class="progress-fill ${level}" style="width:${Math.min(100, ratio * 100)}%"></div></div></div>`;
}

function transactionPage() {
  const items = [...data.transactions];
  return `${pageHeading("Transactions", "Every little thing, all in one place.", `<button class="primary-button" data-action="add-transaction"><span class="plus">+</span> Add transaction</button><button class="secondary-button" data-action="export">Export CSV</button>`)}
    <section class="panel list-panel"><div class="panel-heading"><div><h2>All transactions</h2><p class="panel-caption">${items.length} transactions recorded</p></div></div>
    <div class="filter-bar"><input id="transaction-search" class="search-input" type="search" placeholder="Search notes or amounts…" aria-label="Search transactions">
      <select class="filter-select" id="filter-type" aria-label="Filter by type"><option value="">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="transfer">Transfers</option></select>
      <select class="filter-select" id="filter-category" aria-label="Filter by category"><option value="">All categories</option>${data.categories.filter((cat) => !cat.hidden).map((cat) => `<option>${escapeHtml(cat.name)}</option>`).join("")}</select>
      <select class="filter-select" id="filter-account" aria-label="Filter by account"><option value="">All accounts</option>${data.accounts.map((account) => `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)}</option>`).join("")}</select>
      <input class="filter-select" id="filter-date-from" type="date" aria-label="From date">
      <input class="filter-select" id="filter-date-to" type="date" aria-label="To date">
    </div>
    <div class="table-wrap"><table class="transaction-table"><thead><tr><th>Description</th><th>Category</th><th>Account · date</th><th style="text-align:right">Amount</th></tr></thead><tbody id="transaction-list">${transactionRows(items, undefined, true)}</tbody></table></div></section>`;
}

function budgetsPage() {
  const selectedBudgets = monthBudgets();
  const budgeted = new Set(selectedBudgets.map((item) => item.category));
  const available = data.categories.filter((item) => item.kind === "expense" && !item.hidden && !budgeted.has(item.name));
  const cards = selectedBudgets.map((item) => {
    const spent = categorySpent(item.category);
    const limit = Number(item.limit) || 0;
    const ratio = limit ? spent / limit : 0;
    const level = ratio >= 1 ? "over" : ratio >= .8 ? "warning" : "";
    const remaining = limit - spent;
    return `<article class="budget-card"><div class="budget-card-top"><div class="budget-card-name">${data.categories.find((cat) => cat.name === item.category)?.icon || "◇"} ${escapeHtml(item.category)}</div><button class="text-button" data-edit-budget="${escapeHtml(item.category)}">Edit</button></div>
      <div class="budget-card-total"><strong>${money(spent)}</strong> spent of ${money(limit)}</div><div class="progress-track"><div class="progress-fill ${level}" style="width:${Math.min(100, ratio * 100)}%"></div></div>
      <div class="budget-remaining ${level}">${remaining >= 0 ? `${money(remaining)} left` : `${money(Math.abs(remaining))} over budget`}</div></article>`;
  }).join("");
  return `${pageHeading("Budgets", "A plan for your spending, not a restriction.", `<button class="secondary-button" data-action="copy-budgets">Copy last month</button><button class="primary-button" data-action="add-budget"><span class="plus">+</span> Add budget</button>`)}
    <section class="panel"><div class="panel-heading"><div><h2>${selectedMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} budgets</h2><p class="panel-caption">Progress turns amber at 80% and red when you reach your limit.</p></div>${monthSelect()}</div>
    ${cards ? `<div class="budget-cards">${cards}</div>` : `<div class="empty-state"><div class="empty-icon">▤</div><strong>No budgets yet</strong><p>Add a category budget to start tracking your spending.</p></div>`}
    ${available.length ? `<div class="panel-heading section-spacer"><div><h2>Categories without a budget</h2><p class="panel-caption">Give your money a little direction.</p></div></div><div class="budget-cards">${available.slice(0, 4).map((cat) => `<article class="budget-card"><div class="budget-card-top"><div class="budget-card-name">${cat.icon} ${escapeHtml(cat.name)}</div><button class="text-button" data-action="add-budget" data-category="${escapeHtml(cat.name)}">Set limit +</button></div><div class="budget-remaining">No monthly limit set</div></article>`).join("")}</div>` : ""}
    </section>`;
}

function goalsPage() {
  const cards = data.goals.map((goal) => {
    const progress = goal.target ? Math.min(100, Math.round(goal.saved / goal.target * 100)) : 0;
    const needed = goal.date ? Math.max(1, Math.ceil((new Date(`${goal.date}T00:00:00`) - new Date()) / (1000 * 60 * 60 * 24 * 30))) : null;
    const monthly = needed ? Math.max(0, Math.ceil((goal.target - goal.saved) / needed)) : null;
    return `<article class="goal-card"><div class="goal-card-top"><div class="goal-name">${escapeHtml(goal.icon || "◎")} ${escapeHtml(goal.name)}</div><div class="goal-circle" style="--progress:${progress * 3.6}deg"><span>${progress}%</span></div></div>
      <div class="goal-amount">${money(goal.saved)} <span style="color:#9aa29b;font:400 11px 'DM Sans',sans-serif">of ${money(goal.target)}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="goal-card-footer"><span class="goal-date">${goal.date ? `Target ${dateLabel(goal.date, { month: "short", year: "numeric" })}` : "No target date"}${monthly !== null ? ` · ${money(monthly)}/mo` : ""}</span><button class="text-button" data-contribute="${escapeHtml(goal.id)}">+ Add money</button></div></article>`;
  }).join("");
  return `${pageHeading("Your goals", "Make room for the things that matter.", `<button class="primary-button" data-action="add-goal"><span class="plus">+</span> New goal</button>`)}
    <section class="panel"><div class="panel-heading"><div><h2>Savings goals</h2><p class="panel-caption">A little at a time gets you there.</p></div></div>${cards ? `<div class="goal-grid">${cards}</div>` : `<div class="empty-state"><div class="empty-icon">◎</div><strong>No goals yet</strong><p>Create a savings goal and watch your progress grow.</p></div>`}</section>`;
}

function accountsPage() {
  const icons = { Bank: "▣", Cash: "◉", Wallet: "▱", "Credit card": "▰" };
  const cards = data.accounts.map((account) => `<article class="account-card ${account.archived ? "hidden-category" : ""}"><div class="account-card-top"><span class="account-type-icon">${icons[account.type] || "▣"}</span><button class="text-button" data-edit-account="${escapeHtml(account.id)}">${account.archived ? "Restore" : "Edit"}</button></div><div class="account-name" style="margin-top:13px">${escapeHtml(account.name)}</div><div class="account-balance">${money(getAccountBalance(account))}</div><div class="account-type-label">${escapeHtml(account.type)}${account.type === "Credit card" ? " · balance owed" : ""}${account.archived ? " · archived" : ""}</div></article>`).join("");
  return `${pageHeading("Accounts", "All your accounts, together.", `<button class="primary-button" data-action="add-account"><span class="plus">+</span> Add account</button>`)}
    <section class="panel"><div class="panel-heading"><div><h2>Your accounts</h2><p class="panel-caption">Balances update as you add transactions.</p></div></div>${cards ? `<div class="account-grid">${cards}</div>` : `<div class="empty-state"><div class="empty-icon">▣</div><strong>No accounts yet</strong><p>Add an account to start tracking money.</p></div>`}</section>`;
}

function categoriesPage() {
  const cards = data.categories.map((cat) => `<article class="category-card ${cat.hidden ? "hidden-category" : ""}"><span class="category-icon" style="color:${cat.color}">${escapeHtml(cat.icon)}</span><span class="category-info"><strong>${escapeHtml(cat.name)}</strong><small>${cat.kind === "income" ? "Income" : "Expense"}</small></span><button class="category-hide" data-edit-category="${escapeHtml(cat.name)}">Edit</button><button class="category-hide" data-toggle-category="${escapeHtml(cat.name)}">${cat.hidden ? "Show" : "Hide"}</button></article>`).join("");
  return `${pageHeading("Categories", "Organise spending in a way that makes sense to you.", `<button class="primary-button" data-action="add-category"><span class="plus">+</span> New category</button>`)}
    <section class="panel"><div class="panel-heading"><div><h2>Your categories</h2><p class="panel-caption">Choose a category when you add a transaction.</p></div></div><div class="category-grid">${cards}</div></section>`;
}

function settingsPage() {
  return `${pageHeading("Settings", "Manage your preferences and personal data.", "")}
    <div class="content-grid">
      <section class="panel"><div class="panel-heading"><div><h2>Profile</h2><p class="panel-caption">Your personal space</p></div></div><div style="padding:0 19px 19px"><div class="field"><label>Name</label><input class="field-input" value="Jackie Verma" disabled></div><div class="field" style="margin-top:13px"><label>Currency</label><input class="field-input" value="INR · Indian Rupee" disabled></div></div></section>
      <section class="panel"><div class="panel-heading"><div><h2>Your data</h2><p class="panel-caption">Your finance data stays in this browser.</p></div></div><div style="padding:0 19px 19px"><p style="color:#768078;font-size:11px;line-height:1.6">Export transactions to a CSV file or clear the demo data saved in this browser. This prototype does not use a server account or cloud sync.</p><button class="secondary-button" data-action="export">Export transactions · CSV</button></div></section>
      <section class="panel" style="border-color:#f0d9d4"><div class="panel-heading"><div><h2 style="color:#a95951">Delete local data</h2><p class="panel-caption">This action cannot be undone.</p></div></div><div style="padding:0 19px 19px"><p style="color:#8f7874;font-size:11px;line-height:1.6">Permanently remove transactions, accounts, budgets and goals from this browser.</p><button class="secondary-button" data-action="delete-data" style="color:#b85f56;border-color:#ecd0ca">Delete all local data</button></div></section>
    </div>`;
}

function morePage() {
  const links = [
    { page: "goals", icon: "◎", title: "Savings goals", copy: "Track the things you’re saving for." },
    { page: "accounts", icon: "▣", title: "Accounts", copy: "Manage cash, bank, card and wallet balances." },
    { page: "categories", icon: "◇", title: "Categories", copy: "Customise how you organise money." },
    { page: "settings", icon: "⚙", title: "Settings", copy: "Preferences and personal data." }
  ];
  return `${pageHeading("More", "A few more ways to make it yours.", "")}
    <section class="panel"><div class="panel-heading"><div><h2>Manage your space</h2><p class="panel-caption">Everything else, all in one place.</p></div></div><div class="more-links">${links.map((item) => `<button class="more-link" data-page-link="${item.page}"><span class="more-link-icon">${item.icon}</span><span class="more-link-copy"><strong>${item.title}</strong><small>${item.copy}</small></span><span class="more-link-arrow">›</span></button>`).join("")}</div></section>`;
}

function render() {
  const pages = { dashboard: dashboardPage, transactions: transactionPage, budgets: budgetsPage, goals: goalsPage, accounts: accountsPage, categories: categoriesPage, settings: settingsPage, more: morePage };
  const titles = { dashboard: "Dashboard", transactions: "Transactions", budgets: "Budgets", goals: "Goals", accounts: "Accounts", categories: "Categories", settings: "Settings", more: "More" };
  document.getElementById("page-content").innerHTML = pages[activePage]();
  document.getElementById("page-crumb").textContent = titles[activePage];
  document.querySelectorAll("[data-page]").forEach((button) => {
    const activeMoreSection = button.classList.contains("mobile-nav-link") && button.dataset.page === "more" && ["goals", "accounts", "categories", "settings"].includes(activePage);
    button.classList.toggle("active", button.dataset.page === activePage || activeMoreSection);
  });
  bindPageEvents();
}

function bindPageEvents() {
  document.querySelectorAll("[data-action='add-transaction']").forEach((button) => button.addEventListener("click", () => openTransactionModal()));
  document.querySelectorAll("[data-page-link]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.pageLink)));
  bindTransactionRows();
  document.querySelectorAll("[data-edit-budget]").forEach((button) => button.addEventListener("click", () => openBudgetModal(button.dataset.editBudget)));
  document.querySelectorAll("[data-action='add-budget']").forEach((button) => button.addEventListener("click", () => openBudgetModal("", button.dataset.category || "")));
  document.querySelectorAll("[data-action='copy-budgets']").forEach((button) => button.addEventListener("click", copyBudgets));
  document.querySelectorAll("[data-action='add-goal']").forEach((button) => button.addEventListener("click", () => openGoalModal()));
  document.querySelectorAll("[data-action='add-account']").forEach((button) => button.addEventListener("click", () => openAccountModal()));
  document.querySelectorAll("[data-edit-account]").forEach((button) => button.addEventListener("click", () => {
    const account = data.accounts.find((entry) => entry.id === button.dataset.editAccount);
    if (account) openAccountModal(account);
  }));
  document.querySelectorAll("[data-action='add-category']").forEach((button) => button.addEventListener("click", () => openCategoryModal()));
  document.querySelectorAll("[data-edit-category]").forEach((button) => button.addEventListener("click", () => openRenameCategoryModal(button.dataset.editCategory)));
  document.querySelectorAll("[data-toggle-category]").forEach((button) => button.addEventListener("click", () => {
    const category = data.categories.find((item) => item.name === button.dataset.toggleCategory);
    if (category) { category.hidden = !category.hidden; persist(); render(); }
  }));
  document.querySelectorAll("[data-contribute]").forEach((button) => button.addEventListener("click", () => openContributionModal(button.dataset.contribute)));
  document.querySelectorAll("[data-action='export']").forEach((button) => button.addEventListener("click", exportCsv));
  document.querySelectorAll("[data-action='delete-data']").forEach((button) => button.addEventListener("click", deleteLocalData));
  const month = document.getElementById("month-select");
  if (month) month.addEventListener("change", () => {
    const [year, monthNumber] = month.value.split("-").map(Number);
    selectedMonth = new Date(year, monthNumber - 1, 1);
    render();
  });
  const search = document.getElementById("transaction-search");
  if (search) ["input", "change"].forEach((event) => search.addEventListener(event, applyTransactionFilters));
  ["filter-type", "filter-category", "filter-account", "filter-date-from", "filter-date-to"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.addEventListener("change", applyTransactionFilters);
  });
}

function navigate(page) {
  activePage = page;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function applyTransactionFilters() {
  const search = (document.getElementById("transaction-search")?.value || "").trim().toLowerCase();
  const type = document.getElementById("filter-type")?.value || "";
  const category = document.getElementById("filter-category")?.value || "";
  const account = document.getElementById("filter-account")?.value || "";
  const dateFrom = document.getElementById("filter-date-from")?.value || "";
  const dateTo = document.getElementById("filter-date-to")?.value || "";
  const items = data.transactions.filter((item) => {
    const text = `${item.note || ""} ${item.category || ""} ${item.amount}`.toLowerCase();
    return (!search || text.includes(search)) && (!type || item.type === type) && (!category || item.category === category) && (!account || item.account === account) && (!dateFrom || item.date >= dateFrom) && (!dateTo || item.date <= dateTo);
  });
  const list = document.getElementById("transaction-list");
  if (list) list.innerHTML = transactionRows(items, undefined, true);
  bindTransactionRows();
}

function bindTransactionRows() {
  document.querySelectorAll("[data-edit-transaction]").forEach((row) => {
    const edit = () => {
      const item = data.transactions.find((transaction) => transaction.id === row.dataset.editTransaction);
      if (item) openTransactionModal(item);
    };
    row.addEventListener("click", edit);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        edit();
      }
    });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function showModal(title, subtitle, body, onReady) {
  const root = document.getElementById("modal-root");
  root.innerHTML = `<div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="modal-close" aria-label="Close dialog">×</button></div>${body}</section></div>`;
  const backdrop = root.querySelector(".modal-backdrop");
  root.querySelector(".modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeModal(); });
  document.addEventListener("keydown", handleEscape, { once: true });
  if (onReady) onReady(root);
  root.querySelector("input, select")?.focus();
}

function handleEscape(event) {
  if (event.key === "Escape") closeModal();
  else document.addEventListener("keydown", handleEscape, { once: true });
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

function deleteLocalData() {
  showModal("Delete all local data?", "This permanently clears the finance data saved in this browser.", `<p style="color:#727d74;font-size:12px;line-height:1.6">Your transactions, accounts, budgets and savings goals will be removed. This does not delete anything from a server because this demo has no server account.</p><div class="modal-actions"><button class="secondary-button" id="cancel-data-delete">Keep my data</button><button class="primary-button" id="confirm-data-delete" style="background:#b85f56">Delete my data</button></div>`, (root) => {
    root.querySelector("#cancel-data-delete").addEventListener("click", closeModal);
    root.querySelector("#confirm-data-delete").addEventListener("click", () => {
      data = {
        accounts: [],
        categories: structuredClone(defaultData.categories),
        transactions: [],
        budgets: [],
        goals: []
      };
      persist();
      closeModal();
      navigate("dashboard");
      showToast("Your local finance data was deleted.");
    });
  });
}

function todayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function accountOptions(selected = "") {
  return data.accounts.filter((account) => !account.archived || account.id === selected).map((account) => `<option value="${escapeHtml(account.id)}" ${account.id === selected ? "selected" : ""}>${escapeHtml(account.name)}${account.archived ? " (archived)" : ""}</option>`).join("");
}

function categoryOptions(type, selected = "") {
  return data.categories.filter((category) => category.kind === type && !category.hidden).map((category) => `<option value="${escapeHtml(category.name)}" ${category.name === selected ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("");
}

function openTransactionModal(transaction = null) {
  if (!data.accounts.some((account) => !account.archived)) { showToast("Add an account before recording a transaction."); navigate("accounts"); return; }
  const initialType = transaction?.type || "expense";
  const categoryType = initialType === "income" ? "income" : "expense";
  const activeAccounts = data.accounts.filter((account) => !account.archived);
  const firstAccount = activeAccounts[0];
  const secondAccount = activeAccounts.find((account) => account.id !== (transaction?.account || firstAccount.id)) || firstAccount;
  const body = `<form id="transaction-form">
    <div class="type-toggle" role="group" aria-label="Transaction type">
      ${["expense", "income", "transfer"].map((type) => `<button type="button" class="type-option ${initialType === type ? "active" : ""}" data-type-choice="${type}">${type[0].toUpperCase()}${type.slice(1)}</button>`).join("")}
    </div>
    <div class="field full" style="margin-bottom:14px"><label for="tx-amount">Amount</label><div class="amount-input-wrap"><span class="currency-prefix">₹</span><input id="tx-amount" class="amount-input" type="number" min="0.01" step="0.01" placeholder="0.00" value="${transaction ? (transaction.amount / 100).toFixed(2) : ""}" required></div></div>
    <div class="field-grid">
      <div class="field" id="tx-category-field"><label for="tx-category">Category</label><select class="field-select" id="tx-category">${categoryOptions(categoryType, transaction?.category || (categoryType === "expense" ? "Food" : "Salary"))}</select></div>
      <div class="field"><label for="tx-account">Account</label><select class="field-select" id="tx-account" required>${accountOptions(transaction?.account || firstAccount.id)}</select></div>
      <div class="field" id="tx-to-account-field" style="display:none"><label for="tx-to-account">To account</label><select class="field-select" id="tx-to-account">${accountOptions(transaction?.toAccount || secondAccount.id)}</select></div>
      <div class="field"><label for="tx-date">Date</label><input class="field-input" id="tx-date" type="date" value="${transaction?.date || todayString()}" required></div>
      <div class="field full"><label for="tx-note">Note <span style="font-weight:400;color:#9aa29b">(optional)</span></label><input class="field-input" id="tx-note" maxlength="120" placeholder="What was this for?" value="${escapeHtml(transaction?.note || "")}"></div>
    </div>
    <p class="form-error" id="tx-error" hidden></p>
    <div class="modal-actions">${transaction ? `<button type="button" class="secondary-button" id="delete-transaction" style="margin-right:auto;color:#bf6259">Delete</button>` : ""}<button type="button" class="secondary-button" id="cancel-transaction">Cancel</button><button type="submit" class="primary-button">${transaction ? "Save changes" : "Save transaction"}</button></div>
  </form>`;
  showModal(transaction ? "Edit transaction" : "Add a transaction", "Keep it simple — you can always edit this later.", body, (root) => {
    let type = initialType;
    const category = root.querySelector("#tx-category");
    const categoryField = root.querySelector("#tx-category-field");
    const toAccountField = root.querySelector("#tx-to-account-field");
    root.querySelectorAll("[data-type-choice]").forEach((button) => button.addEventListener("click", () => {
      type = button.dataset.typeChoice;
      root.querySelectorAll("[data-type-choice]").forEach((option) => option.classList.toggle("active", option === button));
      categoryField.style.display = type === "transfer" ? "none" : "grid";
      toAccountField.style.display = type === "transfer" ? "grid" : "none";
      if (type !== "transfer") category.innerHTML = categoryOptions(type, type === "income" ? "Salary" : "Food");
    }));
    root.querySelector("#cancel-transaction").addEventListener("click", closeModal);
    if (transaction) root.querySelector("#delete-transaction").addEventListener("click", () => {
      if (!window.confirm("Delete this transaction? This will update your balances and budgets.")) return;
      data.transactions = data.transactions.filter((item) => item.id !== transaction.id);
      persist(); closeModal(); render(); showToast("Transaction deleted.");
    });
    root.querySelector("#transaction-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const amountValue = Number(root.querySelector("#tx-amount").value);
      const accountId = root.querySelector("#tx-account").value;
      const toAccount = root.querySelector("#tx-to-account").value;
      const error = root.querySelector("#tx-error");
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        error.textContent = "Enter an amount greater than zero.";
        error.hidden = false;
        return;
      }
      if (type === "transfer" && (accountId === toAccount || data.accounts.length < 2)) {
        error.textContent = "Choose two different accounts for a transfer.";
        error.hidden = false;
        return;
      }
      const item = {
        id: transaction?.id || `tx-${Date.now()}`,
        type,
        amount: Math.round(amountValue * 100),
        date: root.querySelector("#tx-date").value,
        account: accountId,
        category: type === "transfer" ? "" : category.value,
        toAccount: type === "transfer" ? toAccount : "",
        note: root.querySelector("#tx-note").value.trim()
      };
      if (transaction) data.transactions = data.transactions.map((current) => current.id === transaction.id ? item : current);
      else data.transactions.push(item);
      persist(); closeModal(); render(); showToast(transaction ? "Transaction updated." : "Transaction saved.");
    });
  });
  if (initialType === "transfer") {
    const root = document.getElementById("modal-root");
    root.querySelector("#tx-category-field").style.display = "none";
    root.querySelector("#tx-to-account-field").style.display = "grid";
  }
}

function openBudgetModal(categoryName = "", selectedCategory = "") {
  const current = monthBudgets().find((item) => item.category === categoryName);
  const used = new Set(monthBudgets().map((item) => item.category));
  const available = data.categories.filter((item) => item.kind === "expense" && !item.hidden && (!used.has(item.name) || item.name === categoryName));
  const body = `<form id="budget-form"><div class="field-grid">
    <div class="field full"><label for="budget-category">Category</label><select class="field-select" id="budget-category" ${current ? "disabled" : ""}>${available.map((item) => `<option ${item.name === (categoryName || selectedCategory) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></div>
    <div class="field full"><label for="budget-limit">Monthly limit</label><input class="field-input" id="budget-limit" type="number" min="1" step="1" placeholder="e.g. 5000" value="${current ? current.limit / 100 : ""}" required></div>
    </div><p class="form-error" id="budget-error" hidden></p><div class="modal-actions"><button type="button" class="secondary-button" id="cancel-budget">Cancel</button><button type="submit" class="primary-button">Save budget</button></div></form>`;
  showModal(current ? `Edit ${escapeHtml(categoryName)} budget` : "Set a monthly budget", "Choose a limit that feels right for you.", body, (root) => {
    root.querySelector("#cancel-budget").addEventListener("click", closeModal);
    root.querySelector("#budget-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = current ? categoryName : root.querySelector("#budget-category").value;
      const limit = Number(root.querySelector("#budget-limit").value);
      if (!name || !Number.isFinite(limit) || limit <= 0) {
        const error = root.querySelector("#budget-error");
        error.textContent = "Choose a category and enter a limit greater than zero.";
        error.hidden = false;
        return;
      }
      if (current) current.limit = Math.round(limit * 100);
      else data.budgets.push({ category: name, limit: Math.round(limit * 100), month: monthKey(selectedMonth) });
      persist(); closeModal(); render(); showToast("Budget saved.");
    });
  });
}

function copyBudgets() {
  const previousMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
  const source = monthBudgets(previousMonth);
  if (!source.length) { showToast("There are no budgets to copy from last month."); return; }
  showModal("Copy last month’s budgets?", "Keep the same limits for the month you’re viewing.", `<p style="color:#727d74;font-size:12px;line-height:1.6">This replaces this month’s budgets with the ${source.length} category limits from last month.</p><div class="modal-actions"><button class="secondary-button" id="cancel-copy">Cancel</button><button class="primary-button" id="confirm-copy">Copy budgets</button></div>`, (root) => {
    root.querySelector("#cancel-copy").addEventListener("click", closeModal);
    root.querySelector("#confirm-copy").addEventListener("click", () => {
      data.budgets = data.budgets.filter((item) => item.month !== monthKey(selectedMonth));
      data.budgets.push(...source.map((item) => ({ ...item, month: monthKey(selectedMonth) })));
      persist(); closeModal(); render(); showToast("Budgets copied for this month.");
    });
  });
}

function openGoalModal() {
  const body = `<form id="goal-form"><div class="field-grid"><div class="field full"><label for="goal-name">Goal name</label><input class="field-input" id="goal-name" maxlength="50" placeholder="e.g. A new bicycle" required></div><div class="field full"><label for="goal-target">Target amount</label><input class="field-input" id="goal-target" type="number" min="1" placeholder="e.g. 50000" required></div><div class="field full"><label for="goal-date">Target date <span style="font-weight:400;color:#9aa29b">(optional)</span></label><input class="field-input" id="goal-date" type="date"></div></div><p class="form-error" id="goal-error" hidden></p><div class="modal-actions"><button type="button" class="secondary-button" id="cancel-goal">Cancel</button><button type="submit" class="primary-button">Create goal</button></div></form>`;
  showModal("A goal worth saving for", "Give your future plans a little space.", body, (root) => {
    root.querySelector("#cancel-goal").addEventListener("click", closeModal);
    root.querySelector("#goal-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = root.querySelector("#goal-name").value.trim();
      const target = Number(root.querySelector("#goal-target").value);
      if (!name || !Number.isFinite(target) || target <= 0) {
        const error = root.querySelector("#goal-error");
        error.textContent = "Enter a name and a target greater than zero.";
        error.hidden = false;
        return;
      }
      data.goals.push({ id: `goal-${Date.now()}`, name, target: Math.round(target * 100), saved: 0, date: root.querySelector("#goal-date").value, icon: "◎" });
      persist(); closeModal(); render(); showToast("Your goal is ready.");
    });
  });
}

function openContributionModal(goalId) {
  const goal = data.goals.find((item) => item.id === goalId);
  if (!goal) return;
  showModal("Add to your goal", `Add a little more to “${escapeHtml(goal.name)}”.`, `<form id="contribution-form"><div class="field"><label for="contribution-amount">Contribution amount</label><input class="field-input" id="contribution-amount" type="number" min="0.01" step="0.01" placeholder="e.g. 500" required></div><p class="form-error" id="contribution-error" hidden></p><div class="modal-actions"><button type="button" class="secondary-button" id="cancel-contribution">Cancel</button><button type="submit" class="primary-button">Add contribution</button></div></form>`, (root) => {
    root.querySelector("#cancel-contribution").addEventListener("click", closeModal);
    root.querySelector("#contribution-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const amount = Number(root.querySelector("#contribution-amount").value);
      if (!Number.isFinite(amount) || amount <= 0) {
        const error = root.querySelector("#contribution-error");
        error.textContent = "Enter an amount greater than zero.";
        error.hidden = false;
        return;
      }
      goal.saved += Math.round(amount * 100);
      persist(); closeModal(); render(); showToast("Contribution added. Nice work!");
    });
  });
}

function openAccountModal(account = null) {
  const body = `<form id="account-form"><div class="field-grid"><div class="field full"><label for="account-name">Account name</label><input class="field-input" id="account-name" maxlength="40" value="${escapeHtml(account?.name || "")}" placeholder="e.g. Main bank account" required></div><div class="field full"><label for="account-type">Account type</label><select class="field-select" id="account-type">${["Bank", "Cash", "Credit card", "Wallet"].map((type) => `<option ${type === account?.type ? "selected" : ""}>${type}</option>`).join("")}</select></div><div class="field full"><label for="account-opening">Opening balance</label><input class="field-input" id="account-opening" type="number" step="0.01" value="${account ? (account.opening / 100).toFixed(2) : "0"}" required></div></div><p class="form-error" id="account-error" hidden></p><div class="modal-actions">${account ? `<button type="button" class="secondary-button" id="archive-account" style="margin-right:auto">${account.archived ? "Restore" : "Archive"}</button>` : ""}<button type="button" class="secondary-button" id="cancel-account">Cancel</button><button type="submit" class="primary-button">${account ? "Save account" : "Add account"}</button></div></form>`;
  showModal(account ? "Edit account" : "Add an account", "Cash, bank, card or wallet — your choice.", body, (root) => {
    root.querySelector("#cancel-account").addEventListener("click", closeModal);
    if (account) root.querySelector("#archive-account").addEventListener("click", () => {
      account.archived = !account.archived;
      persist(); closeModal(); render(); showToast(account.archived ? "Account archived." : "Account restored.");
    });
    root.querySelector("#account-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = root.querySelector("#account-name").value.trim();
      const type = root.querySelector("#account-type").value;
      const opening = Number(root.querySelector("#account-opening").value);
      if (!name || !Number.isFinite(opening)) {
        const error = root.querySelector("#account-error");
        error.textContent = "Enter an account name and valid opening balance.";
        error.hidden = false;
        return;
      }
      if (account) { account.name = name; account.type = type; account.opening = Math.round(opening * 100); }
      else data.accounts.push({ id: `acc-${Date.now()}`, name, type, opening: Math.round(opening * 100) });
      persist(); closeModal(); render(); showToast("Account saved.");
    });
  });
}

function openCategoryModal() {
  const body = `<form id="category-form"><div class="field-grid"><div class="field full"><label for="category-name">Category name</label><input class="field-input" id="category-name" maxlength="30" placeholder="e.g. Pets" required></div><div class="field full"><label for="category-kind">Category type</label><select class="field-select" id="category-kind"><option value="expense">Expense</option><option value="income">Income</option></select></div><div class="field"><label for="category-icon">Icon</label><input class="field-input" id="category-icon" maxlength="4" value="◇"></div><div class="field"><label for="category-color">Colour</label><input class="field-input" id="category-color" type="color" value="#78a882" style="padding:4px"></div></div><p class="form-error" id="category-error" hidden></p><div class="modal-actions"><button type="button" class="secondary-button" id="cancel-category">Cancel</button><button type="submit" class="primary-button">Add category</button></div></form>`;
  showModal("Create a category", "Make it yours — categories keep things organised.", body, (root) => {
    root.querySelector("#cancel-category").addEventListener("click", closeModal);
    root.querySelector("#category-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = root.querySelector("#category-name").value.trim();
      if (!name || data.categories.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        const error = root.querySelector("#category-error");
        error.textContent = name ? "That category already exists." : "Enter a category name.";
        error.hidden = false;
        return;
      }
      const kind = root.querySelector("#category-kind").value;
      data.categories.push({ name, kind, icon: root.querySelector("#category-icon").value.trim() || "◇", color: root.querySelector("#category-color").value, hidden: false });
      persist(); closeModal(); render(); showToast("Category added.");
    });
  });
}

function openRenameCategoryModal(categoryName) {
  const category = data.categories.find((item) => item.name === categoryName);
  if (!category) return;
  const body = `<form id="rename-category-form"><div class="field"><label for="renamed-category">Category name</label><input class="field-input" id="renamed-category" maxlength="30" value="${escapeHtml(category.name)}" required></div><p class="form-error" id="rename-category-error" hidden></p><div class="modal-actions"><button type="button" class="secondary-button" id="cancel-rename">Cancel</button><button type="submit" class="primary-button">Save category</button></div></form>`;
  showModal("Rename category", "Your existing transactions and budgets will be updated.", body, (root) => {
    root.querySelector("#cancel-rename").addEventListener("click", closeModal);
    root.querySelector("#rename-category-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const newName = root.querySelector("#renamed-category").value.trim();
      if (!newName || data.categories.some((item) => item !== category && item.name.toLowerCase() === newName.toLowerCase())) {
        const error = root.querySelector("#rename-category-error");
        error.textContent = newName ? "That category already exists." : "Enter a category name.";
        error.hidden = false;
        return;
      }
      data.transactions.forEach((item) => { if (item.category === categoryName) item.category = newName; });
      data.budgets.forEach((item) => { if (item.category === categoryName) item.category = newName; });
      category.name = newName;
      persist(); closeModal(); render(); showToast("Category renamed.");
    });
  });
}

function exportCsv() {
  const dateFrom = document.getElementById("filter-date-from")?.value || "";
  const dateTo = document.getElementById("filter-date-to")?.value || "";
  const rows = [["Date", "Type", "Amount (INR)", "Category", "Account", "To account", "Note"]];
  data.transactions.filter((item) => (!dateFrom || item.date >= dateFrom) && (!dateTo || item.date <= dateTo)).forEach((item) => {
    const account = data.accounts.find((entry) => entry.id === item.account);
    const toAccount = data.accounts.find((entry) => entry.id === item.toAccount);
    rows.push([item.date, item.type, (item.amount / 100).toFixed(2), item.category || "", account?.name || "", toAccount?.name || "", item.note || ""]);
  });
  const csv = rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = dateFrom || dateTo ? `pennywise-transactions-${dateFrom || "start"}-to-${dateTo || "end"}.csv` : "pennywise-transactions.csv";
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Your CSV is ready.");
}

document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.page)));
document.getElementById("quick-add").addEventListener("click", () => openTransactionModal());
document.querySelector(".mobile-add").addEventListener("click", () => openTransactionModal());
document.querySelector(".profile-button").addEventListener("click", () => showToast("Profile settings are coming soon."));
document.querySelector(".notification-button").addEventListener("click", () => showToast("You’re all caught up."));
render();
