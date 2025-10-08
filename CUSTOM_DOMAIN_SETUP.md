# Custom Domain Setup for seroanalytics.org

## What I've Done

1. ✅ Updated `package.json` homepage to `https://seroanalytics.org/seroviz-web`
2. ✅ Created `public/CNAME` file with `seroanalytics.org`

## What You Need to Do

### Step 1: Configure GitHub Pages Custom Domain

1. Go to your repository: https://github.com/seroanalytics/seroviz-web
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Custom domain**, enter: `seroanalytics.org`
5. Check **Enforce HTTPS** (recommended)
6. Click **Save**

### Step 2: Configure DNS (Domain Provider)

You need to configure your DNS settings at your domain provider (where you bought seroanalytics.org):

**Option A: Apex Domain (seroanalytics.org)**
```
Type: A
Name: @
Value: 185.199.108.153
TTL: 3600

Type: A  
Name: @
Value: 185.199.109.153
TTL: 3600

Type: A
Name: @
Value: 185.199.110.153
TTL: 3600

Type: A
Name: @
Value: 185.199.111.153
TTL: 3600
```

**Option B: Subdomain (www.seroanalytics.org)**
```
Type: CNAME
Name: www
Value: seroanalytics.github.io
TTL: 3600
```

### Step 3: Wait for DNS Propagation

- DNS changes can take 24-48 hours to fully propagate
- You can check status at: https://www.whatsmydns.net/

### Step 4: Test the Setup

Once DNS is configured:
1. Visit: https://seroanalytics.org/seroviz-web/
2. The app should load correctly
3. All routing should work properly

## Alternative: Use GitHub Pages URL

If you don't want to set up a custom domain, you can simply use:
**https://seroanalytics.github.io/seroviz-web/**

## Troubleshooting

### If you get 404 errors:
1. Check that the CNAME file is in the `public/` directory
2. Verify the custom domain is set in GitHub Pages settings
3. Wait for DNS propagation (can take up to 48 hours)

### If HTTPS doesn't work:
1. Make sure "Enforce HTTPS" is checked in GitHub Pages settings
2. Wait for the SSL certificate to be issued (can take a few hours)

## Current Status

- ✅ Code changes committed
- ⏳ Waiting for you to configure GitHub Pages custom domain
- ⏳ Waiting for DNS configuration at domain provider
- ⏳ Waiting for DNS propagation
