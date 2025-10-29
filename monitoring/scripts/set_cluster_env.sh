#!/bin/bash

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Function to detect OS type
get_os_type() {
    case "$(uname -s)" in
        Linux*)     echo "Linux";;
        CYGWIN*)    echo "Windows";;
        MINGW*)     echo "Windows";;
        *)          echo "Unknown";;
    esac
}

# Function to get IP address based on OS
get_ip_address() {
    OS_TYPE=$(get_os_type)
    
    if [ "$OS_TYPE" = "Linux" ]; then
        IP=$(hostname -I | awk '{print $1}')
    elif [ "$OS_TYPE" = "Windows" ]; then
        IP=$(ipconfig | grep -i "IPv4" | head -n 1 | awk '{print $NF}')
    else
        log_error "Unsupported operating system"
        exit 1
    fi
    
    if [ -z "$IP" ]; then
        log_error "Failed to detect IP address"
        exit 1
    fi
    
    echo "$IP"
}

# Create targets directory if it doesn't exist
TARGETS_DIR="$(dirname "$0")/../prometheus/targets"
mkdir -p "$TARGETS_DIR"

if [ ! -d "$TARGETS_DIR" ]; then
    log_error "Failed to create targets directory: $TARGETS_DIR"
    exit 1
fi

# Get machine IP
MACHINE_IP=$(get_ip_address)
log_info "Detected IP address: $MACHINE_IP"

# Create node-exporter.json file
NODE_EXPORTER_JSON="$TARGETS_DIR/node-exporter.json"
cat > "$NODE_EXPORTER_JSON" << EOF
[
  {
    "labels": {
      "job": "node-exporter",
      "instance": "$MACHINE_IP"
    },
    "targets": ["$MACHINE_IP:9100"]
  }
]
EOF

if [ $? -eq 0 ]; then
    log_success "Created node-exporter.json with IP: $MACHINE_IP"
else
    log_error "Failed to create node-exporter.json"
    exit 1
fi

# Export MACHINE_IP environment variable
export MACHINE_IP="$MACHINE_IP"
echo "export MACHINE_IP=$MACHINE_IP" > "$(dirname "$0")/../.env"

log_success "Environment variable MACHINE_IP exported and saved to .env file"
log_success "Setup completed successfully!"