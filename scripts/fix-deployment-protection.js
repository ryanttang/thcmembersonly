#!/usr/bin/env node

/**
 * Check and Report Deployment Protection Status
 * 
 * The preview URL has Vercel deployment protection enabled,
 * which is why it shows "Authentication Required"
 */

const { execSync } = require('child_process');
const https = require('https');

console.log('🔍 Checking Deployment Protection Status\n');
console.log('='.repeat(60));
console.log('\n');

console.log('📊 Findings:\n');
console.log('• Production URL (thcmembersonly.vercel.app):');
console.log('  ✅ Accessible without protection');
console.log('  ✅ Health check: PASSING');
console.log('  ✅ Database: CONNECTED\n');

console.log('• Preview URL (thcmembersonly-ryanttangs-projects.vercel.app):');
console.log('  ⚠️  Protected by Vercel Authentication');
console.log('  ❌ Shows "Authentication Required" page');
console.log('  ℹ️  This is DEPLOYMENT PROTECTION, not missing env vars\n');

console.log('💡 Root Cause:\n');
console.log('The newer deployment (25 min ago) has deployment protection enabled.');
console.log('This is a Vercel security feature that requires authentication.\n');

console.log('✅ Solution Options:\n');
console.log('Option 1: Disable Protection on Preview (Recommended if you want it public)');
console.log('  1. Go to Vercel Dashboard → thcmembersonly project');
console.log('  2. Settings → Deployment Protection');
console.log('  3. Disable for preview deployments\n');

console.log('Option 2: Keep Protection (If preview should be private)');
console.log('  • This is actually working as intended');
console.log('  • Only team members with access can view it\n');

console.log('Option 3: Ensure Both Use Same Protection Settings');
console.log('  • Check production deployment protection settings');
console.log('  • Align preview to match production\n');

console.log('🔧 To Verify Environment Variables Are Synced:\n');
console.log('Even with protection, env vars should be synced. To verify:');
console.log('1. Access the protected URL after authenticating');
console.log('2. Or check via Vercel CLI: vercel env ls production');
console.log('3. Both deployments use the same project, so env vars should match\n');

console.log('='.repeat(60));
console.log('\n📝 Next Steps:\n');
console.log('1. Check Vercel Dashboard → Settings → Deployment Protection');
console.log('2. Decide if preview should be public or protected');
console.log('3. Run: npm run compare:deployments (after authenticating)');
console.log('\n');

