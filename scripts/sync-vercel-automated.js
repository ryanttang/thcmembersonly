#!/usr/bin/env node

/**
 * Automated Vercel Deployment Sync Script
 * 
 * This script attempts to sync environment variables between Vercel deployments
 * by fetching from production and applying to preview.
 */

const { execSync } = require('child_process');
const https = require('https');

const DEPLOYMENTS = {
  preview: 'https://thcmembersonly-ryanttangs-projects.vercel.app',
  production: 'https://thcmembersonly.vercel.app'
};

// Required environment variables
const REQUIRED_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'AWS_REGION',
  'S3_BUCKET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_PUBLIC_BASE_URL',
];

// Helper to run Vercel CLI commands
function runVercelCommand(command) {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout?.toString() || error.stderr?.toString() };
  }
}

// Get environment variables from Vercel
function getEnvVars() {
  console.log('📥 Fetching environment variables from Vercel...\n');
  
  const result = runVercelCommand('vercel env ls --json');
  
  if (!result.success) {
    console.error('❌ Failed to fetch environment variables:', result.error);
    return null;
  }
  
  try {
    const envVars = JSON.parse(result.output);
    return envVars;
  } catch (error) {
    console.error('❌ Failed to parse environment variables:', error.message);
    return null;
  }
}

// Test health endpoint
function testHealthEndpoint(url) {
  return new Promise((resolve) => {
    https.get(`${url}/api/health`, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve({ success: res.statusCode === 200, health, status: res.statusCode });
        } catch {
          resolve({ success: false, status: res.statusCode, error: 'Invalid JSON' });
        }
      });
    }).on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

// Main sync function
async function syncDeployments() {
  console.log('🚀 Starting Automated Vercel Deployment Sync\n');
  console.log('='.repeat(60));
  console.log('\n');

  // Step 1: Test current status
  console.log('Step 1: Testing current deployment status...\n');
  
  const prodHealth = await testHealthEndpoint(DEPLOYMENTS.production);
  const previewHealth = await testHealthEndpoint(DEPLOYMENTS.preview);
  
  console.log(`📊 Production (${DEPLOYMENTS.production}):`);
  console.log(`   Status: ${prodHealth.success ? '✅ Healthy' : '❌ Failed'}`);
  if (prodHealth.health) {
    console.log(`   Database: ${prodHealth.health.database?.status || 'unknown'}`);
  }
  
  console.log(`\n📊 Preview (${DEPLOYMENTS.preview}):`);
  console.log(`   Status: ${previewHealth.success ? '✅ Healthy' : '❌ Failed'}`);
  if (previewHealth.health) {
    console.log(`   Database: ${previewHealth.health.database?.status || 'unknown'}`);
  }
  console.log('\n');

  // Step 2: Check if sync is needed
  if (prodHealth.success && previewHealth.success) {
    const prodDb = prodHealth.health?.database?.status;
    const previewDb = previewHealth.health?.database?.status;
    
    if (prodDb === 'connected' && previewDb === 'connected') {
      console.log('✅ Both deployments appear to be healthy and connected!');
      console.log('\n🔍 Running detailed comparison...\n');
      
      // Run comparison script
      try {
        execSync('npm run compare:deployments', { stdio: 'inherit' });
      } catch (error) {
        console.error('Comparison script had issues, but deployments seem healthy.');
      }
      
      return;
    }
  }

  // Step 3: Get environment variables
  console.log('Step 2: Fetching environment variables...\n');
  const envVars = getEnvVars();
  
  if (!envVars || !Array.isArray(envVars) || envVars.length === 0) {
    console.log('⚠️  Could not fetch environment variables via CLI.');
    console.log('📝 Manual steps required:');
    console.log('   1. Go to Vercel Dashboard → thcmembersonly project');
    console.log('   2. Settings → Environment Variables');
    console.log('   3. Copy all variables to the preview project');
    console.log('   4. See SYNC_DEPLOYMENTS_GUIDE.md for details\n');
    return;
  }

  console.log(`✅ Found ${envVars.length} environment variable(s)\n`);

  // Step 4: Check which variables are set
  console.log('Step 3: Checking required variables...\n');
  
  const requiredStatus = {};
  REQUIRED_VARS.forEach(varName => {
    const found = envVars.find(v => v.key === varName);
    requiredStatus[varName] = !!found;
    const status = found ? '✅' : '❌';
    console.log(`   ${status} ${varName}`);
  });
  
  const missing = Object.entries(requiredStatus).filter(([_, exists]) => !exists);
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing ${missing.length} required variable(s):`);
    missing.forEach(([varName]) => console.log(`   • ${varName}`));
    console.log('\n📝 Please set these in Vercel Dashboard first.\n');
    return;
  }

  console.log('\n✅ All required variables are present in production!\n');

  // Step 5: Instructions for manual sync
  console.log('Step 4: Manual sync required (Vercel CLI cannot set env vars programmatically)\n');
  console.log('📋 To complete the sync:\n');
  console.log('1. Go to Vercel Dashboard: https://vercel.com/dashboard');
  console.log('2. Find project: thcmembersonly');
  console.log('3. Settings → Environment Variables');
  console.log('4. For EACH variable below, copy it to the preview project:\n');
  
  envVars
    .filter(v => REQUIRED_VARS.includes(v.key))
    .forEach(v => {
      console.log(`   ${v.key} = [already set in production]`);
      if (v.target) {
        console.log(`      Scope: ${v.target.join(', ')}`);
      }
    });

  console.log('\n5. In preview project, ensure environment scope includes:');
  console.log('   ✅ Production');
  console.log('   ✅ Preview');
  
  console.log('\n6. Redeploy both projects after syncing\n');

  // Step 6: Verify sync
  console.log('Step 5: After syncing, run verification:\n');
  console.log('   npm run compare:deployments\n');
  
  console.log('='.repeat(60));
}

// Run sync
syncDeployments().catch(error => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});

