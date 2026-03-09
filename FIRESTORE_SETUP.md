# Firestore Connection Setup Guide

This document explains what information you need to provide to activate Firestore connections for **Aurika Flow**.

## Overview

The application supports **two isolated Firestore environments**:
- **TEST** (staging/development)
- **PROD** (production)

Each environment requires separate Firebase project credentials.

## Required Information

To activate Firestore connections, you need to provide the following for **each environment** (TEST and PROD):

### 1. Firebase Project ID

- **What it is**: The unique identifier for your Firebase project
- **Where to find**: Firebase Console → Project Settings → General → Project ID
- **Example**: `aurika-engage-test` or `aurika-engage-prod`

### 2. Service Account Credentials

You need to create a **Service Account** in Firebase and download the JSON key file. Here's what you need:

#### Step 1: Create Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file (keep it secure!)

#### Step 2: Extract Credentials

From the downloaded JSON file, extract these values:

**a) Client Email (FIREBASE_CLIENT_EMAIL)**
- **What it is**: The service account email address
- **Where to find**: In the JSON file, look for `client_email`
- **Example**: `firebase-adminsdk-xxxxx@aurika-engage-test.iam.gserviceaccount.com`

**b) Private Key (FIREBASE_PRIVATE_KEY)**
- **What it is**: The private key for the service account
- **Where to find**: In the JSON file, look for `private_key`
- **Important**: The private key must be formatted as a single line with `\n` for newlines
- **Example**: 
  ```
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
  ```

### 3. Database ID (Optional)

- **What it is**: The database ID if using Firestore multi-database feature
- **Default**: `(default)` if using single database
- **Where to find**: Firebase Console → Firestore Database → Database ID
- **Example**: `test` or `prod` (if using multi-database)

### 4. Region (Optional)

- **What it is**: The Firebase project region
- **Default**: `us-central1`
- **Where to find**: Firebase Console → Project Settings → General → Region
- **Example**: `us-central1`, `us-east1`, `europe-west1`, etc.

## Environment Variables Format

### For TEST Environment

Create a `.env.test` file (or set in your deployment platform):

```bash
APP_ENV=test
FIREBASE_PROJECT_ID=your-test-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@test-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIRESTORE_DATABASE_ID=test
FIREBASE_REGION=us-central1
DEFAULT_TENANT=drmorepen
```

### For PROD Environment

Create a `.env.production` file (or set in your deployment platform):

```bash
APP_ENV=prod
FIREBASE_PROJECT_ID=your-prod-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@prod-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIRESTORE_DATABASE_ID=prod
FIREBASE_REGION=us-central1
DEFAULT_TENANT=drmorepen
```

### For Local Development

Create a `.env.local` file:

**Option 1: Using Firestore Emulator** (Recommended for local dev)
```bash
APP_ENV=local
FIREBASE_EMULATOR_HOST=localhost:8080
DEFAULT_TENANT=drmorepen
```

**Option 2: Connecting to TEST Firestore**
```bash
APP_ENV=local
FIREBASE_PROJECT_ID=your-test-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@test-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIRESTORE_DATABASE_ID=(default)
DEFAULT_TENANT=drmorepen
```

## Important Notes

### Private Key Formatting

The `FIREBASE_PRIVATE_KEY` must be properly formatted:
- **Single line** with escaped newlines (`\n`)
- When setting in environment variables, wrap in quotes
- The newlines in the key must be escaped as `\n`

**Example of correct format:**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Security Best Practices

1. **Never commit** `.env` files to version control (they're in `.gitignore`)
2. **Keep service account keys secure** - treat them like passwords
3. **Use different service accounts** for TEST and PROD
4. **Rotate keys regularly** for security
5. **Use environment variables** in deployment platforms (Vercel, Railway, etc.)

## Setting Up Firestore

### Step 1: Create Firebase Projects

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create two projects:
   - **TEST Project**: `aurika-engage-test` (or your naming)
   - **PROD Project**: `aurika-engage-prod` (or your naming)

### Step 2: Enable Firestore

1. In each project, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Production mode** (we use server-side only, so rules are permissive)
4. Select your **region** (e.g., `us-central1`)
5. Click **Enable**

### Step 3: Create Service Accounts

1. In each project, go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract the credentials as described above

### Step 4: Set Up Firestore Rules

1. Go to **Firestore Database** → **Rules**
2. Copy the rules from `firestore.rules` in this project
3. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Step 5: Create Indexes

1. Go to **Firestore Database** → **Indexes**
2. Copy indexes from `firestore.indexes.json` in this project
3. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

Or use the script:
```bash
npm run db:migrate-indexes
```

## Testing the Connection

### Local Development (with Emulator)

1. Install Firebase Tools:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase (if not already):
   ```bash
   firebase init emulators
   # Select Firestore emulator
   ```

3. Start emulator:
   ```bash
   firebase emulators:start
   ```

4. Create `.env.local`:
   ```bash
   APP_ENV=local
   FIREBASE_EMULATOR_HOST=localhost:8080
   DEFAULT_TENANT=drmorepen
   ```

5. Run the app:
   ```bash
   npm run dev:local
   ```

### Testing with TEST Firestore

1. Create `.env.test` with TEST credentials (see above)
2. Run:
   ```bash
   npm run dev:test
   ```

## Checklist

Before providing credentials, ensure you have:

- [ ] Created TEST Firebase project
- [ ] Created PROD Firebase project
- [ ] Enabled Firestore in both projects
- [ ] Created service accounts for both projects
- [ ] Downloaded service account JSON files
- [ ] Extracted `project_id` (FIREBASE_PROJECT_ID)
- [ ] Extracted `client_email` (FIREBASE_CLIENT_EMAIL)
- [ ] Extracted `private_key` (FIREBASE_PRIVATE_KEY) - properly formatted
- [ ] Noted database IDs (if using multi-database)
- [ ] Noted regions for both projects
- [ ] Deployed Firestore rules
- [ ] Created Firestore indexes

## What to Provide

Please provide the following information for **each environment** (TEST and PROD):

### TEST Environment:
```
FIREBASE_PROJECT_ID=?
FIREBASE_CLIENT_EMAIL=?
FIREBASE_PRIVATE_KEY=? (formatted with \n)
FIRESTORE_DATABASE_ID=? (or "(default)")
FIREBASE_REGION=?
```

### PROD Environment:
```
FIREBASE_PROJECT_ID=?
FIREBASE_CLIENT_EMAIL=?
FIREBASE_PRIVATE_KEY=? (formatted with \n)
FIRESTORE_DATABASE_ID=? (or "(default)")
FIREBASE_REGION=?
```

## Troubleshooting

### "Missing Firebase credentials" Error

- Ensure all required environment variables are set
- Check that `FIREBASE_PRIVATE_KEY` has proper `\n` escaping
- Verify `.env` file is in the project root

### "Permission denied" Error

- Check service account has proper permissions
- Verify Firestore is enabled in Firebase Console
- Check Firestore rules are deployed

### Connection Timeout

- Verify project ID is correct
- Check network connectivity
- For emulator: ensure `firebase emulators:start` is running

## Next Steps

After providing credentials:

1. I'll create the environment files
2. Test the connection to Firestore
3. Seed the database with initial data
4. Verify all pages load correctly

---

**Questions?** Refer to the main README.md or check Firebase documentation.

