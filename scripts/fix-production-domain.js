#!/usr/bin/env node

/**
 * Fix Production Domain Sync Script
 * 
 * This script helps identify and fix the issue where thcmembersonly.vercel.app
 * is pointing to an older deployment while thcmembersonly-ryanttangs-projects.vercel.app
 * has the latest code.
 * 
 * Usage: node scripts/fix-production-domain.js
 */

const { execSync } = require('child_process');

const DEPLOYMENTS = {
  preview: 'https://thcmembersonly-ryanttangs-projects.vercel.app',
  production: 'https://thcmembersonly.vercel.app'
};

// Helper to run Vercel CLI commands
function runVercelCommand(command, silent = false) {
  try {
    const result = execSync(command, { 
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout?.toString() || error.stderr?.toString() 
    };
  }
}

// Check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Main fix function
async function fixProductionDomain() {
  console.log('🔧 Fixing Production Domain Sync Issue');
  console.log('='.repeat(60));
  console.log('\n');

  // Step 1: Check Vercel CLI
  console.log('Step 1: Checking Vercel CLI installation...');
  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI is not installed.');
    console.log('\n📥 Installing Vercel CLI...\n');
    const installResult = runVercelCommand('npm i -g vercel', false);
    if (!installResult.success) {
      console.error('❌ Failed to install Vercel CLI. Please install manually:');
      console.error('   npm i -g vercel\n');
      return;
    }
  }
  console.log('✅ Vercel CLI is installed\n');

  // Step 2: Check if logged in
  console.log('Step 2: Checking Vercel authentication...');
  const whoamiResult = runVercelCommand('vercel whoami', true);
  if (!whoamiResult.success) {
    console.log('⚠️  Not logged in to Vercel.');
    console.log('\n🔐 Please log in to Vercel:\n');
    console.log('   vercel login\n');
    console.log('After logging in, run this script again.\n');
    return;
  }
  console.log('✅ Authenticated with Vercel\n');

  // Step 3: Check current project link
  console.log('Step 3: Checking current project configuration...');
  const linkCheck = runVercelCommand('vercel ls', true);
  console.log('\n');

  // Step 4: Get deployment info
  console.log('Step 4: Getting deployment information...\n');
  const lsResult = runVercelCommand('vercel ls --json', true);
  
  if (lsResult.success && lsResult.output) {
    try {
      const deployments = JSON.parse(lsResult.output);
      console.log(`✅ Found ${deployments.deployments?.length || 0} deployment(s)\n`);
      
      // Find latest deployment
      if (deployments.deployments && deployments.deployments.length > 0) {
        const latest = deployments.deployments
          .filter(d => d.state === 'READY')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        if (latest) {
          console.log('📦 Latest deployment:');
          console.log(`   URL: ${latest.url}`);
          console.log(`   Created: ${new Date(latest.createdAt).toLocaleString()}`);
          console.log(`   State: ${latest.state}`);
          console.log(`   Git Commit: ${latest.meta?.gitCommitRef || 'N/A'}\n`);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not parse deployment info\n');
    }
  }

  // Step 5: Instructions for fixing
  console.log('Step 5: Fix Instructions');
  console.log('='.repeat(60));
  console.log('\n');
  console.log('The production domain is pointing to an older Vercel project.');
  console.log('Here\'s how to fix it:\n');
  console.log('OPTION A: Use Vercel CLI (Recommended)\n');
  console.log('1. Link to the correct project (if not already linked):');
  console.log('   vercel link');
  console.log('   (Select the project that matches: thcmembersonly-ryanttangs-projects)\n');
  console.log('2. Deploy to production:');
  console.log('   vercel --prod\n');
  console.log('3. Verify domains:');
  console.log('   vercel domains ls\n');
  console.log('\nOPTION B: Use Vercel Dashboard (Visual)\n');
  console.log('1. Go to: https://vercel.com/dashboard');
  console.log('2. Find the project: "thcmembersonly-ryanttangs-projects" (the one with latest code)');
  console.log('3. Go to Settings → Domains');
  console.log('4. Click "Add Domain" and enter: thcmembersonly.vercel.app');
  console.log('5. If domain already exists elsewhere, remove it from the old project first');
  console.log('6. Redeploy the project to apply changes\n');
  console.log('\nOPTION C: Force Redeploy\n');
  console.log('If the domain is already correct but showing old code:\n');
  console.log('1. Go to Vercel Dashboard → Deployments');
  console.log('2. Find the latest successful deployment');
  console.log('3. Click "⋯" → "Promote to Production"');
  console.log('4. Or trigger redeploy via git:');
  console.log('   git commit --allow-empty -m "Force production redeploy"');
  console.log('   git push origin main\n');
  console.log('\nAfter fixing, verify by:');
  console.log(`   1. Visit ${DEPLOYMENTS.production}/dashboard/coordination`);
  console.log('   2. Check that "Create Coordination Set" button shows version v2024-12-13');
  console.log('   3. Both URLs should show identical content\n');
  console.log('='.repeat(60));
}

// Run fix
fixProductionDomain().catch(error => {
  console.error('❌ Fix script failed:', error);
  process.exit(1);
});

