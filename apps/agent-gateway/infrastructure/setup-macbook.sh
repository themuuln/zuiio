#!/bin/bash
# setup-macbook.sh — Setup MacBook as primary server
# Run on MacBook: cd infrastructure && ./setup-macbook.sh

set -e

echo "=== Agent Gateway — MacBook Setup ==="
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

# Install dependencies
echo "5. Installing app dependencies..."
cd ~/.workspace/zuiio/apps/agent-gateway
pnpm install

# Build the app
echo "6. Building app..."
pnpm build

# Create launchd plist for auto-start
echo "7. Setting up auto-start..."
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
echo "8. Setting up queue drain..."
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

# Create sync-to-imac script
echo "9. Setting up sync to iMac..."
cat > ~/scripts/sync-to-imac.sh << 'SYNCEOF'
#!/bin/bash
IMAC_USER="${IMAC_USER:-themuuln}"
IMAC_HOST="${IMAC_HOST:-imac}"

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env.local' \
  --exclude 'cloudflare-worker/node_modules' \
  ~/.workspace/zuiio/ \
  ${IMAC_USER}@${IMAC_HOST}:~/.workspace/zuiio/

echo "Synced at $(date)"
SYNCEOF
chmod +x ~/scripts/sync-to-imac.sh

cat > ~/Library/LaunchAgents/com.zuiio.sync-to-imac.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.zuiio.sync-to-imac</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/${CURRENT_USER}/scripts/sync-to-imac.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>StandardOutPath</key>
    <string>/tmp/sync-to-imac.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/sync-to-imac-error.log</string>
</dict>
</plist>
EOF

# Load all launchd agents
echo "10. Loading launchd agents..."
launchctl load ~/Library/LaunchAgents/com.zuiio.agent-gateway.plist
launchctl load ~/Library/LaunchAgents/com.zuiio.drain-queue.plist
launchctl load ~/Library/LaunchAgents/com.zuiio.sync-to-imac.plist

echo ""
echo "=== MacBook Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Login to Cloudflare: cloudflared tunnel login"
echo "2. Create tunnel: cloudflare tunnel create macbook"
echo "3. Start tunnel: cloudflare tunnel run --url http://localhost:3000 macbook"
echo "4. Copy .env.local from this Mac to iMac"
echo "5. Update Caddyfile on VPS with your tunnel URL"
echo ""
echo "Verify:"
echo "  - App: curl http://localhost:3000/api/health"
echo "  - Drain: curl -X POST http://localhost:3000/api/cron/drain-queue -H 'Authorization: Bearer YOUR_SECRET'"
echo "  - Logs: tail -f /tmp/agent-gateway.log"
