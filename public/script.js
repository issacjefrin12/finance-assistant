// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCvfET1QGXzjpmyAqz0IZneLIIC_7vEKxU",
  authDomain: "finance-aassistant.firebaseapp.com",
  projectId: "finance-aassistant",
  storageBucket: "finance-aassistant.firebasestorage.app",
  messagingSenderId: "1024097692473",
  appId: "1:1024097692473:web:5ab2c600eb1e7f35c196e8",
  measurementId: "G-SPEM5YM75R"
};
let userId = null;

async function signup() {
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  if (!username || !password) return alert('Please enter both username and password');

  try {
    document.getElementById('status').textContent = '⏳ Signing up...';
    const res = await fetch('http://localhost:5000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    alert(data.message || data.error);
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('status').textContent = '';
  } catch (err) {
    alert('Signup failed: ' + err.message);
    document.getElementById('status').textContent = '';
  }
}

async function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!username || !password) return alert('Please enter both username and password');

  try {
    document.getElementById('status').textContent = '⏳ Logging in...';
    const res = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    alert(data.message || data.error);

    if (data.message === 'Login successful') {
      const userRes = await fetch(`http://localhost:5000/auth/find/${username}`);
      const userData = await userRes.json();

      if (userData._id) {
        userId = userData._id;
        document.getElementById('status').textContent = `✅ Logged in as ${username} (ID: ${userId})`;
        console.log('✅ Logged in as:', userId);
        fetchTransactions();
      } else {
        alert('Failed to fetch user ID');
        document.getElementById('status').textContent = '';
      }
    } else {
      document.getElementById('status').textContent = '';
    }

    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  } catch (err) {
    alert('Login failed: ' + err.message);
    document.getElementById('status').textContent = '';
  }
}

async function addTransaction() {
  if (!userId) return alert('Please log in first');
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value.trim();
  const note = document.getElementById('note').value.trim();
  const type = document.getElementById('type').value;

  if (!amount || !category || !type) return alert('Please fill in all required fields');

  try {
    const res = await fetch('http://localhost:5000/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, amount, category, note })
    });

    const data = await res.json();
    alert(data.message || data.error);

    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
    document.getElementById('note').value = '';
    document.getElementById('type').value = 'income';

    fetchTransactions();
  } catch (err) {
    alert('Transaction failed: ' + err.message);
  }
}

async function fetchTransactions() {
  if (!userId) return;

  const filter = document.getElementById('filter-type')?.value || 'all';

  try {
    const res = await fetch(`http://localhost:5000/transactions/${userId}`);
    const data = await res.json();

    const list = document.getElementById('transaction-list');
    const summary = document.getElementById('summary');

    if (!Array.isArray(data)) {
      list.innerHTML = '⚠️ Failed to load transactions';
      summary.innerHTML = '';
      return;
    }

    const filtered = filter === 'all' ? data : data.filter(tx => tx.type === filter);

    if (filtered.length === 0) {
      list.innerHTML = 'No transactions found for selected filter.';
      summary.innerHTML = '';
      return;
    }

    list.innerHTML = filtered.map(tx => `
      <div class="transaction">
        <strong>${tx.type.toUpperCase()}</strong>: ₹${tx.amount} - ${tx.category}
        <br><em>${tx.note || ''}</em> | ${new Date(tx.createdAt).toLocaleString()}
      </div>
    `).join('');

    let incomeTotal = 0;
    let expenseTotal = 0;

    filtered.forEach(tx => {
      if (tx.type === 'income') incomeTotal += Number(tx.amount);
      else if (tx.type === 'expense') expenseTotal += Number(tx.amount);
    });

    summary.innerHTML = `
      <p>💸 Total Income: ₹${incomeTotal}</p>
      <p>🧾 Total Expense: ₹${expenseTotal}</p>
      <p>📊 Balance: ₹${incomeTotal - expenseTotal}</p>
    `;

    // ✅ Chart rendering
    const canvas = document.getElementById('finance-chart');
    if (!canvas) {
      console.warn('⚠️ Chart canvas not found.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (window.financeChart) window.financeChart.destroy();

    window.financeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [{
          label: '₹ Amount',
          data: [incomeTotal, expenseTotal],
          backgroundColor: ['#27ae60', '#c0392b']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Income vs Expense'
          }
        }
      }
    });

  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    document.getElementById('transaction-list').innerHTML = '❌ Error loading transactions';
    document.getElementById('summary').innerHTML = '';
  }
}
// 🧮 Category totals
const categoryTotals = {};
filtered.forEach(tx => {
  const key = tx.category || 'Uncategorized';
  categoryTotals[key] = (categoryTotals[key] || 0) + Number(tx.amount);
});

const categoryLabels = Object.keys(categoryTotals);
const categoryValues = Object.values(categoryTotals);
const categoryColors = categoryLabels.map((_, i) =>
  `hsl(${(i * 60) % 360}, 70%, 60%)`
);

// 🥧 Render pie chart
const pieCanvas = document.getElementById('category-chart');
if (!pieCanvas) {
  console.warn('⚠️ Category chart canvas not found.');
  return;
}

const pieCtx = pieCanvas.getContext('2d');
if (window.categoryChart) window.categoryChart.destroy();

window.categoryChart = new Chart(pieCtx, {
  type: 'pie',
  data: {
    labels: categoryLabels,
    datasets: [{
      data: categoryValues,
      backgroundColor: categoryColors
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Breakdown by Category (${filter})`
      }
    }
  }
});