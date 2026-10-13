# Godage Studio - Billing & POS System

A modern studio billing, inventory, customer management, and multi-step POS system built with Next.js 16 (Turbopack) and Google Firebase Firestore.

---

## 🚀 Setting Up Firebase Firestore

This application uses **Firebase Firestore** as its database. Follow these quick steps to connect your Firebase project:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (or use an existing one).
3. In the left navigation, click **Build > Firestore Database** and click **Create database** (start in Test mode or production mode).

### Step 2: Get Service Account Credentials
1. Click the ⚙️ **Project settings** icon (top left next to "Project Overview").
2. Go to the **Service accounts** tab.
3. Click **Generate new private key**, then click **Generate key**.
4. A JSON file will download to your computer.

### Step 3: Connect to the App
You can connect your credentials in **any** of the following ways:

#### Option A: Drop the JSON file (Easiest)
Rename the downloaded JSON file to `serviceAccountKey.json` and place it in the `studio-billing/` root folder:
```
studio-billing/
├── serviceAccountKey.json
├── src/
...
```
*(Note: `serviceAccountKey.json` is automatically ignored by git to keep your secrets safe).*

#### Option B: Configure `.env.local`
Open `.env.local` and fill in the values from your downloaded service account file:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 🛠️ Seeding Initial Inventory / Products
Once Firebase is configured, run the following command to automatically seed initial studio services and products into Firestore:

```bash
npm run db:recreate
```

---

## 💻 Running the Application

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Default Admin Email: `indikagodage690@gmail.com`
- Default Admin Password: `123478indi`

---

## 📦 Features
- **Multi-Step POS**: Track payments across multiple steps (e.g., Booking Advance, Shooting, Final Collection).
- **Customer Directory**: View customer order history, outstanding balance, previous payments, and printable invoices.
- **Inventory & Services Management**: Add, edit, and delete services/items.
- **Real-Time Dashboard**: Live studio metrics for revenue, orders, and customer count.
