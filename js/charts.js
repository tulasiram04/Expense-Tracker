// Charting module using Chart.js for reports and dashboard pages

let chartInstances = {};

// Clean up chart instance if it exists to prevent canvas redraw errors
function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// Generate beautiful, soft colors for charts based on category name or index
const CHART_COLORS = [
  '#2563EB', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#14B8A6', '#6366F1', '#F97316',
  '#78716C', '#4F46E5', '#0D9488', '#EA580C', '#E2E8F0'
];

// Helper to format currency values in labels
function formatVal(val, currency = '?') {
  return currency + ' ' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// =========================================================================
// 1. DASHBOARD SUMMARY CHARTS
// =========================================================================

export function renderDashboardCharts(transactions, currency = '?') {
  if (!transactions || transactions.length === 0) return;

  // Render Income vs Expense Doughnut
  renderIncomeVsExpenseDoughnut('db-inc-exp-chart', transactions, currency);

  // Render Expense by Category Pie
  renderCategoryDoughnut('db-category-chart', transactions, currency);
}

// =========================================================================
// 2. REPORTS SUITE (10 CHARTS)
// =========================================================================

// 1. Income vs Expense
export function renderIncomeVsExpenseDoughnut(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  let income = 0;
  let expense = 0;

  transactions.forEach(tx => {
    if (tx.type === 'income') income += parseFloat(tx.amount);
    else expense += parseFloat(tx.amount);
  });

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#22C55E', '#EF4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans' } } },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${formatVal(context.raw, currency)}`
          }
        }
      },
      cutout: '65%'
    }
  });
}

// 2. Expense by Category
export function renderCategoryDoughnut(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const expenses = transactions.filter(t => t.type === 'expense');
  const catTotals = {};

  expenses.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount);
  });

  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: CHART_COLORS.slice(0, labels.length + 1),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          ticks: { display: false }
        }
      },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, family: 'Plus Jakarta Sans' } } },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 3. Monthly Expense Trend
export function renderMonthlyExpenseTrend(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const expenses = transactions.filter(t => t.type === 'expense');
  const monthlyTotals = {};

  // Group by 'YYYY-MM'
  expenses.forEach(t => {
    const month = t.date.substring(0, 7); // '2026-07'
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(t.amount);
  });

  const sortedMonths = Object.keys(monthlyTotals).sort();
  const data = sortedMonths.map(m => monthlyTotals[m]);
  const monthLabels = sortedMonths.map(m => {
    const [year, monthNum] = m.split('-');
    const dateObj = new Date(year, parseInt(monthNum) - 1, 1);
    return dateObj.toLocaleString('default', { month: 'short' }) + ' ' + year.substring(2);
  });

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthLabels.length ? monthLabels : ['No Data'],
      datasets: [{
        label: 'Monthly Expense',
        data: data.length ? data : [0],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointBackgroundColor: '#2563EB'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: '#E2E8F0' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Spent: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 4. Daily Expense Trend
export function renderDailyExpenseTrend(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const expenses = transactions.filter(t => t.type === 'expense');
  const dailyTotals = {};

  expenses.forEach(t => {
    dailyTotals[t.date] = (dailyTotals[t.date] || 0) + parseFloat(t.amount);
  });

  // Take the last 10 days that have transactions for clean layout
  const sortedDates = Object.keys(dailyTotals).sort().slice(-10);
  const data = sortedDates.map(d => dailyTotals[d]);
  const dateLabels = sortedDates.map(d => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`; // DD/MM
  });

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dateLabels.length ? dateLabels : ['No Data'],
      datasets: [{
        label: 'Daily Spending',
        data: data.length ? data : [0],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#EF4444'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: '#E2E8F0' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Spent: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 5. Expense by Account Source
export function renderSourcePie(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const expenses = transactions.filter(t => t.type === 'expense');
  const sourceTotals = {};

  expenses.forEach(t => {
    sourceTotals[t.source] = (sourceTotals[t.source] || 0) + parseFloat(t.amount);
  });

  const labels = Object.keys(sourceTotals);
  const data = Object.values(sourceTotals);
  
  // Custom colors for sources
  const sourceColors = labels.map(label => {
    if (label.toLowerCase().includes('iob')) return '#1E40AF'; // IOB blue
    if (label.toLowerCase().includes('jio')) return '#BE185D'; // Jio pink
    if (label.toLowerCase().includes('cash')) return '#059669'; // Cash green
    return '#64748B'; // Default slate
  });

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: sourceColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans' } } },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 6. Monthly Savings (Income - Expense)
export function renderMonthlySavings(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const savingsData = {};

  transactions.forEach(t => {
    const month = t.date.substring(0, 7); // 'YYYY-MM'
    if (!savingsData[month]) {
      savingsData[month] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      savingsData[month].income += parseFloat(t.amount);
    } else {
      savingsData[month].expense += parseFloat(t.amount);
    }
  });

  const sortedMonths = Object.keys(savingsData).sort();
  const savings = sortedMonths.map(m => savingsData[m].income - savingsData[m].expense);
  const monthLabels = sortedMonths.map(m => {
    const [year, monthNum] = m.split('-');
    const dateObj = new Date(year, parseInt(monthNum) - 1, 1);
    return dateObj.toLocaleString('default', { month: 'short' }) + ' ' + year.substring(2);
  });

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthLabels.length ? monthLabels : ['No Data'],
      datasets: [{
        label: 'Net Savings',
        data: savings.length ? savings : [0],
        backgroundColor: savings.map(s => s >= 0 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)'),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: '#E2E8F0' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Savings: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 7. Weekly Spending
export function renderWeeklySpending(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  // Group by day of week (Monday to Sunday) for current week
  const today = new Date();
  const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  
  // Calculate start of current week (Monday)
  const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);
  monday.setHours(0,0,0,0);

  const expenses = transactions.filter(t => t.type === 'expense');
  
  expenses.forEach(t => {
    const txDate = new Date(t.date);
    if (txDate >= monday) {
      let dayIndex = txDate.getDay() - 1; // 0 = Mon, 6 = Sun
      if (dayIndex === -1) dayIndex = 6; // Sunday
      dayOfWeekTotals[dayIndex] += parseFloat(t.amount);
    }
  });

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Spent This Week',
        data: dayOfWeekTotals,
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: '#E2E8F0' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Spent: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 8. Top Categories by Total Expense
export function renderTopCategoriesHorizontal(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const expenses = transactions.filter(t => t.type === 'expense');
  const catTotals = {};

  expenses.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount);
  });

  // Sort and take top 5
  const topCategories = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const labels = topCategories.map(c => c[0]);
  const data = topCategories.map(c => c[1]);

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [{
        data: data.length ? data : [0],
        backgroundColor: CHART_COLORS.slice(2, 7),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: '#E2E8F0' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        y: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Spent: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 9. Cash Flow over Time (Cumulative Balance Trend)
export function renderCashFlow(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  // Sort transactions chronologically
  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const cashFlowPoints = [];
  const dateLabels = [];
  let runningBalance = 0;

  sortedTxs.forEach(tx => {
    if (tx.type === 'income') runningBalance += parseFloat(tx.amount);
    else runningBalance -= parseFloat(tx.amount);

    cashFlowPoints.push(runningBalance);
    
    const parts = tx.date.split('-');
    dateLabels.push(`${parts[2]}/${parts[1]}`); // DD/MM
  });

  // Cap density to max 12 points for display
  let filteredLabels = dateLabels;
  let filteredData = cashFlowPoints;
  if (cashFlowPoints.length > 12) {
    const step = Math.ceil(cashFlowPoints.length / 12);
    filteredLabels = dateLabels.filter((_, idx) => idx % step === 0);
    filteredData = cashFlowPoints.filter((_, idx) => idx % step === 0);
  }

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredLabels.length ? filteredLabels : ['No Data'],
      datasets: [{
        label: 'Running Balance',
        data: filteredData.length ? filteredData : [0],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.25,
        borderWidth: 2.5,
        pointBackgroundColor: '#10B981'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: '#E2E8F0' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Balance: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}

// 10. Yearly Comparison
export function renderYearlyComparison(canvasId, transactions, currency = '?') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  destroyChart(canvasId);

  const yearlyTotals = {};

  transactions.forEach(t => {
    const year = t.date.substring(0, 4); // 'YYYY'
    if (!yearlyTotals[year]) {
      yearlyTotals[year] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      yearlyTotals[year].income += parseFloat(t.amount);
    } else {
      yearlyTotals[year].expense += parseFloat(t.amount);
    }
  });

  const years = Object.keys(yearlyTotals).sort();
  const incomes = years.map(y => yearlyTotals[y].income);
  const expenses = years.map(y => yearlyTotals[y].expense);

  const ctx = canvas.getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years.length ? years : ['No Data'],
      datasets: [
        {
          label: 'Total Income',
          data: incomes.length ? incomes : [0],
          backgroundColor: '#22C55E',
          borderRadius: 4
        },
        {
          label: 'Total Expense',
          data: expenses.length ? expenses : [0],
          backgroundColor: '#EF4444',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: '#E2E8F0' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans' } } },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${formatVal(context.raw, currency)}`
          }
        }
      }
    }
  });
}
