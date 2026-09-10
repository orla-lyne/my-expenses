let totalIncome = 0, totalExpenses = 0;
const historyLog = [];

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
    const absStr = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-$${absStr}` : `$${absStr}`;
}

function updateUI() {
    const balance = totalIncome - totalExpenses;
    const volume = totalIncome + totalExpenses;

    incView.textContent = fmt(totalIncome);
    expView.textContent = fmt(totalExpenses);
    balView.textContent = fmt(balance);

    balCard.className = "card balance " + (balance > 0 ? "positive" : balance < 0 ? "negative" : "");

    historyList.innerHTML = historyLog.length === 0 ? 
        `<li class="history-item" style="color:#94a3b8">No transactions added yet.</li>` : 
        historyLog.slice().reverse().map(tx => `
            <li class="history-item ${tx.type}">
                <span>${tx.desc}</span>
                <span class="item-amt">${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}</span>
            </li>
        `).join('');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    legend.innerHTML = "";

    if (volume === 0) {
        chartPanel.classList.add("empty");
        return;
    } else {
        chartPanel.classList.remove("empty");
    }

    const data = [
        { label: "Total Income", value: totalIncome, color: "#10b981" },
        { label: "Total Expenses", value: totalExpenses, color: "#ef4444" }
    ];

    let startAngle = 0;
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 10;

    data.forEach(slice => {
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

        const li = document.createElement("li");
        li.className = "legend-item";
        li.innerHTML = `
            <span class="color-box" style="background:${slice.color}"></span>
            <span>${slice.label}</span>
            <span class="val-label">${fmt(slice.value)} (${((slice.value / volume) * 100).toFixed(1)}%)</span>
        `;
        legend.appendChild(li);
    });
}

txForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const desc = document.getElementById("desc").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;

    if (type === "income") totalIncome += amount;
    else totalExpenses += amount;

    historyLog.push({ desc, amount, type });
    updateUI();
    txForm.reset();
});

updateUI();
