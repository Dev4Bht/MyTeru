# DrukSave — Information Architecture

Top-level navigation for the eventual product. Only the **Auth** surface
ships in Phase 1; everything else is a placeholder destination so later
phases slot into a coherent structure rather than being bolted on.

```
DrukSave
├─ Auth (Phase 1 — live)
│  ├─ Sign Up (phone → OTP → password)
│  ├─ Log In (phone + password → OTP if untrusted device)
│  ├─ Forgot Password (phone → OTP → new password)
│  └─ Account Security (devices, sessions, change password/phone)
│
├─ Dashboard (Phase 4)
│  ├─ "Safe to spend today"
│  ├─ Financial Health Score
│  └─ Recent activity
│
├─ Transactions (Phase 2)
│  ├─ Add Expense / Add Income
│  ├─ All Transactions (filter by category, merchant, date)
│  └─ Recurring Transactions
│
├─ Budgets (Phase 3)
│  └─ Per-category budget vs. actual
│
├─ Goals (Phase 3)
│  └─ Goal detail (progress, contributions, projected completion)
│
├─ Insights (Phase 5 — AI Financial Coach)
│  ├─ Daily / Weekly / Monthly insights
│  └─ Forecasts (cash flow, goal completion, future balance)
│
├─ Reports (Phase 9)
│  └─ Weekly / Monthly / Quarterly / Yearly, PDF/Excel/CSV export
│
├─ Notifications (Phase 6)
│
└─ Settings
   ├─ Profile
   ├─ Language & Theme
   ├─ Notification preferences
   └─ Security (this is where Phase 1's device/session management lives)
```

## Admin Panel (separate app surface, Phase 8)

```
Admin
├─ User Management
├─ System Analytics
├─ Support Tickets
├─ Fraud Detection
├─ Audit Logs
├─ Notifications
├─ System Monitoring
└─ Feature Flags
```
