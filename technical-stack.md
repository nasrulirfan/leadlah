# Architecture Stack

**🪙 Technical Stack**

**Core Philosophy:** "Write Once, Run Everywhere."
We utilize a **Monorepo** strategy (Turborepo/Nx) with **TypeScript** across the entire stack. This allows us to share types, validation schemas (Zod), and business logic between the Mobile App, Web Dashboard, and Backend API.

| **Component** | **Recommended Stack** | **Rationale & Key Features** |
|--------------|------------------------|-------------------------------|
| **Frontend (Mobile App)** | **React Native + Expo**<br>**+ "React Native Reusables" (Shadcn/UI)** | • **Single Codebase:** Write once in TypeScript/JavaScript, deploy to Web, iOS, and Android (for mobile/tablet).<br><br>• **Expo Framework:** Handles complex native modules, build pipelines, and OTA updates for you.<br><br>• **Native Feel:** Provides a true native mobile experience (better than a PWA). |
| **Frontend (Landing Page & Web App)** | **Next.js (React) + Shadcn UI Library** | **For Landing Page + Admin Panel**<br>• **SEO-Friendly:** SSR ensures good Google ranking for marketing pages.<br>• **Monorepo Synergy:** Shares ~70% of hooks/services with the mobile app.<br>• Uses Shadcn UI for consistent design system. |
| **Backend (API)** | **NestJS (Node.js)** | • **API-First Architecture:** Great for REST or GraphQL.<br>• **Full TypeScript Environment:** Matches your frontend stack for smooth developer experience.<br>• **Modular, Scalable & Testable.** |
| **Database** | **PostgreSQL** | • **Relational Power:** Perfect for highly relational data (Agents, Listings, Owners, Expenses, Logs).<br>• **Scalability:** Efficient for analytical queries (e.g., profit reports, commissions, Q3 summaries). |
| **Authentication** | **Better-auth**<br>(https://www.better-auth.com/) | • **Don’t build custom auth:** Avoid huge security and maintenance risks.<br>• Supports roles (Agent, Owner), social logins, 2FA, secure sessions. |
| **File Storage** | **Cloudflare R2** | • Best for storing property photos/videos.<br>• **S3-Compatible:** Easy migration to AWS S3 if needed.<br>• **No egress fees** (major cost saver). |
| **Reminders & Scheduling** | **Cron Jobs** | • Used for follow-ups, ad expiry reminders, task alerts.<br>• Can run on Render/Railway or AWS EventBridge (scalable). |
| **PDF / Receipt Generation** | **Puppeteer** | • **Required for:** Auto-generated receipts & reports.<br>• **Puppeteer:** Pixel-perfect PDFs using HTML templates.<br>• **React-PDF:** Build PDFs using React components. |
| **Monitoring** | **Sentry** | • Essential for production error monitoring & debugging. |
| **Payment** | **HitPay** | • Perfect for Malaysia (FPX, Cards).<br>• Handles recurring subscription billing + retries. |
| **Email Service** | **Resend** | • Modern, API-first email delivery for system notifications and receipts. |
| **Caching Layer** | **Redis + BullMQ** | • Used for heavy background jobs (image processing, notifications, scheduled tasks). |


# Infrastructure and Budget Cost (Web Based)

| **Service Provider** | **Role** | **Cost (USD)** | **Notes** |
| --- | --- | --- | --- |
| **Cloudflare Pages** | Landing Page & Web Hosting | **$0** | Vercel has a 100GB bandwidth limit. Cloudflare Pages has unlimited bandwidth. For a property app with many images, this is crucial. |
| **Expo (EAS)** | Mobile Builds | **$0** | "Free" Tier (15 builds/mo). |
| **Railway** | Backend API (NestJS) | **$5 / mo** | "Free" Plan (512MB RAM). |
| **Supabase** | Database (Postgres) | **$0 / mo** | "Free" Managed PostgreSQL (500MB RAM). |
| **Upstash** | Redis (for Job Queue) | **$0** | **Free Tier** (10,000 commands/day). Perfect for MVP job queues. |
| **Cloudflare R2** | File Storage | **$0** | 10GB/month free. |
| **Resend** | Email Service | **$0** | Free up to 3,000 emails/mo. |
| **Sentry** | Error Monitoring | **$0** | Free Developer Tier. |
| **HitPay** | Payment Gateway | **Fees Only** | **1.2% + RM1.00** (Cards) / **RM1.50** (FPX). |
| **TOTAL** | **Monthly Fixed** | **~$5 USD** | **(~RM 20 / month)** |

# Annual One time Fees
| **Service** | **Cost** | **Notes** |
| --- | --- | --- |
| **Apple App Store** | **$99 / year** | Mandatory for iOS App Store distribution. |
| **Google Play Store** | **$25 (One-time)** | One-time fee for lifetime access. |
| **Domain Name** | **~$10 / year** | .com or .my domain (e.g., via Namecheap). |