# Vercel Deployment Sync - Documentation Index

## 🎯 Problem

You have two Vercel deployments that are out of sync:
- `thcmembersonly-ryanttangs-projects.vercel.app` (preview - returning 401)
- `thcmembersonly.vercel.app` (production - working)

## 📚 Solution Guides

### Quick Start (Choose Your Path)

**Option A: Sync Both Deployments** ⭐ **YOU CHOSE THIS**
- See: `SYNC_QUICK_START.md` - Quick 6-step guide
- See: `SYNC_DEPLOYMENTS_GUIDE.md` - Detailed step-by-step instructions

**Option B: Keep Only One Project**
- See: `VERCEL_SYNC_FIX.md` - General troubleshooting guide

---

## 🛠️ Tools & Scripts

### Diagnostic Tools
```bash
# Compare both deployments
npm run compare:deployments

# Show environment variables checklist
npm run sync:env-check
```

### Verification
```bash
# After syncing, verify both are healthy
npm run compare:deployments
```

---

## 📋 Key Files

1. **`SYNC_QUICK_START.md`** - Fast reference (6 steps)
2. **`SYNC_DEPLOYMENTS_GUIDE.md`** - Complete step-by-step guide
3. **`VERCEL_SYNC_FIX.md`** - General troubleshooting & all options
4. **`scripts/compare-vercel-deployments.js`** - Diagnostic script
5. **`scripts/sync-env-checklist.js`** - Environment variables checklist

---

## ✅ Success Criteria

After syncing (Option A), you should have:
- ✅ Both deployments connected to same database
- ✅ Both have all environment variables
- ✅ Both return healthy status
- ✅ Both show same content
- ✅ No 401 errors

---

## 🚀 Start Here

1. **Read**: `SYNC_QUICK_START.md` for quick steps
2. **Follow**: `SYNC_DEPLOYMENTS_GUIDE.md` for detailed instructions
3. **Verify**: Run `npm run compare:deployments` after completion

---

## 📞 Need Help?

- Run diagnostics: `npm run compare:deployments`
- Check checklist: `npm run sync:env-check`
- Review detailed guide: `SYNC_DEPLOYMENTS_GUIDE.md`

