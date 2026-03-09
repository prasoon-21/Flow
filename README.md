# Aurika Flow

Business operations MVP with in-memory data, built with TypeScript, Next.js, and tRPC.

## Overview

Aurika Flow is a clean MVP foundation for business operations covering:
- **Orders** — Create and track customer orders
- **Inventory** — Product catalogue with stock levels
- **Purchases** — Supplier purchase orders
- **Ledger** — Debit/credit transaction log with balances
- **Contacts** — Customers and suppliers
- **Reports** — Revenue, inventory value, and outstanding balances

The system uses in-memory data stores with page-level access control and role-based permissions.

## Architecture

The application follows a layered architecture:

```
┌─────────────────┐
│   Frontend UI   │  (Next.js Pages)
└────────┬────────┘
         │
┌────────▼────────┐
│   API Layer     │  (tRPC)
└────────┬────────┘
         │
┌────────▼────────┐
│  Service Layer  │  (Business Logic + Tenancy Guards)
└────────┬────────┘
         │
┌────────▼────────┐
│ Adapter Layer   │  (Firestore Repositories)
└────────┬────────┘
         │
┌────────▼────────┐
│   Firestore     │  (Database)
└─────────────────┘
```

### Key Principles

1. **Server-side only for data**: All data access runs through the server. No direct client SDK writes.
2. **Multi-tenant ready**: Every request carries tenant context. No hard-coded tenant logic.
3. **Page-level access control**: Guards check role + tenant before allowing page access.
4. **Modular structure**: Easy to extend with feature-level toggles later.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript (strict mode)
- **API**: tRPC for type-safe API calls
- **Database**: Google Firestore (NoSQL)
- **Styling**: Styled JSX (can be extended with Tailwind/CSS modules)

## Project Structure

```
.
├── components/          # React components
│   └── layout/         # Layout components (Sidebar, Header, Layout)
├── lib/
│   ├── config/         # Environment configuration
│   ├── types/          # TypeScript types
│   └── trpc/           # tRPC client setup
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   │   └── trpc/       # tRPC API handler
│   ├── email/          # Email channel page
│   ├── whatsapp/       # WhatsApp channel page
│   ├── chatbot/        # Chatbot channel page
│   └── ivr/            # IVR channel page
├── server/
│   ├── adapters/       # Adapter layer (repositories)
│   │   ├── firestore.ts
│   │   └── repositories/
│   ├── api/            # API layer (tRPC routers)
│   │   ├── trpc.ts
│   │   ├── root.ts
│   │   └── routers/
│   ├── middleware/     # Middleware (tenancy, access guards)
│   └── services/       # Service layer (business logic)
├── scripts/            # Utility scripts
│   ├── seed.ts         # Seed database
│   └── migrate-indexes.ts
├── firestore.indexes.json  # Firestore index definitions
├── firestore.rules     # Firestore security rules
└── package.json
```

## Environment Setup

### Required Environment Variables

The application supports two isolated Firestore environments: **TEST** and **PROD**.

#### For TEST Environment:

```bash
APP_ENV=test
FIREBASE_PROJECT_ID=your-test-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@test-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIRESTORE_DATABASE_ID=test  # Optional, for multi-database
DEFAULT_TENANT=drmorepen
```

#### For PROD Environment:

```bash
APP_ENV=prod
FIREBASE_PROJECT_ID=your-prod-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@prod-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIRESTORE_DATABASE_ID=prod  # Optional, for multi-database
DEFAULT_TENANT=drmorepen
```

#### For Local Development (with Emulator):

```bash
APP_ENV=local
FIREBASE_EMULATOR_HOST=localhost:8080
DEFAULT_TENANT=drmorepen
```

> **Note**: The `FIREBASE_PRIVATE_KEY` must have escaped newlines (`\n`). When setting in environment variables, ensure proper escaping.

### Google OAuth (Email experiments)

To test the Gmail integration on the Email page, set these additional variables:

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
SESSION_SECRET=any-long-random-string
```

The OAuth client must allow the redirect URI shown above. Use a long random value for `SESSION_SECRET`; it is used to sign OAuth state cookies.

### Cloud Storage (attachments & uploads)

Email attachments (and any future uploaded files) are stored in Cloudflare R2 via its S3-compatible API. Add these variables to any environment that needs file storage:

```bash
CLOUDFLARE_ACCOUNT_ID=your-r2-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET=your-r2-bucket-name
CLOUDFLARE_R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
# Optional: public/base URL (e.g., Worker or custom domain) for direct links
# CLOUDFLARE_R2_PUBLIC_BASE_URL=https://files.example.com
```

If the endpoint you copy from the R2 dashboard includes the bucket name at the end, keep `CLOUDFLARE_R2_BUCKET` as the bucket value and use the base host (`https://<account>.r2.cloudflarestorage.com`) for `CLOUDFLARE_R2_ENDPOINT`. The app will generate short-lived signed URLs for downloads when no public base URL is provided.

### Setting Up Firebase

1. **Create Firebase Projects** (recommended: separate TEST and PROD projects)
   - Create a Firebase project for TEST
   - Create a Firebase project for PROD

2. **Create Service Account**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Download the JSON file
   - Extract:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY` (escape newlines)

3. **Enable Firestore**
   - Enable Firestore in both projects
   - Choose location (e.g., `us-central1`)

4. **Set Up Firestore Emulator** (optional, for local dev)
   ```bash
   npm install -g firebase-tools
   firebase init emulators
   # Select Firestore emulator
   firebase emulators:start
   ```

## Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create `.env.local` for local development
   - Create `.env.test` for TEST environment
   - Create `.env.production` for PROD environment

4. **Seed the database** (optional, for initial setup):
   ```bash
   npm run db:seed
   ```

5. **Apply Firestore indexes**:
   ```bash
   npm run db:migrate-indexes
   ```
   > Note: This validates indexes. To actually deploy, use Firebase CLI:
   > ```bash
   > firebase deploy --only firestore:indexes
   > ```

## Default Credentials

The seed script provisions two accounts that you can use on the `/login` screen:

| User ID              | Password   | Role   | Access Scope                  |
| -------------------- | ---------- | ------ | ----------------------------- |
| `drmorepen_admin`    | `@dmin@2025` | admin | All channels and analytics    |
| `drmorepen_manisha`  | `M@nish@25` | viewer | Home + IVR (analytics + calls) |

Feel free to adjust or remove these users after bootstrapping production data.

## Running the Application

### Local Development (with Emulator)

```bash
npm run dev:local
```

Runs on `http://localhost:3000` with Firestore emulator.

### Local Development (against TEST)

```bash
npm run dev:test
```

Runs on `http://localhost:3000` connected to TEST Firestore.

### Production Build

```bash
# Build
npm run build:prod

# Start
npm run start:prod
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:local` | Start dev server with emulator or TEST creds |
| `npm run dev:test` | Start dev server against TEST environment |
| `npm run start:prod` | Start production server against PROD |
| `npm run build` | Build for current environment |
| `npm run build:test` | Build for TEST environment |
| `npm run build:prod` | Build for PROD environment |
| `npm run db:seed` | Seed database with minimal tenant/page stubs |
| `npm run db:migrate-indexes` | Validate and show instructions for index migration |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |

## Switching Environments

The application uses `APP_ENV` to determine which environment to connect to:

- **`local`**: Uses emulator or TEST credentials (default if not set)
- **`test`**: Connects to TEST Firestore
- **`prod`**: Connects to PROD Firestore

Set the environment variable before running commands:

```bash
# TEST
APP_ENV=test npm run dev:test

# PROD
APP_ENV=prod npm run start:prod
```

## Adding a New Tenant

1. **Create tenant document in Firestore**:
   ```javascript
   {
     id: "new-tenant-id",
     name: "New Tenant Name",
     slug: "new-tenant-slug",
     createdAt: new Date(),
     updatedAt: new Date()
   }
   ```

2. **Create tenant-specific pages** (if needed):
   ```javascript
   {
     name: "Custom Page",
     path: "/custom",
     tenantId: "new-tenant-id",
     moduleKey: "custom-module",
     requiredModules: ["custom-module"],
     createdAt: new Date(),
     updatedAt: new Date()
   }
   ```

3. **Create channels for the tenant**:
   ```javascript
   {
     type: "email",
     name: "Email Channel",
     tenantId: "new-tenant-id",
     isActive: true,
     config: {},
     createdAt: new Date(),
     updatedAt: new Date()
   }
   ```

4. **Create users for the tenant**:
   ```javascript
   {
     email: "user@newtenant.com",
     name: "User Name",
     role: "admin",
     modules: ["custom-module", "ivr"],
     tenantId: "new-tenant-id",
     createdAt: new Date(),
     updatedAt: new Date()
   }
   ```

## Adding a New Page/Module

1. **Create the page component** in `pages/[module]/index.tsx`

2. **Add page definition to Firestore**:
   - Shared page: `tenantId: null`
   - Tenant-specific: `tenantId: "tenant-id"`

3. **Add route to sidebar** in `components/layout/Sidebar.tsx`

4. **Access control**: The service layer automatically checks page access based on:
   - Tenant match (if tenant-specific)
   - Role requirement (if specified)

## Access Control

### Page-Level Access

Pages have access control based on:
- **Tenant**: Pages can be shared (`tenantId: null`) or tenant-specific
- **Role**: Minimum role required (`viewer`, `agent`, `admin`)

### Role Hierarchy

```
viewer < agent < admin
```

- **viewer**: Read-only access
- **agent**: Can interact with conversations
- **admin**: Full access

### Tenancy Guards

All service layer methods enforce tenancy:
- Users can only access data from their tenant
- Requests automatically include tenant context
- Guards throw errors if tenant mismatch detected

## Firestore Collections

### Core Collections

- **`tenants`**: Tenant information
- **`users`**: User accounts with roles
- **`pages`**: Page definitions with access control
- **`channels`**: Communication channels (email, whatsapp, etc.)
- **`conversations`**: Customer conversations
- **`tickets`**: Support tickets

### Security Rules

Firestore security rules are defined in `firestore.rules`:
- **Server-only writes**: All writes go through service account
- **Client reads**: Limited based on tenant membership
- **Default deny**: All other access is denied

To deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Development Guidelines

### TypeScript

- Strict mode enabled
- All types defined in `lib/types/`
- No `any` types (warnings only for now)

### Code Style

- ESLint + Prettier configured
- Run `npm run format` before committing
- Run `npm run lint` to check for issues

### Adding Features

1. **Add repository** (if new collection): `server/adapters/repositories/`
2. **Add service**: `server/services/`
3. **Add tRPC router**: `server/api/routers/`
4. **Add UI component**: `components/` or `pages/`

### Error Handling

- Service layer throws errors for business logic failures
- tRPC converts errors to appropriate HTTP responses
- Frontend should handle errors gracefully

## Troubleshooting

### Firestore Connection Issues

1. Check environment variables are set correctly
2. Verify service account credentials
3. Check Firestore is enabled in Firebase Console
4. For emulator: ensure `firebase emulators:start` is running

### Tenant Context Missing

- Ensure request includes `x-tenant-id` header (or uses default)
- Check `DEFAULT_TENANT` environment variable
- Verify user exists in Firestore with correct `tenantId`

### Access Denied Errors

- Check user role meets page requirement
- Verify tenant matches page tenant (if tenant-specific)
- Check Firestore security rules

## Next Steps

1. **Get Firebase credentials** (TEST and PROD):
   - Service account JSON files
   - Project IDs
   - Database IDs (if using multi-database)

2. **Set up deployment**:
   - Configure environment variables in Vercel/Railway/etc.
   - Set up CI/CD pipeline

3. **Implement actual data fetching**:
   - Replace stub pages with real data
   - Connect channels to actual conversation data

4. **Add authentication**:
   - Replace auth placeholder with real auth (Firebase Auth, NextAuth, etc.)
   - Implement JWT/session handling

5. **Extend with feature-level toggles**:
   - Add feature flags collection
   - Extend access guards to check features

## Support

For issues or questions, refer to the codebase structure and inline documentation.

---

**Built with ❤️ for multi-tenant support systems**
