#!/usr/bin/env node

/**
 * Environment Variables Sync Checklist
 * 
 * This script helps you identify which environment variables need to be synced
 * between your Vercel deployments.
 */

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'AWS_REGION',
  'S3_BUCKET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_PUBLIC_BASE_URL',
];

const optionalVars = [
  'INSTAGRAM_APP_ID',
  'INSTAGRAM_APP_SECRET',
  'INSTAGRAM_REDIRECT_URI',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'FACEBOOK_REDIRECT_URI',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'REDIS_URL',
  'SENTRY_DSN',
  'GOOGLE_ANALYTICS_ID',
  'RATE_LIMIT_ENABLED',
  'CORS_ORIGIN',
  'NODE_ENV',
];

console.log('📋 Environment Variables Sync Checklist\n');
console.log('='.repeat(60));
console.log('\n');

console.log('🔴 CRITICAL - Must match EXACTLY between deployments:');
console.log('─'.repeat(60));
requiredVars.forEach(varName => {
  console.log(`   • ${varName}`);
});
console.log('\n');

console.log('⚠️  CRITICAL - DATABASE_URL & NEXTAUTH_SECRET:');
console.log('   These MUST be identical in both projects for sync to work!');
console.log('   - DATABASE_URL: Both should point to the same database');
console.log('   - NEXTAUTH_SECRET: Must be the same secret for auth to work');
console.log('\n');

console.log('💡 IMPORTANT - NEXTAUTH_URL:');
console.log('   Can use production URL for both deployments:');
console.log('   - Production: https://thcmembersonly.vercel.app');
console.log('   - Preview: https://thcmembersonly.vercel.app (same as prod)');
console.log('   OR use separate URLs (may cause auth redirect issues)');
console.log('\n');

console.log('🟡 OPTIONAL - Copy if present:');
console.log('─'.repeat(60));
optionalVars.forEach(varName => {
  console.log(`   • ${varName}`);
});
console.log('\n');

console.log('📝 SYNC INSTRUCTIONS:');
console.log('─'.repeat(60));
console.log('1. Go to Vercel Dashboard → Production Project → Settings → Environment Variables');
console.log('2. Copy ALL required variables listed above');
console.log('3. Go to Preview Project → Settings → Environment Variables');
console.log('4. Add each variable with the SAME values (except NEXTAUTH_URL - see above)');
console.log('5. Ensure environment scope is set to: Production, Preview');
console.log('6. Redeploy both projects after adding variables');
console.log('\n');

console.log('✅ VERIFICATION:');
console.log('─'.repeat(60));
console.log('After syncing, run: npm run compare:deployments');
console.log('\n');
console.log('Expected results:');
console.log('  • Both health checks pass');
console.log('  • Both database status: "connected"');
console.log('  • Both return 200 on main page');
console.log('  • No missing environment variables');
console.log('\n');

console.log('📚 See SYNC_DEPLOYMENTS_GUIDE.md for detailed step-by-step instructions');
console.log('='.repeat(60));

