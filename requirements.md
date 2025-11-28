Here is the **Product Requirement Document (PRD) v3.0**, which now includes the **Marketing Landing Page** designed to serve as both a sales tool and the entry point to the application.

---

# PROJECT: LEADLAH – MVP (PHASE 1)

Version: 3.0 (Final Draft including Landing Page)

Target Users: Real Estate Agents (Admin/User), Property Owners (Guest View), Public/Investors (Landing Page)

---

## 1. LISTING MANAGEMENT (Core Database)

**Goal:** Centralized "Digital Shelf" for property inventory.

- **CRUD Operations:** Create, Read, Update, Delete listings.
- **Fields:** Property Name, Type, Price, Size, Bedrooms/Bathrooms, Location.
- **Media:** Upload Photos, Videos, and Documents (Title deeds, etc.).
- **Status Workflow:** `Active` | `Sold` | `Rented` | `Expired` | `Withdrawn`.
- **External Links:** Store URLs for advertisements on external portals (Mudah, PropertyGuru) for reference.

## 2. TRACKING MANAGEMENT (Scheduler)

**Goal:** Automated reminders to prevent missed opportunities.

- **Expiry Logic:**
    - **Mudah/Portal Ads:** Countdown timer (e.g., Reset to 60/90 days). Alert at 3 days remaining.
    - **Exclusive Appointments:** Alert 7 days before authorization letter expires.
- **CRM Reminders:**
    - Follow-up scheduler for Leads/Owners.
    - Tenancy Renewal Alerts (Trigger: 2 months before tenancy end date).

## 3. PROCESS LOG (Fishbone Workflow)

**Goal:** Transaction transparency and client trust.

- **Stages:**
    1. Owner Appointment
    2. Marketing Activation
    3. Viewing Record (Log: Date, Client Name, Feedback)
    4. Offer Stage (Negotiation/Letter of Offer)
    5. Legal Stage (SPA/Tenancy Drafting)
    6. Loan/Consent Processing
    7. Key Handover
- **Owner View:** Generate a shareable, secure link/login for owners to view a *read-only* timeline of these stages.

---

## 4. PROFESSIONAL CALCULATOR MODULE

**Goal:** Instant, accurate financial estimates with branded PDF generation.

### 4.1 Loan Eligibility Calculator

- **Logic:** Reverse calculation from Income/DSR to find Max Loan.
- **Inputs:** `Income`, `Commitments`, `DSR %`, `Interest Rate`, `Tenure`.
- **Outputs:** Max Installment, Max Loan Amount, Max Property Price.

### 4.2 Legal Fee & Stamp Duty (SPA / MOT)

- **Logic:** Tiered calculation + Foreigner/Consent checks.
- **Legal Fee:** First 500k @ 1.25%, Balance @ 1% (Cap RM70k).
- **Disbursement:** RM2,500 (No Consent) / RM4,000 (With Consent).
- **Stamp Duty:**
    - *Malaysian:* Standard 1-4% tiers.
    - *Foreigner:* 4% Flat (Before 2026) / 8% Flat (After 1 Jan 2026).

### 4.3 Loan Agreement Calculator

- **Logic:** Tiered calculation applied to Loan Amount.
- **Legal Fee:** Same tiers as SPA.
- **Stamp Duty:** Flat 0.5% of Loan Amount.

### 4.4 ROI Calculator

- **Inputs:** `Price`, `Rent`, `Costs`.
- **Outputs:** Gross Yield %, Net Yield %.

### 4.5 Property Sellability Feasibility (MFS Score)

- **Logic:** Weighted scoring (Price vs. BMV, Competition, Liquidity).
- **Grading:** A (0-90 days) to E (Hard to sell).

### 4.6 Land Feasibility (Developer Pitching)

- **Logic:** GDV vs. Land Cost.
- **Constant:** Dev Cost = 45% of GDV.
- **Grading:** A (≥25% Margin) to E (<10% Margin).

### 4.7 Tenancy Stamp Duty

- **Logic:** Block rounding (Round annual rent to nearest 250).
- **Formula:** `(Blocks × Rate based on years) + RM10`.

### 4.8 Receipt Generation

- **Output:** Branded PDF with Agent Name, REN No, Agency Logo, and Calculation Summary.

---

## 5. DASHBOARD (Agent Overview)

**Goal:** High-level daily metrics.

- **Widgets:** Active vs Sold Listing Count, "Action Required" List, Quick Calculator Links.

## 6. PERFORMANCE & EXPENSE TRACKER

**Goal:** Business P&L and Goal Setting.

- **Logic:** `Net Profit` = (Commissions from Sold Listings) - (Manual Expense Entries).
- **Visuals:** Progress bar vs. Annual Target.

---

## 7. LANDING PAGE (Marketing & Pitching Portal)

**Goal:** A high-conversion public-facing page to market the SaaS, showcase features to investors, and redirect users to the application.

### 7.1 Hero Section (The Hook)

- **Headline:** "The Professional Edge for Malaysian Property Agents."
- **Sub-headline:** "Stop using Excel. Start using LeadLah. Manage listings, calculate costs, and track commissions in one app."
- **Primary Call-to-Action (CTA):**
    - Button Text: **"Launch App"** or **"Try for Free"**.
    - *Function:* Redirects to the Authentication/Login Page (`app.leadlah.com`).
- **Visual:** A high-quality mockup image of the Dashboard and the generated PDF Receipt on a mobile screen.

### 7.2 "Why LeadLah?" (Feature Showcase)

- **The Problem:** Icons representing "Messy WhatsApp Folders," "Forgotten Expiry Dates," and "Manual Calculations."
- **The Solution:**
    - **Fishbone Tracker:** Graphic showing the transparent timeline from Appointment to Handover.
    - **Pro Calculators:** Highlight the "1-Click Branded Receipt" feature (High selling point).
    - **Automated Reminders:** "Never miss a renewal again."

### 7.3 Social Proof & Trust (Pitching Elements)

- **Target Audience Trust:** "Built for REN & REA."
- **Logos:** "Suitable for agents from:" (Display logos of major agencies like IQI, ERA, etc., as examples of compatibility).
- **Testimonials:** Placeholder section for beta tester reviews.

### 7.4 Technical & Marketing Integration

- **Analytics:** Pre-installed Google Analytics 4 (GA4) and Meta Pixel to track how many people click the "Launch App" button (Crucial for the marketing team).
- **SEO:** Optimized meta tags for keywords: *Property Agent App Malaysia, DSR Calculator, Real Estate CRM.*

### 7.5 Footer & Navigation

- **Links:** Privacy Policy, Terms of Service, Support Contact.
- **Sticky Header:** Ensure the "Launch App" button is always visible as the user scrolls down.

---

## 8. SUBSCRIPTION & PAYMENT MODULE (New)

**Goal:** Manage recurring revenue, enforce access control, and handle payment failures via HitPay.

### 8.1 Subscription Workflow

- **Provider:** **HitPay** (Recurring Billing).
- **Free Trial Logic:**
    - New users receive a **7-Day Free Trial** upon sign-up.
    - Card details may be required upfront (optional based on HitPay flow) or requested on Day 8.
- **Status States (Backend):**
    - `TRIALING`: Full access (Days 1-7).
    - `ACTIVE`: Payment successful.
    - `PAST_DUE`: Payment failed, currently in retry grace period.
    - `CANCELED`: No access, read-only mode.

### 8.2 Subscription UI (Plan Selection)

- **Placement:**
    - Appears during Onboarding.
    - Accessible via Settings > Billing.
- **UI Elements:**
    - **Pricing Card:** Display Monthly/Yearly price.
    - **"Start 7-Day Free Trial" Button:** Initiates the subscription flow.
    - **Benefit List:** "Unlimited Listings, Branded PDF Receipts, Fishbone Tracker."

### 8.3 Failed Payment & Retry Logic

- **Trigger:** HitPay Webhook returns `payment.failed`.
- **Grace Period:** System allows 3 days of access while attempting retries.
- **UI for Failure:**
    - **Global Alert Banner:** A red banner at the top of the dashboard: *"Your subscription payment failed. Please update your payment method to avoid account suspension."*
    - **Retry Modal:** A dedicated screen/modal showing the failed invoice amount.
    - **Action:** "Update Card" or "Retry Payment" button which opens the HitPay secure payment widget.

### 8.4 Billing Settings

- **Features:**
    - View Current Plan & Next Billing Date.
    - Download Invoices (History).
    - Cancel Subscription button.
    - Update Payment Method (Change Card).

## TECHNICAL NOTES FOR DEV TEAM

1. **Separation of Concerns:** The **Landing Page (Section 7)** should ideally be a lightweight static site (e.g., Next.js SSG or simple HTML/Tailwind) for maximum SEO and speed, distinct from the main **Web App (Sections 1-6)**.
2. **Date Logic:** Ensure Module 4.2 (Foreigner Stamp Duty) auto-switches rates on Jan 1, 2026.
3. **Security:** Module 3 (Owner View) requires secure hashed URLs.
4. **Mobile First:** All interfaces must be optimized for mobile screens.