# Frontend Deployment Guide - ITOps SaaS Platform

## Prerequisites

### Required Software
- **Node.js**: 18.x or 20.x (LTS)
- **npm**: 9.x or 10.x
- **Git**: Latest version
- **Nginx**: For serving static files

## Installation Steps

### 1. Install Node.js and npm (Ubuntu/Debian)

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

**Alternative - Using nvm (recommended):**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
npm --version
```

### 2. Clone Repository

```bash
# Clone repository
git clone <your-repository-url>
cd itops-saas-frontend
```

### 3. Configure Environment

```bash
# Create environment file
nano .env.production
```

**Environment Configuration (.env.production):**

```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com/api/v1

# App Configuration
VITE_APP_NAME=ITOps SaaS Platform
VITE_APP_VERSION=1.0.0
```

### 4. Install Dependencies

```bash
# Install all packages
npm install

# Or using clean install
npm ci
```

### 5. Build for Production

```bash
# Build optimized production bundle
npm run build

# The build output will be in the 'dist' folder
```

## Deployment Options

### Option 1: Nginx Static File Serving (Recommended)

#### Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

#### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/itops-frontend
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/itops-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional - if backend on same server)
    location /api/v1/ {
        proxy_pass http://localhost:8081/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Disable access to .git, .env, etc.
    location ~ /\. {
        deny all;
    }
}
```

#### Deploy Files

```bash
# Create web directory
sudo mkdir -p /var/www/itops-frontend

# Copy build files
sudo cp -r dist/* /var/www/itops-frontend/

# Set permissions
sudo chown -R www-data:www-data /var/www/itops-frontend
sudo chmod -R 755 /var/www/itops-frontend
```

#### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/itops-frontend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx
```

### Option 2: Node.js Server (PM2)

#### Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Install serve package
npm install -g serve
```

#### Create PM2 Configuration

```bash
nano ecosystem.config.js
```

**PM2 Configuration:**

```javascript
module.exports = {
  apps: [{
    name: 'itops-frontend',
    script: 'serve',
    args: 'dist -s -l 3000',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 on system startup
pm2 startup systemd
# Follow the instructions from the output

# Monitor
pm2 monit

# View logs
pm2 logs itops-frontend
```

#### Nginx Reverse Proxy for PM2

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (configured automatically)
# Test renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

## CI/CD with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    
    - name: Deploy to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        source: "dist/*"
        target: "/var/www/itops-frontend"
        strip_components: 1
```

## Package Dependencies

### Core Framework
- `react` (^19.2.0) - UI framework
- `react-dom` (^19.2.0) - DOM rendering
- `typescript` (~5.9.3) - Type safety
- `vite` (^7.2.4) - Build tool

### Routing & State
- `react-router-dom` (^7.11.0) - Client-side routing
- `zustand` (^5.0.9) - State management
- `@tanstack/react-query` (^5.90.12) - Server state

### HTTP & Data
- `axios` (^1.13.2) - API client

### UI Components (Radix UI)
- `@radix-ui/react-dialog` (^1.1.15)
- `@radix-ui/react-dropdown-menu` (^2.1.16)
- `@radix-ui/react-select` (^2.2.6)
- `@radix-ui/react-tabs` (^1.1.13)
- `@radix-ui/react-tooltip` (^1.2.8)
- Plus 10+ more Radix UI components

### Forms & Validation
- `react-hook-form` (^7.69.0)
- `@hookform/resolvers` (^5.2.2)
- `zod` (^4.2.1)

### Drag & Drop
- `@dnd-kit/core` (^6.3.1)
- `@dnd-kit/sortable` (^10.0.0)
- `@dnd-kit/utilities` (^3.2.2)

### Charts (Reports)
- `recharts` (^3.6.0)

### Date/Time
- `date-fns` (^4.1.0)
- `react-datepicker` (^9.1.0)
- `react-day-picker` (^9.13.0)

### Styling
- `tailwindcss` (^3.4.19)
- `autoprefixer` (^10.4.23)
- `postcss` (^8.5.6)

### Icons & UI
- `lucide-react` (^0.562.0) - Icons
- `sonner` (^2.0.7) - Notifications

## Build Optimization

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
```

## Monitoring & Logs

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Analyze traffic
sudo goaccess /var/log/nginx/access.log -o report.html --log-format=COMBINED
```

### PM2 Logs (if using PM2)

```bash
# View logs
pm2 logs itops-frontend

# Clear logs
pm2 flush

# Monitor resources
pm2 monit
```

## Update Deployment

```bash
# Navigate to project
cd itops-saas-frontend

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Build
npm run build

# Deploy (Nginx)
sudo cp -r dist/* /var/www/itops-frontend/

# Or restart PM2
pm2 restart itops-frontend

# Clear browser cache notification
echo "Notify users to clear cache or hard reload (Ctrl+Shift+R)"
```

## Rollback Strategy

```bash
# Keep previous builds
sudo mkdir -p /var/www/backups
sudo cp -r /var/www/itops-frontend /var/www/backups/backup-$(date +%Y%m%d-%H%M%S)

# Rollback if needed
sudo rm -rf /var/www/itops-frontend/*
sudo cp -r /var/www/backups/backup-YYYYMMDD-HHMMSS/* /var/www/itops-frontend/
sudo systemctl restart nginx
```

## Performance Optimization

### Enable HTTP/2

```nginx
server {
    listen 443 ssl http2;
    # ... rest of config
}
```

### Browser Caching

```nginx
# Already included in nginx config above
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Gzip Compression

```nginx
# Already included in nginx config above
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

## Security Checklist

- [ ] Enable HTTPS with Let's Encrypt
- [ ] Set security headers in Nginx
- [ ] Configure CORS properly
- [ ] Use environment variables for API URL
- [ ] Disable source maps in production
- [ ] Remove console logs in production
- [ ] Set up CSP (Content Security Policy)
- [ ] Enable fail2ban for Nginx
- [ ] Regular security updates
- [ ] Monitor access logs

## Troubleshooting

### Build Fails

```bash
# Clear node_modules and cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check Node.js version
node --version  # Should be 18.x or 20.x
```

### Page Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/itops-frontend/
```

### API Connection Issues

```bash
# Check environment variable
cat .env.production

# Verify API URL is correct
# Check CORS settings on backend
# Verify SSL certificates
```

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Nginx
sudo cp -r dist/* /var/www/itops-frontend/

# Restart Nginx
sudo systemctl restart nginx

# PM2 restart
pm2 restart itops-frontend

# View logs
sudo tail -f /var/log/nginx/access.log
pm2 logs itops-frontend
```

## Support

For issues or questions:
- Check logs: `sudo tail -f /var/log/nginx/error.log`
- Verify build: `npm run build`
- Test locally: `npm run preview`
- Check API connectivity from browser console
