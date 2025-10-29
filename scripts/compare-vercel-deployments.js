#!/usr/bin/env node

const https = require('https');

// Configuration
const DEPLOYMENTS = {
  preview: 'https://thcmembersonly-ryanttangs-projects.vercel.app',
  production: 'https://thcmembersonly.vercel.app'
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 10000;
    const req = https.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Extract version/build info from response
function extractVersionInfo(response) {
  const info = {
    status: response.status,
    url: response.url,
    headers: {},
    hasData: !!response.data,
    dataLength: response.data?.length || 0
  };

  // Check for common version indicators in headers
  const versionHeaders = [
    'x-vercel-id',
    'x-vercel-deployment-url',
    'x-powered-by',
    'server',
    'etag'
  ];

  versionHeaders.forEach(header => {
    if (response.headers[header]) {
      info.headers[header] = response.headers[header];
    }
  });

  // Try to extract version from HTML if present
  if (response.data) {
    const html = response.data.toString();
    // Look for build hash, version, or other identifiers
    const metaVersion = html.match(/<meta[^>]*version[^>]*>/i);
    if (metaVersion) info.versionMeta = metaVersion[0];
    
    // Check for specific content that might indicate version differences
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) info.title = titleMatch[1];
  }

  return info;
}

// Test health endpoint
async function testHealthEndpoint(deployment) {
  try {
    const response = await makeRequest(`${deployment}/api/health`);
    if (response.status === 200) {
      return JSON.parse(response.data);
    }
    return null;
  } catch (error) {
    return { error: error.message };
  }
}

// Test main page
async function testMainPage(deployment) {
  try {
    const response = await makeRequest(`${deployment}`);
    return extractVersionInfo(response);
  } catch (error) {
    return { error: error.message };
  }
}

// Compare two health responses
function compareHealth(previewHealth, prodHealth) {
  const differences = [];
  
  if (!previewHealth || !prodHealth) {
    differences.push('One or both deployments failed health check');
    return differences;
  }

  // Compare database connection
  if (previewHealth.database?.status !== prodHealth.database?.status) {
    differences.push(
      `Database status mismatch: Preview=${previewHealth.database?.status}, Production=${prodHealth.database?.status}`
    );
  }

  // Compare environment
  if (previewHealth.environment !== prodHealth.environment) {
    differences.push(
      `Environment mismatch: Preview=${previewHealth.environment}, Production=${prodHealth.environment}`
    );
  }

  // Compare environment variables
  if (previewHealth.environment_variables?.missing?.length !== 
      prodHealth.environment_variables?.missing?.length) {
    differences.push(
      `Missing env vars differ: Preview missing ${previewHealth.environment_variables?.missing?.length || 0}, ` +
      `Production missing ${prodHealth.environment_variables?.missing?.length || 0}`
    );
  }

  return differences;
}

// Main comparison function
async function compareDeployments() {
  console.log('🔍 Comparing Vercel Deployments');
  console.log('================================\n');

  console.log(`📦 Preview: ${DEPLOYMENTS.preview}`);
  console.log(`🚀 Production: ${DEPLOYMENTS.production}\n`);

  // Test both deployments
  console.log('Testing Preview Deployment...');
  const previewHealth = await testHealthEndpoint(DEPLOYMENTS.preview);
  const previewPage = await testMainPage(DEPLOYMENTS.preview);
  
  console.log('Testing Production Deployment...');
  const prodHealth = await testHealthEndpoint(DEPLOYMENTS.production);
  const prodPage = await testMainPage(DEPLOYMENTS.production);

  console.log('\n');

  // Display results
  console.log('📊 Preview Deployment:');
  console.log('----------------------');
  if (previewHealth && !previewHealth.error) {
    console.log(`✅ Health Check: ${previewHealth.status}`);
    console.log(`   Database: ${previewHealth.database?.status || 'unknown'}`);
    console.log(`   Environment: ${previewHealth.environment || 'unknown'}`);
    if (previewHealth.environment_variables?.missing?.length > 0) {
      console.log(`   ⚠️  Missing env vars: ${previewHealth.environment_variables.missing.join(', ')}`);
    }
  } else {
    console.log(`❌ Health Check Failed: ${previewHealth?.error || 'Unknown error'}`);
  }
  if (previewPage && !previewPage.error) {
    console.log(`✅ Main Page: ${previewPage.status}`);
    if (previewPage.headers['x-vercel-id']) {
      console.log(`   Vercel ID: ${previewPage.headers['x-vercel-id']}`);
    }
    if (previewPage.title) {
      console.log(`   Title: ${previewPage.title}`);
    }
  } else {
    console.log(`❌ Main Page Failed: ${previewPage?.error || 'Unknown error'}`);
  }

  console.log('\n');

  console.log('📊 Production Deployment:');
  console.log('-------------------------');
  if (prodHealth && !prodHealth.error) {
    console.log(`✅ Health Check: ${prodHealth.status}`);
    console.log(`   Database: ${prodHealth.database?.status || 'unknown'}`);
    console.log(`   Environment: ${prodHealth.environment || 'unknown'}`);
    if (prodHealth.environment_variables?.missing?.length > 0) {
      console.log(`   ⚠️  Missing env vars: ${prodHealth.environment_variables.missing.join(', ')}`);
    }
  } else {
    console.log(`❌ Health Check Failed: ${prodHealth?.error || 'Unknown error'}`);
  }
  if (prodPage && !prodPage.error) {
    console.log(`✅ Main Page: ${prodPage.status}`);
    if (prodPage.headers['x-vercel-id']) {
      console.log(`   Vercel ID: ${prodPage.headers['x-vercel-id']}`);
    }
    if (prodPage.title) {
      console.log(`   Title: ${prodPage.title}`);
    }
  } else {
    console.log(`❌ Main Page Failed: ${prodPage?.error || 'Unknown error'}`);
  }

  console.log('\n');

  // Compare
  console.log('🔍 Comparison Results:');
  console.log('----------------------');

  // Compare health endpoints
  if (previewHealth && prodHealth && !previewHealth.error && !prodHealth.error) {
    const healthDiffs = compareHealth(previewHealth, prodHealth);
    if (healthDiffs.length === 0) {
      console.log('✅ Health endpoints are identical');
    } else {
      console.log('❌ Health endpoint differences:');
      healthDiffs.forEach(diff => console.log(`   • ${diff}`));
    }
  }

  // Compare Vercel IDs (if different, they're different deployments)
  if (previewPage?.headers?.['x-vercel-id'] && prodPage?.headers?.['x-vercel-id']) {
    const previewId = previewPage.headers['x-vercel-id'];
    const prodId = prodPage.headers['x-vercel-id'];
    
    if (previewId === prodId) {
      console.log('✅ Same Vercel deployment ID (deployments are in sync)');
    } else {
      console.log('⚠️  Different Vercel deployment IDs:');
      console.log(`   Preview: ${previewId}`);
      console.log(`   Production: ${prodId}`);
      console.log('   → These are different deployments!');
    }
  }

  // Compare page titles
  if (previewPage?.title && prodPage?.title) {
    if (previewPage.title === prodPage.title) {
      console.log('✅ Page titles match');
    } else {
      console.log('⚠️  Page titles differ:');
      console.log(`   Preview: ${previewPage.title}`);
      console.log(`   Production: ${prodPage.title}`);
    }
  }

  // Recommendations
  console.log('\n');
  console.log('💡 Recommendations:');
  console.log('-------------------');
  
  if (previewPage?.headers?.['x-vercel-id'] !== prodPage?.headers?.['x-vercel-id']) {
    console.log('1. ⚠️  Deployments are out of sync. These are different deployments.');
    console.log('2. Go to Vercel Dashboard and check which project each URL belongs to.');
    console.log('3. Ensure production domain points to the same project as preview.');
    console.log('4. Redeploy the production domain to match preview.');
  } else {
    console.log('✅ Deployments appear to be in sync.');
  }

  if (previewHealth?.database?.status !== prodHealth?.database?.status) {
    console.log('5. ⚠️  Database connections differ. Check environment variables.');
    console.log('6. Ensure both deployments use the same DATABASE_URL.');
  }

  console.log('\n');
  console.log('📝 Next Steps:');
  console.log('   1. Review VERCEL_SYNC_FIX.md for detailed instructions');
  console.log('   2. Check Vercel Dashboard for project configuration');
  console.log('   3. Verify domain settings in Vercel');
  console.log('   4. Ensure environment variables match in both deployments');
}

// Run comparison
compareDeployments().catch(error => {
  console.error('❌ Comparison failed:', error);
  process.exit(1);
});

