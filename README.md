# Restaurant Management & Ordering System

A production-ready, multi-branch commercial restaurant management, ordering, kitchen dispatch, delivery, and executive analytics platform built with **Next.js 14+ (TypeScript, Tailwind CSS, TanStack Query)** on the frontend and **FastAPI (SQLAlchemy 2, PostgreSQL, Redis, WebSockets)** on the backend.

---

## Features & Architecture Highlights

- **6 Initial Branches**: Built with dynamic UUID primary keys (`BR-MAIN`, `BR-CITY`, `BR-MALL`, `BR-DHA`, `BR-CANTT`, `BR-UNI`), fully isolated server-side based on user roles.
- **8 RBAC Roles**: Owner, Admin, Branch Manager, Kitchen Manager, Kitchen Staff, Cashier, Rider, and Customer with endpoint-level permission enforcement.
- **Cryptographic Table QR Ordering**: Table QR code tokens are generated with HMAC signatures and verified on the backend to prevent browser-side branch/table tampering.
- **Real-Time Kitchen Display Board (KDS)**: Redis Pub/Sub powered WebSockets broadcast incoming orders instantly to kitchen staff with preparation timers.
- **Deal System & 25% Max Custom Deal Cap**: Supports BOGO, % Off, Combos, and a Customer Custom Deal Builder with server-side 25% discount cutoff validation.
- **Feedback Analytics Engine**: Rule-based sentiment analysis categorizing food, service, and delivery ratings and extracting complaint patterns.
- **P&L & Financial Reports**: Executive sales reports, cost price tracking, operating expenses, net profit/loss, and CSV exports.

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # On Windows
pip install -r requirements.txt

# Seed 6 branches, roles, foods, QR tables, deals, and sample data
python ../database/seed/seed_data.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000/api/v1`
- OpenAPI Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## Docker Compose Setup

Run the full stack (Next.js, FastAPI, PostgreSQL, and Redis) with a single command:

```bash
docker compose up --build
```

---

## Pre-Configured Test Accounts (Password: `password123`)

| Role | Username / Email | Access Scope |
| :--- | :--- | :--- |
| **Owner** | `owner` / `owner@restaurant.com` | Full system access, all 6 branches, financial P&L, feedback analytics |
| **Admin** | `admin` / `admin@restaurant.com` | Global CRUD for branches, users, products, categories, tables, deals |
| **Main Branch Manager** | `mgr_main` / `manager.main@restaurant.com` | Main Branch isolated orders, staff, inventory, expenses |
| **City Branch Manager** | `mgr_city` / `manager.city@restaurant.com` | City Branch isolated orders & inventory |
| **Head Chef (Kitchen)** | `chef_main` / `chef.main@restaurant.com` | Main Branch KDS real-time kanban screen & order preparation status |
| **Line Cook** | `cook_main` / `cook.main@restaurant.com` | Main Branch kitchen order status updates |
| **Delivery Rider** | `rider1` / `rider1@restaurant.com` | View assigned delivery orders, pickup, & route status updates |
| **Customer** | `customer` / `customer@gmail.com` | Browse menu, select branch, custom deals, cart, order tracking |

---

## Testing

### Backend Unit & Integration Tests (Pytest)
```bash
cd backend
pytest
```

### Frontend E2E Tests (Playwright)
```bash
cd frontend
npm run test:e2e
```
