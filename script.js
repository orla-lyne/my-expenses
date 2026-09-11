
const STORAGE_KEY = "expenseTracker.transactions";

let historyLog = loadTransactions();

const canvas = document.getElementById("pieChart");
const ctx = canvas.getContext("2d");
const legend = document.getElementById("legend");
const chartPanel = document.getElementById("chartPanel");
const incView = document.getElementById("totalIncome");
const expView = document.getElementById("totalExpenses");
const balView = document.getElementById("totalBalance");
const balCard = document.getElementById("balanceCard");
const txForm = document.getElementById("txForm");
const historyList = document.getElementById("historyList");

function fmt(val) {
    const absStr = Math.abs(val).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return val < 0 ? `-$${absStr}` : `$${absStr}`;
}

function makeId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function loadTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (tx) =>
                tx &&
                typeof tx.desc === "string" &&
                typeof tx.amount === "number" &&
                (tx.type === "income" || tx.type === "expense")
        ).map((tx) => ({ ...tx, id: tx.id || makeId() }));
    } catch (err) {
        console.warn("Could not load saved transactions:", err);
        return [];
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historyLog));
    } catch (err) {
        console.warn("Could not save transactions:", err);
    }
}

function renderHistory() {
    historyList.innerHTML = "";

    if (historyLog.length === 0) {
        const li = document.createElement("li");
        li.className = "history-item";
        li.style.color = "#94a3b8";
        li.textContent = "No transactions added yet.";
        historyList.appendChild(li);
        return;
    }

    [...historyLog].reverse().forEach((tx) => {
        const li = document.createElement("li");
        li.className = `history-item ${tx.type}`;
        li.dataset.id = tx.id;

        const descSpan = document.createElement("span");
        descSpan.className = "item-desc";
        descSpan.textContent = tx.desc; 

        const right = document.createElement("div");
        right.className = "item-right";

        const amtSpan = document.createElement("span");
        amtSpan.className = "item-amt";
        amtSpan.textContent = `${tx.type === "income" ? "+" : "-"}${fmt(tx.amount)}`;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "delete-btn";
        delBtn.dataset.action = "delete";
        delBtn.dataset.id = tx.id;
        delBtn.setAttribute("aria-label", `Delete transaction: ${tx.desc}`);
        delBtn.textContent = "×";

        right.append(amtSpan, delBtn);
        li.append(descSpan, right);
        historyList.appendChild(li);
    });
}

function renderLegend(data, volume) {
    legend.innerHTML = "";
    data.forEach((slice) => {
        if (slice.value === 0) return;
        const li = document.createElement("li");
        li.className = "legend-item";

        const box = document.createElement("span");
        box.className = "color-box";
        box.style.background = slice.color;

        const label = document.createElement("span");
        label.textContent = slice.label;

        const val = document.createElement("span");
        val.className = "val-label";
        val.textContent = `${fmt(slice.value)} (${((slice.value / volume) * 100).toFixed(1)}%)`;

        li.append(box, label, val);
        legend.appendChild(li);
    });
}

function renderChart(totalIncome, totalExpenses) {
    const volume = totalIncome + totalExpenses;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    legend.innerHTML = "";

    if (volume === 0) {
        chartPanel.classList.add("empty");
        return;
    }
    chartPanel.classList.remove("empty");

    const data = [
        { label: "Total Income", value: totalIncome, color: "#10b981" },
        { label: "Total Expenses", value: totalExpenses, color: "#ef4444" },
    ];

    let startAngle = 0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 10;

    data.forEach((slice) => {
        if (slice.value === 0) return;
        const angle = (slice.value / volume) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + angle);
        ctx.closePath();
        ctx.fillStyle = slice.color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        startAngle += angle;
    });

    renderLegend(data, volume);
}

function updateUI() {
    const { income, expenses } = historyLog.reduce(
        (acc, tx) => {
            if (tx.type === "income") acc.income += tx.amount;
            else acc.expenses += tx.amount;
            return acc;
        },
        { income: 0, expenses: 0 }
    );

    const balance = income - expenses;

    incView.textContent = fmt(income);
    expView.textContent = fmt(expenses);
    balView.textContent = fmt(balance);

    balCard.className =
        "card balance " +
        (balance > 0 ? "positive" : balance < 0 ? "negative" : "");

    renderHistory();
    renderChart(income, expenses);

    saveTransactions(); 
}

txForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const desc = document.getElementById("desc").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;

    if (!desc || !Number.isFinite(amount) || amount <= 0) return;
    if (type !== "income" && type !== "expense") return;

    historyLog.push({ id: makeId(), desc, amount, type });
    updateUI();
    txForm.reset();
    document.getElementById("desc").focus();
});

historyList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='delete']");
    if (!btn) return;

    const id = btn.dataset.id;
    historyLog = historyLog.filter((tx) => tx.id !== id);
    updateUI();
});


updateUI();