const STORAGE_KEY = "subshield_subscriptions";

let subscriptions = [];
let costChart = null;

document.addEventListener("DOMContentLoaded", () => {
  loadSubscriptions();
  bindForm();
  renderAll();
});

function bindForm() {
  const form = document.getElementById("subscription-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = document.getElementById("service-name");
    const costInput = document.getElementById("monthly-cost");
    const renewalInput = document.getElementById("next-renewal");

    const name = nameInput.value.trim();
    const monthlyCost = parseFloat(costInput.value);
    const nextRenewalRaw = renewalInput.value;

    if (!name || isNaN(monthlyCost) || !nextRenewalRaw) {
      return;
    }

    if (monthlyCost < 0) {
      alert("Monthly cost must be zero or greater.");
      return;
    }

    const subscription = {
      id: Date.now().toString(),
      name,
      monthlyCost,
      nextRenewal: nextRenewalRaw,
      createdAt: new Date().toISOString(),
    };

    subscriptions.push(subscription);
    saveSubscriptions();
    renderAll();

    form.reset();
  });
}

function loadSubscriptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      subscriptions = [];
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      subscriptions = parsed;
    } else {
      subscriptions = [];
    }
  } catch (error) {
    console.error("Failed to load subscriptions from localStorage:", error);
    subscriptions = [];
  }
}

function saveSubscriptions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (error) {
    console.error("Failed to save subscriptions to localStorage:", error);
  }
}

/**
 * Calculate the next renewal date and remaining days based on current date.
 *
 * - If the stored next renewal date is in the past, this function will
 *   add months until the date falls in the future, so monthly renewals
 *   always roll forward correctly.
 */
function calculateNextRenewal(nextRenewalISO) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!nextRenewalISO) {
    return {
      nextDateISO: "",
      daysRemaining: NaN,
    };
  }

  let next = new Date(nextRenewalISO);
  if (isNaN(next.getTime())) {
    return {
      nextDateISO: "",
      daysRemaining: NaN,
    };
  }

  next.setHours(0, 0, 0, 0);

  while (next < today) {
    next.setMonth(next.getMonth() + 1);
  }

  const diffMs = next.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const nextDateISO = next.toISOString().slice(0, 10);

  return {
    nextDateISO,
    daysRemaining,
  };
}

function renderAll() {
  renderSubscriptions();
  renderSummary();
  renderChart();
}

function renderSubscriptions() {
  const container = document.getElementById("subscriptions-container");
  const emptyState = document.getElementById("empty-state");
  const countBadge = document.getElementById("subscription-count");

  if (!container) return;

  container.innerHTML = "";

  if (!subscriptions.length) {
    if (emptyState) {
      emptyState.style.display = "block";
      emptyState.setAttribute("aria-hidden", "false");
    }
    if (countBadge) {
      countBadge.textContent = "0 active";
    }
    return;
  }

  if (emptyState) {
    emptyState.style.display = "none";
    emptyState.setAttribute("aria-hidden", "true");
  }

  if (countBadge) {
    countBadge.textContent = `${subscriptions.length} active`;
  }

  const fragment = document.createDocumentFragment();

  subscriptions
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((sub) => {
      const { nextDateISO, daysRemaining } = calculateNextRenewal(sub.nextRenewal);

      if (nextDateISO && nextDateISO !== sub.nextRenewal) {
        sub.nextRenewal = nextDateISO;
        saveSubscriptions();
      }

      const card = document.createElement("article");
      card.className = "subscription-card";

      const isAlert = Number.isFinite(daysRemaining) && daysRemaining <= 2;
      if (isAlert) {
        card.classList.add("alert");
      }

      const safeDays = Number.isFinite(daysRemaining) ? daysRemaining : 0;
      const clampedDays = Math.max(0, Math.min(safeDays, 30));
      const progressPercent = ((30 - clampedDays) / 30) * 100;

      const formattedCost = formatCurrency(sub.monthlyCost);
      const displayDays =
        !Number.isFinite(daysRemaining) ? "N/A" : daysRemaining === 0 ? "Today" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;

      card.innerHTML = `
        <div class="subscription-main">
          <p class="subscription-name">${escapeHtml(sub.name)}</p>
          <p class="subscription-cost">${formattedCost} / month</p>
        </div>
        <div class="subscription-meta">
          <span class="meta-label">Next renewal</span>
          <span class="meta-value">${nextDateISO || "Not set"}</span>
          <span class="meta-label" style="margin-top:6px;">Days remaining</span>
          <span class="days-remaining ${isAlert ? "days-remaining-soon" : ""}">${displayDays}</span>
          <div class="days-progress-track" aria-hidden="true">
            <div class="days-progress-fill" style="width:${progressPercent}%;"></div>
          </div>
        </div>
        <div class="subscription-actions">
          <button class="btn-delete" data-id="${sub.id}" type="button">Delete</button>
          ${isAlert ? '<span class="alert-badge">Due soon</span>' : ""}
        </div>
      `;

      fragment.appendChild(card);
    });

  container.appendChild(fragment);

  container.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const id = event.currentTarget.getAttribute("data-id");
      if (!id) return;

      const confirmed = window.confirm("Are you sure you want to delete this subscription?");
      if (!confirmed) {
        return;
      }

      subscriptions = subscriptions.filter((sub) => sub.id !== id);
      saveSubscriptions();
      renderAll();
    });
  });
}

function renderSummary() {
  const totalMonthlyEl = document.getElementById("total-monthly");
  const totalAnnualEl = document.getElementById("total-annual");

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + (sub.monthlyCost || 0), 0);
  const totalAnnual = totalMonthly * 12;

  if (totalMonthlyEl) {
    totalMonthlyEl.textContent = `${formatCurrency(totalMonthly)} CAD`;
  }
  if (totalAnnualEl) {
    totalAnnualEl.textContent = `${formatCurrency(totalAnnual)} CAD`;
  }
}

function renderChart() {
  const ctx = document.getElementById("cost-distribution-chart");
  if (!ctx) return;

  if (!subscriptions.length) {
    if (costChart) {
      costChart.destroy();
      costChart = null;
    }
    return;
  }

  const labels = subscriptions.map((sub) => sub.name);
  const data = subscriptions.map((sub) => sub.monthlyCost);

  const baseColors = [
    "rgba(255, 215, 0, 0.8)",
    "rgba(255, 255, 255, 0.8)",
    "rgba(135, 206, 250, 0.8)",
    "rgba(144, 238, 144, 0.8)",
    "rgba(255, 160, 122, 0.8)",
    "rgba(221, 160, 221, 0.8)",
  ];

  const backgroundColors = data.map((_, index) => baseColors[index % baseColors.length]);
  const borderColors = data.map(() => "#000000");

  const chartConfig = {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#ffffff",
            font: {
              size: 12,
              family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || "";
              const value = context.parsed || 0;
              return `${label}: ${formatCurrency(value)} CAD / month`;
            },
          },
        },
      },
      cutout: "60%",
    },
  };

  if (costChart) {
    costChart.data = chartConfig.data;
    costChart.update();
  } else {
    costChart = new Chart(ctx, chartConfig);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount || 0)
    .replace("CA$", "$");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * The alert system currently highlights cards when a renewal is due soon.
 *
 * To expand this in the future for email integration:
 * - You could send the calculated `nextDateISO` and `daysRemaining` values
 *   to a backend service whenever they cross a threshold (e.g., <= 2 days).
 * - That backend could queue and send notification emails via an email
 *   provider (such as SendGrid, AWS SES, etc.) on your behalf.
 * - This file would then only be responsible for calling a small
 *   `notifyUpcomingRenewal(subscription)` function that performs the
 *   network request, keeping the UI logic clean.
 */
