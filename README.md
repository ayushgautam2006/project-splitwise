# SplitWise Clone 💸

A fast, modern, single-page expense splitting application. No logins, no database required — everything runs directly in your browser. Add your group, log expenses, and let the app calculate the optimal (minimum) number of transactions to settle all debts.

## ✨ Features

- **No Sign-up Required:** Jump straight into splitting. Your data lives in your browser's current session.
- **Smart Settlements:** Uses a greedy algorithm to find the minimum number of transactions needed to settle everyone up.
- **Group Management:** Add or remove members dynamically with auto-generated colored avatars.
- **Flexible Expense Logging:** Specify exactly who paid and split the cost among specific members or everyone.
- **Beautiful UI:** Premium dark-mode design with glassmorphism, smooth animations, and responsive layout.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app in action.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
- **Styling:** CSS Modules / Vanilla CSS with design tokens
- **Icons:** Inline SVG
- **Font:** Inter (via `next/font`)

## 🧠 How the Algorithm Works

When you add expenses, the app keeps a running "net balance" for each person. Once you're ready to settle:
1. It separates people into "debtors" (people who owe money) and "creditors" (people who are owed money).
2. It sorts both groups from largest amount to smallest.
3. It greedily matches the largest debtor with the largest creditor until all balances are zero.
This ensures the absolute minimum number of payments are made.

## 📝 License

MIT
