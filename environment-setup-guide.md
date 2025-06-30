# Environment Variables Setup Guide

## Overview

This project requires specific environment variables to be configured for Supabase integration. The runtime validation system will check for these variables and provide helpful error messages if they're missing or incorrectly formatted.

## Required Environment Variables

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Purpose**: Your Supabase project URL
- **Format**: Valid URL starting with `https://`
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Purpose**: Your Supabase anonymous/public key or publishable key
- **Format**: JWT token starting with `eyJ` (legacy) OR publishable key starting with `sb_publishable_` (new)
- **Example**: `sb_publishable_b_0ZLnCn3EWFrNldDEnlLA_Z-eW5gZn` OR `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → New API Keys (recommended) or legacy API keys

## Optional Environment Variables

### 3. `CUSTOM_KEY`
- **Purpose**: Additional custom configuration
- **Required**: No
- **Format**: Any string

## Setup Instructions

### Step 1: Create Environment File
Create a file named `.env.local` in your project root:

```bash
# In taskflow/
touch .env.local
```

### Step 2: Add Environment Variables
Copy this template into your `.env.local` file:

```env
# ==========================================
# REQUIRED: Supabase Configuration
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your-publishable-key

# ==========================================
# OPTIONAL: Additional Configuration
# ==========================================
# CUSTOM_KEY=your-custom-key
```

### Step 3: Get Supabase Credentials
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** and **anon public key**
5. Replace the placeholder values in your `.env.local` file

### Step 4: Restart Development Server
```bash
npm run dev
# or
yarn dev
```

## Environment Validation Features

This project includes comprehensive environment validation that:

### Server-Side Validation
- **Runs at startup**: Validates environment variables when the app starts
- **Blocks startup**: If critical variables are missing, the app won't start
- **Helpful errors**: Provides detailed error messages and setup instructions
- **Format validation**: Checks that URLs are valid and keys have the correct format

### Client-Side Validation (Development Only)
- **Runtime checks**: Validates environment variables in the browser
- **Visual feedback**: Shows a dismissible notification if issues are found
- **Development only**: Only appears in development mode
- **Console logging**: Logs validation results to browser console

### Validation Rules
- **URL format**: `NEXT_PUBLIC_SUPABASE_URL` must be a valid URL
- **Supabase URL**: Should contain "supabase" in the domain
- **Key format**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` should start with "eyJ" and be at least 50 characters
- **Environment consistency**: Warns if using production URLs in development

## Troubleshooting

### Common Issues

#### 1. "Missing required environment variable" error
- **Cause**: Environment variable not set or `.env.local` file missing
- **Solution**: Create `.env.local` file and add the missing variable

#### 2. "Invalid URL format" error
- **Cause**: `NEXT_PUBLIC_SUPABASE_URL` is not a valid URL
- **Solution**: Ensure the URL starts with `https://` and is correctly formatted

#### 3. "Invalid Supabase key format" error
- **Cause**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` doesn't look like a valid JWT token
- **Solution**: Copy the key exactly from Supabase dashboard, ensure it starts with `eyJ`

#### 4. Environment changes not taking effect
- **Cause**: Development server needs to be restarted after environment changes
- **Solution**: Stop the dev server (Ctrl+C) and restart with `npm run dev`

### Getting Help
If you continue having issues:
1. Check the console for detailed error messages
2. Verify your Supabase project is active and accessible
3. Ensure you're using the correct API keys (anon/public, not service role)
4. Try creating a fresh `.env.local` file from the template

## Security Notes

- **Never commit `.env.local`**: This file contains sensitive credentials
- **NEXT_PUBLIC_ variables**: These are exposed to the browser (safe for anon keys)
- **Service role key**: Do NOT use the service role key in client-side code
- **Production vs Development**: Use different Supabase projects for production and development

## Example Error Output

When environment validation fails, you'll see helpful output like this:

```
❌ Environment Validation Failed!

🚨 Missing or Invalid Environment Variables:
  • Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL
  • Invalid Supabase key format for NEXT_PUBLIC_SUPABASE_ANON_KEY

📋 Required Environment Variables:
  • NEXT_PUBLIC_SUPABASE_URL     - Your Supabase project URL
  • NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key

💡 How to Fix:
  1. Create a .env.local file in your project root
  2. Add the missing variables with correct values
  3. Restart your development server

📖 Example .env.local:
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔗 Get these values from: https://app.supabase.com/project/your-project/settings/api
``` 