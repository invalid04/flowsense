# FlowSense

**Product telemetry that tells you what’s happening—and what to do next.**

FlowSense is a behavioral intelligence platform that analyzes how users move through your product and turns that data into clear, actionable insights. Instead of dashboards and raw analytics, FlowSense surfaces drop-offs, loops, and high-converting paths automatically—so you can make better product decisions faster.

---

## 🚀 What FlowSense Does

FlowSense replaces traditional analytics dashboards with an **insight-driven experience**.

It helps you instantly understand:

* Where users drop off
* Where users get stuck (loops)
* What paths lead to conversion
* What actions to take next

---

## 🧠 Key Features

### 🔍 Insight Engine

Automatically generates high-impact insights like:

* “Users are dropping off at checkout”
* “Users are stuck between pricing and product”
* “This is your strongest conversion path”

---

### 🔄 Flow Analysis

Visualize how users move through your product:

* step-by-step flows
* drop-off percentages
* conversion rates

---

### 📊 Event Monitoring

Track interaction activity across your application:

* event counts
* session behavior
* recent activity

---

### ⚡ Lightweight SDK

Integrate in seconds:

```html
<script src="https://flowsense-five.vercel.app/flowsense-sdk.js"></script>
<script>
  FlowSense.init({
    apiKey: "your_api_key",
    endpoint: "https://flowsense-five.vercel.app/api/ingest"
  });

  FlowSense.track("/home");
</script>
```

---

### 🔐 Multi-Tenant Architecture

* Account-scoped API keys
* Secure ingestion
* Isolated data per workspace

---

## 🏗️ How It Works

FlowSense uses a state-based model to understand user behavior:

1. **Ingest**
   Events are captured via the SDK and sent to the ingestion API

2. **Model**
   Transitions between states are stored and analyzed

3. **Analyze**
   Behavioral patterns are detected:

   * drop-offs
   * loops
   * conversion paths

4. **Surface Insights**
   The system generates clear, actionable insights for your team

---

## 🧰 Tech Stack

* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Backend:** Next.js API routes
* **Database:** PostgreSQL (via Drizzle ORM)
* **Auth:** Clerk
* **Deployment:** Vercel

---

## 📦 API Overview

### Ingest Event

```http
POST /api/ingest
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

```json
{
  "sessionId": "session_123",
  "state": "/home"
}
```

---

### Insights

* `/api/insights/summary`
* `/api/insights/dropoff`
* `/api/insights/loops`
* `/api/insights/conversion-path`

---

### Flows

* `/api/flows`

---

### Events

* `/api/events`

---

## 🧪 Local Development

```bash
git clone https://github.com/your-username/flowsense.git
cd flowsense
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_public_key
```

---

## 🎯 Philosophy

FlowSense is built on a simple idea:

> You shouldn’t have to analyze charts to understand your product.

Instead of showing data and expecting interpretation, FlowSense delivers **answers**:

* what is happening
* why it matters
* what to do next

---

## 📌 Status

FlowSense is currently in **early-stage development (V1)** and actively evolving based on user feedback.

---

## 🤝 Contributing

Contributions, feedback, and ideas are welcome.

---

## 📄 License

MIT License
