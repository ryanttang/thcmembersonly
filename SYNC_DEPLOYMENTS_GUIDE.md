# Option A: Sync Both Deployments Guide

## Overview

This guide will help you synchronize both Vercel deployments to use the same configuration and database.

**Goal**: Make `thcmembersonly-ryanttangs-projects.vercel.app` and `thcmembersonly.vercel.app` use:
- ✅ Same database
- ✅ Same environment variables
- ✅ Same codebase (from the same git repo)
- ✅ Same build settings

---

## Step 1: Identify Your Projects in Vercel Dashboard

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Find both projects**:
   - Look for a project that matches `thcmembersonly-ryanttangs-projects.vercel.app`
   - Look for a project that matches `thcmembersonly.vercel.app`
   - Note the exact project names

3. **Identify which is which**:
   - Check **Settings** → **Domains** in each project
   - The project with `thcmembersonly.vercel.app` is your **production project**
   - The project with `thcmembersonly-ryanttangs-projects.vercel.app` is likely a **team/preview project**

**Write down**:
- Production Project Name: `_______________________`
- Preview/Team Project Name: `_______________________`

---

## Step 2: Get Environment Variables from Production (Working) Project

Since production is working, we'll copy its configuration to the preview project.

### 2.1 Export from Production Project

1. Go to **Production Project** → **Settings** → **Environment Variables**
2. **Document all variables** (or use the helper script below):

**Required Variables** (must copy these exactly):
```bash
DATABASE_URL=""
NEXTAUTH_URL=""
NEXTAUTH_SECRET=""
AWS_REGION=""
S3_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
S3_PUBLIC_BASE_URL=""
```

**Optional Variables** (copy if present):
```bash
INSTAGRAM_APP_ID=""
INSTAGRAM_APP_SECRET=""
INSTAGRAM_REDIRECT_URI=""
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
FACEBOOK_REDIRECT_URI=""
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
REDIS_URL=""
SENTRY_DSN=""
GOOGLE_ANALYTICS_ID=""
RATE_LIMIT_ENABLED=""
CORS_ORIGIN=""
NODE_ENV=""
```

**NOTE**: For `NEXTAUTH_URL`, you'll need to set it differently for each project:
- Production: `https://thcmembersonly.vercel.app`
- Preview: `https://thcmembersonly-ryanttangs-projects.vercel.app` (or leave as production URL)

### 2.2 Use Helper Script (Optional)

Run this to create a reference file:
```bash
npm run sync:env-check
```

---

## Step 3: Copy Environment Variables to Preview Project

1. Go to **Preview Project** → **Settings** → **Environment Variables**

2. **For each variable from Step 2.1**:
   - Click **"Add New"**
   - Enter the **Name** exactly as it appears
   - Enter the **Value** (copy from production)
   - **Important**: Select environment scope:
     - ✅ **Production**
     - ✅ **Preview** (if you want it on preview deployments)
     - ✅ **Development** (optional)
   - Click **Save**

3. **For NEXTAUTH_URL**:
   - Option A (Recommended): Use production URL for both
     ```
     NEXTAUTH_URL="https://thcmembersonly.vercel.app"
     ```
   - Option B: Use preview URL (may cause auth redirect issues)
     ```
     NEXTAUTH_URL="https://thcmembersonly-ryanttangs-projects.vercel.app"
     ```

4. **Verify Critical Variables**:
   - ✅ `DATABASE_URL` - Must be **EXACTLY the same** in both projects
   - ✅ `NEXTAUTH_SECRET` - Must be **EXACTLY the same** in both projects
   - ✅ `AWS_ACCESS_KEY_ID` - Can be the same or different (your choice)
   - ✅ `AWS_SECRET_ACCESS_KEY` - Can be the same or different (your choice)

---

## Step 4: Verify Git Integration

Ensure both projects are connected to the **same repository and branch**.

### For Each Project:

1. Go to **Settings** → **Git**
2. Verify:
   - ✅ **Repository**: Should be the same for both projects
   - ✅ **Production Branch**: Should be `main` (or `master`)
   - ✅ **Root Directory**: Should be `.` (unless you use a monorepo)

**If they're connected to different repos/branches**:
- Either reconnect one, OR
- Ensure both point to the same source

---

## Step 5: Sync Build Settings

Ensure both projects have identical build configurations.

### For Each Project:

1. Go to **Settings** → **General**
2. Check **Build & Development Settings**:
   - **Framework Preset**: `Next.js`
   - **Build Command**: Should be empty (Next.js default) or `npm run build`
   - **Output Directory**: Should be empty (Next.js default) or `.next`
   - **Install Command**: `npm install` or `npm ci`
   - **Development Command**: `npm run dev`
   - **Node.js Version**: Should match (e.g., `18.x` or `20.x`)

3. **Make them identical** if they differ

---

## Step 6: Force Redeploy Both Projects

After syncing environment variables, redeploy both to pick up changes.

### Option A: Via Vercel Dashboard

**For Production Project**:
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Wait for completion

**For Preview Project**:
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Wait for completion

### Option B: Via Git Push

1. Make a small change (or empty commit):
   ```bash
   git commit --allow-empty -m "Sync deployments - force redeploy"
   git push origin main
   ```
2. Both projects should auto-deploy

### Option C: Via Vercel CLI

```bash
# Link to production project
vercel link

# Deploy production
vercel --prod

# Switch to preview project (if separate)
vercel link --project <preview-project-name>

# Deploy preview
vercel --prod
```

---

## Step 7: Verify Synchronization

After redeployment, verify both are in sync.

### 7.1 Run the Comparison Script

```bash
npm run compare:deployments
```

**Expected Results**:
- ✅ Both health checks should pass
- ✅ Database status should be "connected" for both
- ✅ Environment should be "production" for both
- ⚠️ Vercel IDs will be different (that's normal - they're still separate deployments)
- ✅ Both should return status 200 on main page

### 7.2 Manual Verification

**Test Production URL**:
```bash
curl https://thcmembersonly.vercel.app/api/health
```

**Expected**: `{"status":"healthy","database":{"status":"connected"},...}`

**Test Preview URL**:
```bash
curl https://thcmembersonly-ryanttangs-projects.vercel.app/api/health
```

**Expected**: `{"status":"healthy","database":{"status":"connected"},...}`

**Compare Responses**:
- Database status should match
- Environment should match
- Missing env vars should match (should be none)

### 7.3 Functional Testing

Test both URLs in browser:
- [ ] Both load the homepage correctly
- [ ] Both show same events/content
- [ ] Both allow sign-in (if testing auth)
- [ ] Both connect to the same database (changes in one reflect in other)

---

## Step 8: Set Up Monitoring (Optional but Recommended)

Ensure future deployments stay in sync.

### 8.1 Create Deployment Checklist

Before each deployment, verify:
- [ ] Environment variables are identical
- [ ] DATABASE_URL matches
- [ ] NEXTAUTH_SECRET matches
- [ ] Build settings match

### 8.2 Use Vercel Teams/Projects Feature

Consider consolidating to one project if possible:
- Use **Vercel Teams** to manage multiple environments
- Or use **preview deployments** instead of separate projects

### 8.3 Automated Sync Script

Create a script to verify sync (run periodically):
```bash
npm run compare:deployments
```

---

## Troubleshooting

### Issue: Preview still returns 401

**Solutions**:
1. Verify `DATABASE_URL` is set correctly
2. Verify `NEXTAUTH_SECRET` is set correctly
3. Check deployment logs for errors
4. Ensure environment variables are scoped to **Production** environment

### Issue: Different database connections

**Solutions**:
1. Double-check `DATABASE_URL` values match exactly
2. Ensure no typos or whitespace
3. Verify both projects are in the same Vercel team (if applicable)

### Issue: One deployment updates, other doesn't

**Solutions**:
1. Check Git integration - both should auto-deploy on push
2. Verify branch settings match
3. Check if one project has deployment paused

### Issue: Different content/functionality

**Solutions**:
1. Verify both are on the same git branch
2. Check deployment commit hashes match
3. Clear Vercel cache and redeploy

---

## Quick Reference: Required Environment Variables

**Critical (Must Match Exactly)**:
```bash
DATABASE_URL          # Same database for both
NEXTAUTH_SECRET       # Same secret for both
```

**Critical (Can Differ by Domain)**:
```bash
NEXTAUTH_URL          # Can use production URL for both, or separate
```

**Important (Should Match)**:
```bash
AWS_REGION
S3_BUCKET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_PUBLIC_BASE_URL
```

---

## Success Criteria

After completing these steps, you should have:

- ✅ Both deployments connected to same database
- ✅ Both deployments have all required environment variables
- ✅ Both deployments return healthy status
- ✅ Both deployments show same content
- ✅ Changes in one reflect in the other (same database)
- ✅ No 401 errors on preview URL

---

## Next Steps After Sync

1. **Monitor both deployments** for a few days
2. **Set up alerts** if deployments diverge
3. **Consider consolidating** to one project if preview isn't needed
4. **Document** which URL to use for production

---

## Need Help?

- Run diagnostic: `npm run compare:deployments`
- Check Vercel logs: Dashboard → Deployments → [Select Deployment] → Functions
- Review `VERCEL_SYNC_FIX.md` for general troubleshooting

