# 💰 My Expense Tracker

[![GitHub License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Supabase Backend](https://img.shields.io/badge/Backend-Supabase-green.svg)](https://supabase.com)
[![Chart.js Analytics](https://img.shields.io/badge/Charts-Chart.js-orange.svg)](https://www.chartjs.org)

**My Expense Tracker** is a production-quality, responsive, and mobile-first personal finance management web application. It is designed to run securely using HTML, CSS, JavaScript, Chart.js, and Supabase.

The user interface uses a bright, premium light theme with glassmorphism effects and implements a native-like mobile aspect ratio (making it perfect for daily phone use) while remaining centered as a mock frame on desktop screens.

---

## 🚀 Key Features

* 🔐 **Secure Authentication**: Email sign-up, sign-in, session persistence, and secure route guards.
* 📊 **Dynamic Dashboard**: Real-time calculations of total net balance, income, expenses, savings rate, and account-specific balances (e.g. Bank, Jio Payments, Cash).
* 📝 **Transaction Manager**: Advanced search and filtering (type, source, category, date ranges) with full CRUD operations (Add, Edit, Duplicate, and Delete).
* 📈 **10 Visual Reports**: Real-time analytics driven by Chart.js (Daily, Weekly, Monthly, Quarterly, Yearly, Categories, Accounts, Income, Expense, and Savings trends).
* 🎯 **Monthly Budget Planner**: Visual progress indicators (green ➔ yellow ➔ red) comparing category spending limits against actual transactions.
* 🎨 **Custom Categories**: Add, customize, and delete categories with a dynamic color picker and preset icons.
* 📥 **Import & Export**:
  * Export lists to CSV, UTF-8 encoded Excel files, or a printer-friendly layout for PDF.
  * Import CSV files with options to Merge or Replace existing database records.
* 🛡️ **Row Level Security (RLS)**: Enforced database rules ensuring users can only access their own data.
* ⚙️ **Personalization Settings**: Customize app-wide accent colors, manage preset avatars, toggle notifications, and download/restore full database JSON backups.

---

## 🛠️ Step-by-Step Installation

### Step 1: Set Up Your Supabase Backend
1. Create a free account at [Supabase](https://supabase.com) and set up a new project (e.g., `My Expense Tracker`).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Click **New Query**, copy the contents of the database schema file [schema.sql](file:///d:/Expense%20Tracker/schema.sql), paste it into the editor, and click **Run**.
   > [!NOTE]
   > This will create all required tables (`profiles`, `categories`, `transactions`, `budgets`), setup Row Level Security (RLS) rules, trigger audits, and performance indexes.

### Step 2: Retrieve API Credentials
1. In the Supabase project dashboard, navigate to **Project Settings** (gear icon) ➔ **API**.
2. Locate and copy the:
   * **Project URL**
   * **API Key** (specifically the `anon public` key)

### Step 3: Run the Application Locally
1. Run a simple local web server in the project folder:
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Or using Node
   npx serve -l 8080
   ```
2. Open your browser and navigate to `http://localhost:8080`.
3. When the application loads for the first time, a connection prompt overlay will appear. Enter your **Supabase URL** and **Supabase Anon Key** and click **Connect Database**.
4. Create a new account in **Register here** or sign in to start tracking!

---

## ⚙️ Project Structure

```
d:\Expense Tracker\
├── index.html            # Main Entry Point & Session Gatekeeper
├── login.html            # Authentication Login Interface
├── register.html         # User Registration Interface
├── dashboard.html        # Main Financial Summary & Metric Cards
├── transactions.html     # CRUD Transaction List, Filters, & Import/Export
├── reports.html          # Dynamic Canvas Charts & Real-time Metrics (Chart.js)
├── settings.html         # Category Settings, Budget limits, Backup/Restore
├── profile.html          # Profile edits, custom Avatar Presets, Currency settings
├── schema.sql            # Supabase PostgreSQL tables & security rules
├── css/
│   └── style.css         # Custom layout stylesheets & glassmorphism variables
└── js/
    ├── supabase-config.js # Supabase connection initializer & config overlay
    ├── auth.js           # Auth workflows (signup, login, resets) & route guard
    ├── database.js       # Supabase CRUD calls
    ├── charts.js         # Chart.js graphing algorithms
    └── ui.js             # General toasts, dialogs, quick-add modal, and shortcuts
```

---

## ⌨️ Desktop Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **`Alt + N`** | Quick-open Add Transaction modal |
| **`Escape`** | Close any active modal overlay |
| **`Alt + D`** | Jump to Dashboard (Home) |
| **`Alt + T`** | Jump to Transaction List |
| **`Alt + R`** | Jump to Reports |
| **`Alt + S`** | Jump to Settings |
| **`Alt + P`** | Jump to Profile |

---

## 📱 Mobile Swipe Gestures
You can swipe horizontally to navigate between pages:
* **Swipe Left**: Go to next tab (Home ➔ List ➔ Reports ➔ Settings ➔ Profile).
* **Swipe Right**: Go to previous tab.
*(Note: Swipe gestures ignore touches on inputs, select dropdowns, and charts to prevent scrolling interference).*
