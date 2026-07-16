#!/bin/bash
# setup-vps.sh — Setup Caddy on Hetzner VPS for round-robin load balancing
# Run on VPS: ssh root@YOUR_VPS_IP && bash setup-vps.sh

set -e

echo "=== Agent Gateway — VPS Setup ==="
echo ""

# Update system
echo "1. Updating system..."
apt update && apt upgrade -y

# Install Caddy
echo "2. Installing Caddy..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# Create log directory
echo "3. Setting up logging..."
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

# Create Caddyfile
echo "4. Creating Caddyfile..."
cat > /etc/caddy/Caddyfile << 'CADDYEOF'
{
	email your-email@domain.com
	admin localhost:2019
}

bot.yourdomain.com {
	reverse_proxy {
		to https://macbook-TUNNEL_ID.trycloudflare.com https://imac-TUNNEL_ID.trycloudflare.com
		lb_policy round_robin
		health_uri /api/health
		health_interval 10s
		health_timeout 5s
		health_status 200
		fail_duration 30s
		max_fails 3
		header_up X-Forwarded-Proto {scheme}
		header_up X-Real-IP {remote_host}
	}

	log {
		output file /var/log/caddy/bot.log
		format json
	}
}

:8080 {
	respond /health 200
}
CADDYEOF

# Enable and start Caddy
echo "5. Starting Caddy..."
systemctl enable caddy
systemctl restart caddy

# Setup firewall
echo "6. Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw --force enable

# Setup automatic security updates
echo "7. Setting up automatic updates..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit /etc/caddy/Caddyfile with your actual tunnel URLs"
echo "2. Point DNS: bot.yourdomain.com → $(curl -s ifconfig.me)"
echo "3. Reload Caddy: systemctl reload caddy"
echo "4. Test: curl https://bot.yourdomain.com/api/health"
echo ""
echo "Monitor Caddy: journalctl -u caddy -f"
echo "View logs: tail -f /var/log/caddy/bot.log"
