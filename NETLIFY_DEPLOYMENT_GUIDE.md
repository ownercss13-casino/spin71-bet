# 🚀 Netlify Deployment Complete Guide

## ✅ যা করা হয়েছে:

### 1. **Repository Configuration**
- ✅ `netlify.toml` তৈরি করা হয়েছে
- ✅ `.env.local` তৈরি করা হয়েছে (ডামি ভেরিয়েবল সহ)
- ✅ `.gitignore` এ সেনসিটিভ ফাইল সুরক্ষিত

### 2. **Next Steps - Netlify তে Deploy করুন**

#### **Step 1: Netlify Account তৈরি করুন**
```
👉 যান: https://app.netlify.com
👉 "Sign up" ক্লিক করুন
👉 GitHub দিয়ে লগইন করুন
```

#### **Step 2: Repository থেকে Deploy করুন**
```
1. "Add new site" ক্লিক করুন
2. "Import an existing project" সিলেক্ট করুন
3. GitHub নির্বাচন করুন
4. "ownercss13-casino/spin71-bet" খুঁজুন এবং ক্লিক করুন
```

#### **Step 3: Build Settings Verify করুন**
```
Build Command: npm run build ✅
Publish Directory: dist ✅
```

#### **Step 4: Environment Variables সেট করুন**
Netlify ড্যাশবোর্ডে:
```
Site Settings → Build & deploy → Environment
```

**এই ভেরিয়েবলগুলি যোগ করুন:**

| Variable | Value | বিবরণ |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | আপনার Firebase JSON | Firebase Console থেকে পান |
| `FIREBASE_DATABASE_URL` | Firebase URL | `https://your-project.firebaseio.com` |
| `GEMINI_API_KEY` | আপনার API Key | https://aistudio.google.com থেকে পান |
| `SESSION_SECRET` | দীর্ঘ র‍্যান্ডম স্ট্রিং | নিরাপত্তার জন্য গুরুত্বপূর্ণ |
| `TELEGRAM_BOT_TOKEN` | Bot Token | যদি ব্যবহার করেন |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat ID | যদি ব্যবহার করেন |
| `NODE_ENV` | `production` | প্রোডাকশনের জন্য |

#### **Step 5: Deploy করুন**
```
"Deploy site" ক্লিক করুন
⏳ Netlify বিল্ড এবং ডিপ্লয় করবে (২-৫ মিনিট)
```

---

## 📊 আপনার সাইট তথ্য:

| তথ্য | বিবরণ |
|---|---|
| **ফ্রি ডোমেইন** | `spin71bet.netlify.app` |
| **আপনার রিপো** | `ownercss13-casino/spin71-bet` |
| **বিল্ড কমান্ড** | `npm run build` |
| **পাবলিশ ডিরেক্টরি** | `dist/` |
| **ফ্রি SSL** | ✅ অটোমেটিক্যালি যুক্ত |
| **CDN** | ✅ গ্লোবাল (দ্রুত লোডিং) |
| **আনলিমিটেড ব্যান্ডউইথ** | ✅ ফ্রি প্ল্যানে |

---

## 🔐 আপনার Actual API Keys যোগ করুন:

### Firebase Setup:
1. Firebase Console এ যান: https://console.firebase.google.com
2. আপনার প্রজেক্ট খুলুন
3. **Settings** → **Service Accounts** → **Generate New Private Key**
4. JSON ডাউনলোড করুন এবং Netlify তে পেস্ট করুন

### Gemini API Key:
1. Google AI Studio যান: https://aistudio.google.com
2. **Get API Key** ক্লিক করুন
3. Key কপি করুন এবং Netlify তে পেস্ট করুন

### SESSION_SECRET তৈরি করুন:
```bash
# Terminal এ চালান:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
এই আউটপুট Netlify তে `SESSION_SECRET` এ পেস্ট করুন।

---

## ✅ Deployment Status চেক করুন:

ডিপ্লয় করার পর Netlify ড্যাশবোর্ডে:
```
Deploys → [সর্বশেষ ডিপ্লয়] → Logs দেখুন
```

সবুজ চেকমার্ক = সফল ডিপ্লয়মেন্ট ✅

---

## 📱 আপনার লাইভ সাইট:

🌐 **https://spin71bet.netlify.app**

---

## 🆘 কোনো সমস্যা হলে:

- Build ব্যর্থ হলে → Logs চেক করুন
- Environment ভেরিয়েবল মিসিং → Netlify Settings চেক করুন
- আমাকে জানান, আমি সাহায্য করব!

---

**Happy Deploying! 🚀**
