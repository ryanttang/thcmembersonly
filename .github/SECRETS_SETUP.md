# GitHub Secrets Setup Guide

This repository requires GitHub Secrets to be configured for CI/CD builds to work properly.

## Required Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

### 🔴 Critical (Build will fail without these):

1. **`DATABASE_URL`**
   - Format: `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public`
   - Example: `postgresql://postgres:mypassword@db.example.com:5432/eventsdb?schema=public`
   - **Required for:** Database connections during build

2. **`NEXTAUTH_SECRET`**
   - Generate with: `openssl rand -base64 32`
   - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - **Required for:** NextAuth.js session encryption

### 🟡 Recommended (Build will work but features may fail):

3. **`NEXTAUTH_URL`**
   - Your production URL: `https://thcmembersonlyclub.com`
   - Defaults to `http://localhost:3000` if not set

4. **`AWS_ACCESS_KEY_ID`**
   - Your AWS IAM access key ID
   - **Required for:** S3 image uploads

5. **`AWS_SECRET_ACCESS_KEY`**
   - Your AWS IAM secret access key
   - **Required for:** S3 image uploads

6. **`S3_BUCKET`**
   - Your S3 bucket name (default: `thcmembersonlyclub`)
   - **Required for:** S3 image uploads

7. **`S3_PUBLIC_BASE_URL`**
   - Your S3 bucket public URL
   - Example: `https://thcmembersonlyclub.s3.us-west-2.amazonaws.com`

8. **`AWS_REGION`**
   - Your AWS region (default: `us-west-2`)

### 🟢 Optional:

9. **`SNYK_TOKEN`**
   - Snyk security scanning token (optional)
   - Get from: https://snyk.io/

## Quick Setup

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Then add all secrets in GitHub:
# Settings → Secrets and variables → Actions → New repository secret
```

## Verification

After adding secrets, the workflow will:
1. ✅ Validate that required secrets exist
2. ✅ Build the application with real credentials
3. ✅ Fail fast if secrets are missing (no more dummy value issues!)

## Troubleshooting

**Build fails with "secret is not set":**
- Go to Settings → Secrets and variables → Actions
- Verify the secret name matches exactly (case-sensitive)
- Re-run the workflow

**Build works but runtime fails:**
- Check that secrets match your production environment
- Verify DATABASE_URL is accessible from GitHub Actions
- Check AWS credentials have correct permissions

