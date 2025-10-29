# Fix Production Domain Sync Issue

## Problem
- ✅ `thcmembersonly-ryanttangs-projects.vercel.app` - Shows correct build with version `v2024-12-13`
- ❌ `thcmembersonly.vercel.app` - Shows old build without version number

The production domain is pointing to a different/older Vercel project.

## Quick Fix (Recommended)

### Option 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard

2. **Find the correct project**:
   - Look for project named: `thcmembersonly-ryanttangs-projects` (the one with latest code)

3. **Check domains in correct project**:
   - Click on the project
   - Go to **Settings** → **Domains**
   - Verify if `thcmembersonly.vercel.app` is listed
   - If NOT listed → Add it (see step 4)
   - If it IS listed → Go to step 5

4. **Add production domain to correct project**:
   - Click **"Add Domain"**
   - Enter: `thcmembersonly.vercel.app`
   - Follow any DNS setup if prompted
   - If domain is already in use elsewhere, you'll need to remove it first

5. **Remove domain from old project**:
   - Go to the OLD project (if it exists separately)
   - Go to **Settings** → **Domains**
   - Remove `thcmembersonly.vercel.app` from the old project
   - This allows it to be added to the correct project

6. **Promote latest deployment to production**:
   - Go to **Deployments** tab
   - Find the latest successful deployment (the one with v2024-12-13)
   - Click **"⋯"** (three dots) → **"Promote to Production"**
   - Wait for promotion to complete

7. **Verify**:
   - Visit `https://thcmembersonly.vercel.app/dashboard/coordination`
   - Check that button shows: "Create Coordination Set v2024-12-13"
   - Both URLs should now show identical content

### Option 2: Vercel CLI

```bash
# 1. Ensure you're logged in
vercel login

# 2. Link to the correct project
cd /Users/ryantang/thcmembersonly
vercel link
# Select: thcmembersonly-ryanttangs-projects (the one with latest code)

# 3. Check current domains
vercel domains ls

# 4. Deploy to production (this will update the production domain)
vercel --prod

# 5. Verify
vercel ls
```

### Option 3: Force Redeploy via Git

If the domain is already correct but showing cached old code:

```bash
# Commit empty change to trigger redeploy
git commit --allow-empty -m "Force production redeploy to sync domains"
git push origin main
```

Then in Vercel Dashboard:
- Go to the latest deployment
- Click **"Promote to Production"**

## Verify the Fix

After fixing, check both URLs:

1. **Preview**: `https://thcmembersonly-ryanttangs-projects.vercel.app/dashboard/coordination`
2. **Production**: `https://thcmembersonly.vercel.app/dashboard/coordination`

Both should:
- ✅ Show identical content
- ✅ Display "Create Coordination Set v2024-12-13" button
- ✅ Have same functionality and styling

## Run Diagnostic Script

```bash
npm run fix:production-domain
```

This will check your Vercel setup and provide step-by-step instructions.

## Common Issues

### Issue: Domain already exists
**Solution**: Remove it from the old project first, then add to new project

### Issue: Different projects entirely
**Solution**: Either:
- Delete the old project (if it's a duplicate)
- Or keep both but ensure production domain points to correct one

### Issue: Deployment shows old code
**Solution**: 
- Check **Deployments** tab for the latest deployment
- Click **"Promote to Production"** on the latest one
- Or trigger new deployment with `git push`

## Prevention

To prevent this in the future:
1. Always use only ONE Vercel project per repository
2. Ensure production domain is connected to the active project
3. Use `vercel --prod` for production deployments
4. Monitor deployments to ensure all domains update

