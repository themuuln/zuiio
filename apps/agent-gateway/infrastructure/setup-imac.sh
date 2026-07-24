#!/bin/bash
# setup-imac.sh — Setup iMac as backup server
# Run on iMac: cd infrastructure && ./setup-imac.sh

set -e

echo "=== Agent Gateway — iMac Setup ==="
echo ""

# Install cloudflared
echo "1. Installing Cloudflare Tunnel..."
brew install cloudflare/cloudflare/cloudflare

# Prevent sleep
echo "2. Disabling sleep..."
caffeinate -s &
echo "   caffeinate running (PID: $!)"

# Disable auto updates
echo "3. Disabling auto updates..."
softwareupdate --schedule off

# Install pnpm if not present
echo "4. Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi

# Sync code from MacBook
echo "5. Syncing code from MacBook..."
echo "   Make sure SSH access to MacBook is set up first!"
echo "   Run: ssh-copy-id MacBook-username@MacBook-local-ip"

MACBOOK_USER="${MACBOOK_USER:-themuuln}"
MACBOOK_HOST="${MACBOOK_HOST:-air}"

mkdir -p ~/.workspace
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env.local' \
  --exclude 'cloudflare-worker/node_modules' \
  ${MACBOOK_USER}@${MACBOOK_HOST}:~/.workspace/zuiio/ \
  ~/.workspace/zuiio/

# Install dependencies
echo "6. Installing app dependencies..."
cd ~/.workspace/zuiio/apps/agent-gateway
pnpm install

# Build the app
echo "7. Building app..."
pnpm build

# Copy .env.local from MacBook
echo "8. Copying environment..."
echo "   Run: scp ${MACBOOK_USER}@${MACBOOK_HOST}:~/.workspace/zuiio/apps/agent-gateway/.env.local ."
echo "   Or copy manually."

# Create launchd plist for auto-start
echo "9. Setting up auto-start..."
CURRENT_USER=$(whoami)
cat > ~/Library/LaunchAgents/com.zuiio.agent-gateway.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.zuiio.agent-gateway</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/pnpm</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/${CURRENT_USER}/.workspace/zuiio/apps/agent-gateway</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/agent-gateway.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/agent-gateway-error.log</string>
</dict>
</plist>
EOF

# Create drain-queue script
echo "10. Setting up queue drain..."
mkdir -p ~/scripts
cat > ~/scripts/drain-queue.sh << 'DRAINEOF'
#!/bin/bash
CRON_SECRET="${CRON_SECRET:-}"
if [ -z "$CRON_SECRET" ]; then
  echo "ERROR: CRON_SECRET not set"
  exit 1
fi
curl -s -X POST "http://localhost:3000/api/cron/drain-queue" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
DRAINEOF
chmod +x ~/scripts/drain-queue.sh

cat > ~/Library/LaunchAgents/com.zuiio.drain-queue.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.zuiio.drain-queue</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/${CURRENT_USER}/scripts/drain-queue.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>30</integer>
    <key>StandardOutPath</key>
    <string>/tmp/drain-queue.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/drain-queue-error.log</string>
</dict>
</plist>
EOF

# Load all launchd agents
echo "11. Loading launchd agents..."
launchctl load ~/Library/LaunchAgents/com.zuiio.agent-gateway.plist
launchctl load ~/Library/LaunchAgents/com.zuiio.drain-queue.plist

echo ""
echo "=== iMac Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Login to Cloudflare: cloudflared tunnel login"
echo "2. Create tunnel: cloudflare tunnel create imac"
echo "3. Start tunnel: cloudflare tunnel run --url http://localhost:3000 imac"
echo "4. Copy .env.local from MacBook"
echo "5. Update Caddyfile on VPS with your tunnel URL"
echo ""
echo "Verify:"
echo "  - App: curl http://localhost:3000/api/health"
echo "  - Logs: tail -f /tmp/agent-gateway.log"
