# Hostinger hPanel Deployment & Test Branch Guide

This guide is tailored specifically for **Hostinger Shared Hosting (hPanel)** without VPS root access.

---

## 🌿 1. Git Test Branch Status
- **Current Active Branch**: `test`
- **Main Branch**: `main`

To push this repository to your GitHub/GitLab:
```bash
# Add your remote repository (if not already added)
git remote add origin https://github.com/your-username/your-repo-name.git

# Push both main and test branches
git push -u origin main
git push -u origin test
```

---

## 🚀 2. Setting Up a Test Environment in Hostinger hPanel

### Step A: Create a Test Subdomain
1. Log in to **Hostinger hPanel**.
2. Go to **Websites** → Select your domain → click **Manage**.
3. Under the **Domains** section in the left sidebar, click **Subdomains**.
4. Create a subdomain:
   - **Subdomain Name**: `test` (creates `test.yourdomain.com`)
   - **Custom folder for subdomain**: Check this box and specify `public_html/test` (or leave default).
   - Click **Create**.

---

### Step B: Deploying the Test Build to Hostinger

#### Method 1: Uploading Built Files (Simplest & Fast)
Since Hostinger shared hosting runs high-performance LiteSpeed web server:
1. Build the production files:
   ```bash
   npm run build
   ```
2. Open the generated `dist/` directory. It contains:
   - `index.html`
   - `assets/` (bundled JS & CSS)
   - `.htaccess` (pre-configured for Single Page App routing & Gzip compression)
3. In **hPanel**, open **File Manager** (under Files).
4. Navigate to `public_html/test/` (or your subdomain directory).
5. Upload all the contents inside `dist/` (or zip `dist/*` and extract it inside `public_html/test/`).
6. Visit `https://test.yourdomain.com`!

---

#### Method 2: Automatic Git Deployment in hPanel
Hostinger hPanel has a built-in **Git** feature:
1. In hPanel, go to **Advanced** → **Git**.
2. Click **Create Repository**:
   - **Repository**: Paste your GitHub/GitLab repository URL (e.g. `https://github.com/username/tyee-steelhead-tracker.git`).
   - **Branch**: Select `test`.
   - **Install Directory**: `public_html/test` (or `public_html/subdomains/test`).
3. Click **Create**.
4. Whenever you push new commits to the `test` branch:
   - Click **Deploy** or set up Hostinger's Webhook in your GitHub repo settings (**Settings** → **Webhooks**) for automatic instant deployment upon `git push origin test`.

---

#### Method 3: GitHub Actions Auto-Deploy (Recommended for Continuous Deployment)
You can automate testing and deploying directly to your Hostinger test subdomain via FTP whenever you push to `test`.

Create `.github/workflows/deploy-test.yml`:
```yaml
name: Deploy Test Branch to Hostinger

on:
  push:
    branches: [ test ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Deploy to Hostinger via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.HOSTINGER_FTP_HOST }}
          username: ${{ secrets.HOSTINGER_FTP_USER }}
          password: ${{ secrets.HOSTINGER_FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./public_html/test/
```

---

## ⚙️ 3. Routing & `.htaccess` Setup
The project includes a production-ready `public/.htaccess` that is automatically included in `dist/`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```
*Note: If you run the test app in a subfolder (e.g., `yourdomain.com/test/` instead of a subdomain), change `RewriteBase /` to `RewriteBase /test/`.*

---

## 🔒 4. Environment Variables on Hostinger
If using Gemini AI analyst features on the test branch:
- Set `VITE_GEMINI_API_KEY` in your `.env` or build environment, or use Hostinger's Node.js Environment configuration if running the full-stack server.
