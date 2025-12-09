This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment Variables

This project requires Supabase environment variables to be configured.

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Your Supabase anonymous/public key

### Local Development

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

**Note:** Never commit `.env.local` to version control. It should already be in `.gitignore`.

### Production Deployment

**Critical:** Variables prefixed with `NEXT_PUBLIC_` are embedded at **build time**. They must be available during the build process, not just at runtime.

#### Option 1: Vercel (Recommended for Next.js)

1. Go to your project on [Vercel Dashboard](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
4. Select the environments (Production, Preview, Development) where they should be available
5. **Redeploy** your application (the variables are only applied to new builds)

**Quick Deploy:**
```bash
# After setting variables in Vercel dashboard
vercel --prod
```

#### Option 2: Netlify

1. Go to your site on [Netlify Dashboard](https://app.netlify.com)
2. Navigate to **Site settings** → **Environment variables**
3. Add both variables
4. Click **Trigger deploy** → **Deploy site** to rebuild with new variables

#### Option 3: Docker

Create a `.env.production` file or use environment variables:

```dockerfile
# In your Dockerfile or docker-compose.yml
ENV NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

Or use docker-compose:
```yaml
services:
  app:
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY}
```

#### Option 4: Manual/CI/CD Build

Export variables before building:

```bash
# Linux/Mac
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
npm run build

# Windows PowerShell
$env:NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="your_supabase_anon_key"
npm run build

# Windows CMD
set NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
npm run build
```

#### Option 5: GitHub Actions / Other CI/CD

Add secrets to your CI/CD platform and reference them in your workflow:

```yaml
# Example GitHub Actions
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY }}
```

### Verifying Environment Variables

After deployment, you can verify your environment variables are set correctly by checking the application. The app includes built-in validation that will display helpful error messages if variables are missing.

### Troubleshooting

- **Variables are undefined in production:** Make sure you set them in your deployment platform **before** building, then trigger a new build/deploy
- **Variables work locally but not in production:** Check that you set them in the correct environment (Production vs Preview)
- **Build succeeds but app fails:** Check browser console for environment variable errors

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
