# 🎂 Abby Cake and Bites — Backend API

Production-ready Node.js + Express + MongoDB backend for the Abby Cake and Bites AI bakery assistant.

---

## 📁 Project Structure

```
abby-backend/
├── server.js              # Main Express app entry point
├── package.json           # Dependencies
├── .env.example           # Environment variable template
├── .gitignore
│
├── config/
│   └── db.js              # MongoDB connection
│
├── models/
│   ├── Order.js           # Order schema (customer, item, delivery)
│   └── Admin.js           # Admin user schema (hashed passwords)
│
├── routes/
│   ├── orders.js          # POST /api/orders, GET /api/orders/:orderId
│   ├── admin.js           # Admin login + JWT-protected dashboard routes
│   └── chat.js            # Secure Anthropic AI proxy
│
├── middleware/
│   ├── auth.js            # JWT protect middleware + generateToken
│   └── validate.js        # express-validator rules for all inputs
│
└── utils/
    ├── mailer.js          # Nodemailer + HTML email templates
    └── seed.js            # One-time script to create admin user
```

---

## ⚡ API Endpoints Reference

### Public Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Health check |
| GET | `/api/health` | Detailed health info |
| POST | `/api/orders` | Submit new order |
| GET | `/api/orders/:orderId` | Look up order by ID |
| POST | `/api/chat` | Send message to AI assistant |

### Admin Endpoints (JWT Required)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/login` | Admin login → returns JWT token |
| GET | `/api/admin/verify` | Verify JWT token |
| GET | `/api/admin/orders` | List all orders (pagination + filters) |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/orders/:id` | Get single order |
| PATCH | `/api/admin/orders/:id/status` | Update order status |
| DELETE | `/api/admin/orders/:id` | Delete order (superadmin only) |

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Gmail account with 2FA enabled

### Step 1: Clone and install

```bash
git clone https://github.com/your-repo/abby-backend.git
cd abby-backend
npm install
```

### Step 2: Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | How to get it |
|----------|--------------|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers → copy URI |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Gmail → Security → App Passwords → generate one |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/api-keys |

### Step 3: Set up MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Create a **free M0 cluster**
3. Create a database user with read/write permissions
4. Add `0.0.0.0/0` to IP Access List (for deployment)
5. Click **Connect → Drivers** → copy the connection string
6. Replace `<password>` with your DB user password
7. Replace `myFirstDatabase` with `abby_bakery`
8. Paste into `MONGO_URI` in your `.env`

### Step 4: Set up Gmail App Password

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Go to **Security → 2-Step Verification → App passwords**
4. Generate a new App Password for "Mail" on "Other"
5. Copy the 16-character password into `EMAIL_PASS`

### Step 5: Create admin user

```bash
npm run seed
```

Output:
```
✅ MongoDB Connected
✅ Admin user created!
   Username: abby_admin
   Password: AbbyCakes2024!
```

### Step 6: Start the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 🌐 Frontend Integration

Update your React frontend to call the backend instead of the Anthropic API directly.

### Chat requests
```js
// Before (direct Anthropic call — insecure)
fetch("https://api.anthropic.com/v1/messages", ...)

// After (through your secure backend)
const res = await fetch(`${process.env.REACT_APP_API_URL}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages })
});
const { reply } = await res.json();
```

### Order submission
```js
const res = await fetch(`${process.env.REACT_APP_API_URL}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customer: { name, phone },
    item: { type, size, flavor, quantity },
    delivery: { type: "pickup" | "delivery", address },
    dateNeeded,
    notes
  })
});
```

### Admin login
```js
const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password })
});
const { token } = await res.json();
// Store token in memory or sessionStorage
// Use in subsequent requests: Authorization: `Bearer ${token}`
```

---

## ☁️ Deployment on Render

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/YOUR_USERNAME/abby-backend.git
git push -u origin main
```

### Step 2: Create Render Web Service
1. Go to https://render.com and sign up
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `abby-cake-backend`
   - **Region:** Frankfurt (closest to Tanzania)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

### Step 3: Add Environment Variables
In Render dashboard → Environment → Add all variables from `.env.example`:
- `NODE_ENV` = `production`
- `MONGO_URI` = your Atlas URI
- `JWT_SECRET` = your secret
- `EMAIL_USER` = your Gmail
- `EMAIL_PASS` = your App Password
- `OWNER_EMAIL` = `lyndagift06@gmail.com`
- `ANTHROPIC_API_KEY` = your key
- `FRONTEND_URL` = your Vercel frontend URL

### Step 4: Deploy
Click **Create Web Service** — Render auto-deploys on every push.

Your API will be live at: `https://abby-cake-backend.onrender.com`

> ⚠️ **Note:** Free Render services sleep after 15 min of inactivity. Upgrade to Starter ($7/mo) for always-on.

---

## 🚂 Deployment on Railway (Alternative)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Then add environment variables in the Railway dashboard.

Railway URL format: `https://abby-cake-backend-production.up.railway.app`

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcryptjs with 12 salt rounds |
| JWT auth | HS256, configurable expiry |
| Input sanitization | express-validator + .escape() |
| Rate limiting | Global 100 req/15min, login 10/15min, orders 10/hr, chat 20/min |
| HTTP headers | Helmet.js |
| Payload size limit | 10kb max |
| CORS | Configurable allowed origins |
| IP hashing | SHA-256 (truncated, privacy-safe) |

---

## 🧪 Testing the API

```bash
# Health check
curl http://localhost:5000/api/health

# Submit order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": { "name": "Grace Mushi", "phone": "0712345678" },
    "item": { "type": "Birthday Cake", "size": "8 inch", "flavor": "Chocolate", "quantity": "1" },
    "delivery": { "type": "pickup" },
    "dateNeeded": "Saturday 28 June 2025"
  }'

# Admin login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "abby_admin", "password": "AbbyCakes2024!" }'

# List orders (use token from login)
curl http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📧 Email Setup Troubleshooting

**"Invalid login" error:**
- Make sure you're using an **App Password**, not your Gmail password
- 2FA must be enabled on your Google account

**"Username and Password not accepted":**
- Go to https://myaccount.google.com/security
- Check that "Less secure app access" is not blocking (App Passwords bypass this)

**Emails going to spam:**
- Add your Gmail as a trusted sender
- Consider using a custom domain email for production

---

## 🛠️ Maintenance

```bash
# View live logs on Render
render logs --tail

# Update admin password (run in Node REPL)
node -e "
require('dotenv').config();
const m = require('mongoose');
const A = require('./models/Admin');
m.connect(process.env.MONGO_URI).then(async () => {
  const a = await A.findOne({ username: 'abby_admin' });
  a.password = 'NewPassword123!';
  await a.save();
  console.log('Password updated!');
  process.exit();
});
"
```

---

**Built for Abby Cake and Bites · Njiapanda, Himo, Tanzania 🇹🇿**
