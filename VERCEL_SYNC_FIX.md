# Vercel Deployment Sync Fix

## Quick Summary

**Problem**: Two different Vercel deployments exist, causing confusion:
- Preview URL (`thcmembersonly-ryanttangs-projects.vercel.app`) returns 401 - likely missing env vars
- Production URL (`thcmembersonly.vercel.app`) works correctly

**Solution**: 
1. Check Vercel Dashboard for duplicate projects
2. Ensure preview project has all environment variables set
3. Either merge projects or ensure both use the same database/config
4. Consider removing/archiving the preview if it's not needed

**Run this to diagnose**: `npm run compare:deployments`

---

## Issue

Two Vercel deployments are showing different versions:
- ⚠️ `https://thcmembersonly-ryanttangs-projects.vercel.app/` - Returns 401 (Authentication Required), health check fails
- ✅ `https://thcmembersonly.vercel.app/` - Works correctly, health check passes

**Diagnosis Results:**
- These are **DIFFERENT deployments** with different Vercel IDs
- Preview URL appears to have missing environment variables or configuration issues
- Production URL is functioning correctly
- Both deployments need to be synced to use the same codebase and database

## Root Cause

This typically happens when:
1. **Multiple Vercel projects** are connected to the same repository
2. **Different deployments** are pointing to different databases or configurations
3. **Production domain** is connected to an older project/deployment
4. **Git branches** or deployment settings differ between projects

## Solution Steps

### Step 1: Identify All Vercel Projects

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Check **all projects** that might be linked to this repository
3. Look for projects named:
   - `thcmembersonly`
   - Any variant or duplicate projects

### Step 2: Determine Which Project Has the Latest Code

1. Check the **Deployments** tab for each project
2. Look at:
   - **Latest deployment timestamp**
   - **Git commit hash** (should match your latest commit)
   - **Deployment status** (should be "Ready")

3. The project with:
   - ✅ Latest deployment timestamp
   - ✅ Matching git commit hash
   - ✅ Successful build status
   
   **This is your ACTIVE project** (likely `thcmembersonly-ryanttangs-projects`)

### Step 3: Check Domain Configuration

1. In the **ACTIVE project** (up-to-date one):
   - Go to **Settings** → **Domains**
   - Check if `thcmembersonly.vercel.app` is listed
   - If not, this is why the production domain is outdated

2. In the **OUTDATED project**:
   - Go to **Settings** → **Domains**
   - Note which domains are connected
   - This project should be **deleted** or **disconnected** from the domain

### Step 4: Sync Domain to Active Project

#### Option A: Connect Domain to Active Project

1. In the **ACTIVE project**:
   - Go to **Settings** → **Domains**
   - Click **Add Domain**
   - Enter `thcmembersonly.vercel.app`
   - Follow the DNS setup instructions if needed

#### Option B: Use Project Alias

1. In the **ACTIVE project**:
   - The default URL should automatically be `thcmembersonly-ryanttangs-projects.vercel.app`
   - If you want a cleaner URL, you may need to rename the project

### Step 5: Verify Database and Environment Variables

**CRITICAL**: Both deployments MUST use the same database!

1. In the **ACTIVE project**:
   - Go to **Settings** → **Environment Variables**
   - Verify all required variables are set:
     - `DATABASE_URL`
     - `NEXTAUTH_URL`
     - `NEXTAUTH_SECRET`
     - `AWS_REGION`
     - `S3_BUCKET`
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `S3_PUBLIC_BASE_URL`

2. **Ensure NEXTAUTH_URL matches the domain**:
   ```bash
   NEXTAUTH_URL="https://thcmembersonly.vercel.app"
   ```

3. If using a custom domain, update:
   ```bash
   NEXTAUTH_URL="https://thcmembersonly.vercel.app"  # or your custom domain
   ```

**📚 For detailed Option A sync instructions, see `SYNC_DEPLOYMENTS_GUIDE.md`**

### Step 6: Clean Up Outdated Project

**IMPORTANT**: Only delete if you're certain it's a duplicate!

1. Identify the **OUTDATED project** (the one with old code)
2. **Backup any unique configurations** (env vars, domains) if needed
3. Go to **Settings** → **General** → **Delete Project**
4. Confirm deletion

**Alternative**: If unsure, just **disconnect the domain** instead of deleting

### Step 7: Force Redeploy on Active Project

1. In the **ACTIVE project**:
   - Go to **Deployments** tab
   - Find the latest successful deployment
   - Click **⋯** (three dots) → **Redeploy**
   - Wait for deployment to complete

2. Or trigger via git:
   ```bash
   git commit --allow-empty -m "Force redeploy to sync domains"
   git push origin main
   ```

### Step 8: Verify Sync

After completing the steps, verify:

1. **Check both URLs**:
   ```bash
   # Should show same content
   curl https://thcmembersonly-ryanttangs-projects.vercel.app/api/health
   curl https://thcmembersonly.vercel.app/api/health
   ```

2. **Visual check**:
   - Visit both URLs in browser
   - Both should show the same version
   - Both should have the same functionality

3. **Database sync**:
   - Both should connect to the **same database**
   - Changes in one should reflect in the other

## Quick Fix Command

If you want to force the production domain to point to the latest deployment:

```bash
# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Link to the correct project
vercel link

# 4. Deploy to production
vercel --prod

# 5. Verify domains
vercel domains ls
```

## Common Scenarios

### Scenario 1: Two Separate Projects

**Problem**: Two Vercel projects exist, one is active, one is outdated

**Solution**: 
- Keep the active project
- Delete or archive the outdated project
- Ensure domain points to active project

### Scenario 2: Branch-Based Deployments

**Problem**: Production domain points to a different git branch

**Solution**:
- In project settings, check **Git** → **Production Branch**
- Should be `main` or `master`
- Verify the production branch has latest code

### Scenario 3: Deployment Settings

**Problem**: Different build/install commands or environment variables

**Solution**:
- Compare **Settings** → **General** → **Build & Development Settings**
- Ensure both projects have identical settings
- Or just use one project

### Scenario 4: Preview vs Production

**Problem**: One URL is preview, one is production

**Solution**:
- `*-ryanttangs-projects.vercel.app` is typically a **project alias**
- `thcmembersonly.vercel.app` should be the **production domain**
- Both should point to the same deployment

## Prevention

To prevent this in the future:

1. **Use only ONE Vercel project** per repository
2. **Always deploy to production** with `vercel --prod`
3. **Keep custom domains** connected to the same project
4. **Monitor deployments** to ensure all domains update

## Troubleshooting

### If domains still don't sync:

1. **Clear Vercel cache**:
   - Delete `.vercel` folder locally
   - Run `vercel link` again

2. **Check DNS settings**:
   - Verify domain DNS points to Vercel
   - Allow 24-48 hours for DNS propagation

3. **Check Vercel team/organization**:
   - Ensure you're in the correct Vercel team
   - Check project ownership

4. **Contact Vercel support**:
   - If issues persist, reach out via Vercel dashboard
   - Provide project URLs and deployment hashes

## Verification Checklist

- [ ] Only ONE active Vercel project connected to repo
- [ ] Production domain (`thcmembersonly.vercel.app`) connected to active project
- [ ] Latest deployment is successful on active project
- [ ] Environment variables are identical in both (if keeping two)
- [ ] Database connection is the same for both
- [ ] Both URLs show the same content/functionality
- [ ] Health endpoint returns same status for both
- [ ] Git commit hash matches latest deployment

## Next Steps

After fixing the sync:

1. ✅ Test all functionality on both URLs
2. ✅ Verify database sync
3. ✅ Update any external links/API calls
4. ✅ Monitor deployment logs
5. ✅ Set up deployment notifications

