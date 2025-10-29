# Quick Start: Sync Deployments (Option A)

## 🚀 Quick Steps

### Step 1: Get Production Environment Variables
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Production Project** (the one with `thcmembersonly.vercel.app`)
3. **Settings** → **Environment Variables**
4. **Copy all values** (especially `DATABASE_URL` and `NEXTAUTH_SECRET`)

### Step 2: Apply to Preview Project
1. Go to **Preview Project** (the one with `thcmembersonly-ryanttangs-projects.vercel.app`)
2. **Settings** → **Environment Variables**
3. **Add each variable** from Step 1 with the same values
4. **Set environment scope**: Production, Preview

### Step 3: Critical Variables (Must Match Exactly)
- ✅ `DATABASE_URL` - Must be identical
- ✅ `NEXTAUTH_SECRET` - Must be identical  
- ✅ `AWS_ACCESS_KEY_ID` - Should match
- ✅ `AWS_SECRET_ACCESS_KEY` - Should match

### Step 4: NEXTAUTH_URL Setup
Use production URL for both:
```
NEXTAUTH_URL="https://thcmembersonly.vercel.app"
```

### Step 5: Redeploy
- **Option A**: Go to Deployments → Click "Redeploy" on both projects
- **Option B**: Push empty commit:
  ```bash
  git commit --allow-empty -m "Sync deployments"
  git push origin main
  ```

### Step 6: Verify
```bash
npm run compare:deployments
```

Should show both healthy and connected.

---

## 📋 Full Checklist

Run this to see all required variables:
```bash
npm run sync:env-check
```

---

## 📚 Detailed Guide

See `SYNC_DEPLOYMENTS_GUIDE.md` for complete step-by-step instructions.

---

## ⚠️ Common Mistakes

- ❌ Different `DATABASE_URL` values → Data won't sync
- ❌ Different `NEXTAUTH_SECRET` → Auth won't work on one
- ❌ Forgetting to set environment scope → Variables won't apply
- ❌ Not redeploying → Changes won't take effect

---

## ✅ Success Indicators

- Both URLs return status 200
- Health checks pass on both
- Database status: "connected" on both
- Same content/functionality on both URLs
- No 401 errors

