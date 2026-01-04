#!/bin/bash

################################################################################
# Frontend Deployment Script for Amazon Linux 2023
# ITOps SaaS Platform - Frontend Installation
################################################################################

set -e  # Exit on any error

echo "=========================================="
echo "ITOps SaaS Frontend Deployment - Amazon Linux"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ec2-user/itops-saas-frontend"
WEB_DIR="/var/www/itops-frontend"
DOMAIN="yourdomain.com"
API_URL="https://api.yourdomain.com/api/v1"
NODE_VERSION="20"

echo -e "${YELLOW}Step 1: System Update${NC}"
echo "Running: sudo dnf update -y"
sudo dnf update -y
# Expected output:
# Last metadata expiration check: 0:00:05 ago
# Dependencies resolved.
# Nothing to do.
# Complete!

echo ""
echo -e "${GREEN}✓ System updated${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 2: Install Node.js ${NODE_VERSION}${NC}"
echo "Installing nvm (Node Version Manager)..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Expected output:
# => Downloading nvm from git to '/home/ec2-user/.nvm'
# => Compiling...
# => nvm is already installed in /home/ec2-user/.nvm, trying to update the script

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

echo "Installing Node.js ${NODE_VERSION}..."
nvm install ${NODE_VERSION}
nvm use ${NODE_VERSION}
nvm alias default ${NODE_VERSION}
# Expected output:
# Downloading and installing node v20.11.0...
# Now using node v20.11.0 (npm v10.2.4)
# default -> 20 (-> v20.11.0)

echo "Verifying Node.js installation..."
node --version
# Expected output:
# v20.11.0

npm --version
# Expected output:
# 10.2.4

echo ""
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} installed successfully${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 3: Install Git${NC}"
echo "Installing Git..."
sudo dnf install -y git

echo "Verifying Git installation..."
git --version
# Expected output:
# git version 2.40.1

echo ""
echo -e "${GREEN}✓ Git installed successfully${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 4: Clone Frontend Repository${NC}"
echo "Note: Replace with your actual repository URL"
echo ""
read -p "Enter your Git repository URL (or press Enter to skip): " REPO_URL

if [ -n "$REPO_URL" ]; then
    echo "Cloning repository..."
    cd /home/ec2-user
    git clone $REPO_URL
    cd itops-saas-frontend
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    echo -e "${YELLOW}⚠ Skipping repository clone. Manual clone required.${NC}"
    mkdir -p $APP_DIR
    cd $APP_DIR
fi

echo ""

################################################################################
echo -e "${YELLOW}Step 5: Create Environment Configuration${NC}"
echo "Creating .env.production file..."

cat > .env.production << EOF
# API Configuration
VITE_API_URL=${API_URL}

# App Configuration
VITE_APP_NAME=ITOps SaaS Platform
VITE_APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✓ Environment configuration created${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 6: Install Dependencies${NC}"
echo "Installing npm packages (this may take several minutes)..."
npm install
# Expected output:
# added 567 packages, and audited 568 packages in 45s
# 156 packages are looking for funding
# found 0 vulnerabilities

echo ""
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 7: Build Application${NC}"
echo "Building production bundle..."
npm run build
# Expected output:
# vite v7.2.4 building for production...
# ✓ 1234 modules transformed.
# dist/index.html                   0.45 kB │ gzip:  0.29 kB
# dist/assets/index-a1b2c3d4.css   125.67 kB │ gzip: 18.23 kB
# dist/assets/index-e5f6g7h8.js    567.89 kB │ gzip: 178.45 kB
# ✓ built in 23.45s

echo ""
echo -e "${GREEN}✓ Application built successfully${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 8: Install and Configure Nginx${NC}"
echo "Installing Nginx..."
sudo dnf install -y nginx

echo "Starting and enabling Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx
# Expected output:
# Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service

echo "Creating web directory..."
sudo mkdir -p ${WEB_DIR}

echo "Copying build files..."
sudo cp -r dist/* ${WEB_DIR}/

echo "Setting permissions..."
sudo chown -R nginx:nginx ${WEB_DIR}
sudo chmod -R 755 ${WEB_DIR}

echo "Creating Nginx configuration..."
sudo tee /etc/nginx/conf.d/itops-frontend.conf > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${WEB_DIR};
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
        try_files \$uri \$uri/ /index.html;
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }
}
EOF

echo "Testing Nginx configuration..."
sudo nginx -t
# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

echo "Restarting Nginx..."
sudo systemctl restart nginx

echo ""
echo -e "${GREEN}✓ Nginx installed and configured${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 9: Configure Firewall${NC}"
echo "Opening HTTP and HTTPS ports..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
# Expected output:
# success
# success
# success

echo ""
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 10: Install SSL Certificate (Optional)${NC}"
echo "Installing Certbot for Let's Encrypt..."
sudo dnf install -y certbot python3-certbot-nginx

echo ""
echo "To obtain SSL certificate, run:"
echo "sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""

################################################################################
echo -e "${YELLOW}Step 11: Setup PM2 (Alternative Option)${NC}"
echo "Installing PM2 process manager (optional)..."
npm install -g pm2

echo "Installing serve package..."
npm install -g serve

echo "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
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
  }]
};
EOF

echo ""
echo "To start with PM2 (instead of Nginx static):"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo "  pm2 startup systemd"
echo ""

################################################################################
echo -e "${YELLOW}Step 12: Create Deployment Script${NC}"
echo "Creating update script..."

cat > update-frontend.sh << 'EOF'
#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Copying files to web directory..."
sudo cp -r dist/* /var/www/itops-frontend/

echo "Setting permissions..."
sudo chown -R nginx:nginx /var/www/itops-frontend
sudo chmod -R 755 /var/www/itops-frontend

echo "Deployment complete!"
echo "Clear browser cache: Ctrl+Shift+R"
EOF

chmod +x update-frontend.sh

echo -e "${GREEN}✓ Update script created: ./update-frontend.sh${NC}"
echo ""

################################################################################
echo -e "${YELLOW}Step 13: Create Backup Directory${NC}"
echo "Creating backup directory..."
sudo mkdir -p /var/www/backups

echo "Creating backup of current deployment..."
sudo cp -r ${WEB_DIR} /var/www/backups/backup-$(date +%Y%m%d-%H%M%S)

echo -e "${GREEN}✓ Backup created${NC}"
echo ""

################################################################################
echo ""
echo "=========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "=========================================="
echo ""
echo "Service Status:"
sudo systemctl is-active nginx && echo -e "Nginx: ${GREEN}Running${NC}" || echo -e "Nginx: ${RED}Stopped${NC}"

echo ""
echo "Important Information:"
echo "----------------------"
echo "Application URL: http://${DOMAIN}"
echo "API URL: ${API_URL}"
echo "Web Directory: ${WEB_DIR}"
echo "Source Directory: ${APP_DIR}"
echo ""
echo "Deployment Method: Nginx Static Files"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "View Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo "View error logs: sudo tail -f /var/log/nginx/error.log"
echo "Restart Nginx: sudo systemctl restart nginx"
echo "Test Nginx config: sudo nginx -t"
echo "Update deployment: ./update-frontend.sh"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Update domain in /etc/nginx/conf.d/itops-frontend.conf"
echo "2. Update API_URL in .env.production"
echo "3. Obtain SSL certificate: sudo certbot --nginx -d ${DOMAIN}"
echo "4. Configure your DNS to point to this server"
echo "5. Test the application: http://${DOMAIN}"
echo "6. Rebuild after env changes: npm run build && sudo cp -r dist/* ${WEB_DIR}/"
echo ""
echo "Alternative PM2 Deployment:"
echo "---------------------------"
echo "If you prefer PM2 over static Nginx:"
echo "1. Comment out /etc/nginx/conf.d/itops-frontend.conf"
echo "2. Create proxy config for port 3000"
echo "3. Run: pm2 start ecosystem.config.js"
echo "4. Run: pm2 save && pm2 startup systemd"
echo ""
echo "=========================================="

################################################################################
echo ""
echo "Testing application..."
sleep 2

if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    echo -e "${GREEN}✓ Application is accessible!${NC}"
else
    echo -e "${YELLOW}⚠ Application may not be accessible yet. Check Nginx logs.${NC}"
fi

echo ""
echo "Installation script completed!"
echo ""
