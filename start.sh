#!/usr/bin/env sh
# Create json file

echo "Creating json file"
cat > config.json << EOF
{
  "token": "$BOT_TOKEN",
  "host": "$SERVER_HOST",
  "port": ${SERVER_PORT:-8211},
  "rcon_port": ${RCON_PORT:-25575},
  "rcon_password": "$RCON_PASSWORD",
  "rcon_role": "${RCON_ROLE:-RCON_ROLE}",
  "whitelist_enabled": ${WHITELIST_ENABLED:-false},
  "notice_channel": "$NOTICE_CHANNEL_ID",
  "server_start_command": "$SERVER_START_COMMAND",
  "server_stop_command": "$SERVER_STOP_COMMAND"
}
EOF

# i want to write above json to a file


# Start the bot
echo "Starting bot"
node index.js

