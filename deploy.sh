#!/bin/bash

# Amu API Podman Deployment Script
# This script helps you quickly deploy your API with Podman

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Amu API Podman Deployment${NC}"
echo "================================"

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    echo "Please install podman first:"
    echo "  Ubuntu/Debian: sudo apt-get install podman"
    echo "  Fedora: sudo dnf install podman"
    exit 1
fi

echo -e "${GREEN}✓ Podman is installed${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env with your actual credentials before continuing${NC}"
        exit 1
    else
        echo -e "${RED}❌ No .env.example found${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ .env file exists${NC}"

# Check if service_account.json exists
if [ ! -f service_account.json ]; then
    echo -e "${YELLOW}⚠️  Warning: service_account.json not found${NC}"
    echo "Make sure you have your Firebase service account JSON file"
fi

# Create logs directory if it doesn't exist
mkdir -p logs
echo -e "${GREEN}✓ Logs directory ready${NC}"

# Function to show menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1) Build and start container"
    echo "2) Stop container"
    echo "3) View logs"
    echo "4) Restart container"
    echo "5) Rebuild image (no cache)"
    echo "6) Remove container and image"
    echo "7) Container stats"
    echo "8) Test API health"
    echo "9) Exit"
    echo ""
    read -p "Enter your choice [1-9]: " choice
}

# Function to build and start
build_and_start() {
    echo -e "${GREEN}📦 Building Docker image...${NC}"
    podman build -t amu-api:latest .
    
    echo -e "${GREEN}🚀 Starting container...${NC}"
    podman run -d \
        --name amu-api \
        -p 8080:8080 \
        --env-file .env \
        -v ./logs:/app/logs:Z \
        -v ./service_account.json:/app/service_account.json:ro,Z \
        --restart unless-stopped \
        amu-api:latest
    
    echo -e "${GREEN}✓ Container started successfully!${NC}"
    echo "Access your API at: http://localhost:8080"
    echo "API docs available at: http://localhost:8080/api/docs"
}

# Function to stop container
stop_container() {
    echo -e "${YELLOW}🛑 Stopping container...${NC}"
    podman stop amu-api || true
    podman rm amu-api || true
    echo -e "${GREEN}✓ Container stopped${NC}"
}

# Function to view logs
view_logs() {
    echo -e "${GREEN}📋 Viewing logs (Ctrl+C to exit)...${NC}"
    podman logs -f amu-api
}

# Function to restart
restart_container() {
    echo -e "${YELLOW}🔄 Restarting container...${NC}"
    podman restart amu-api
    echo -e "${GREEN}✓ Container restarted${NC}"
}

# Function to rebuild
rebuild() {
    echo -e "${YELLOW}🔨 Rebuilding image (no cache)...${NC}"
    stop_container
    podman rmi amu-api:latest || true
    podman build --no-cache -t amu-api:latest .
    build_and_start
}

# Function to remove everything
remove_all() {
    echo -e "${RED}🗑️  Removing container and image...${NC}"
    read -p "Are you sure? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        stop_container
        podman rmi amu-api:latest || true
        echo -e "${GREEN}✓ Cleaned up${NC}"
    fi
}

# Function to show stats
show_stats() {
    echo -e "${GREEN}📊 Container stats (Ctrl+C to exit)...${NC}"
    podman stats amu-api
}

# Function to test health
test_health() {
    echo -e "${GREEN}🏥 Testing API health...${NC}"
    if curl -s http://localhost:8080/health > /dev/null; then
        echo -e "${GREEN}✓ API is healthy!${NC}"
        curl -s http://localhost:8080/health | json_pp 2>/dev/null || curl -s http://localhost:8080/health
    else
        echo -e "${RED}❌ API is not responding${NC}"
    fi
}

# Main loop
while true; do
    show_menu
    case $choice in
        1)
            # Check if container already exists
            if podman ps -a --format "{{.Names}}" | grep -q "^amu-api$"; then
                echo -e "${YELLOW}Container already exists${NC}"
                read -p "Remove and recreate? (y/N): " confirm
                if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                    stop_container
                    build_and_start
                fi
            else
                build_and_start
            fi
            ;;
        2)
            stop_container
            ;;
        3)
            view_logs
            ;;
        4)
            restart_container
            ;;
        5)
            rebuild
            ;;
        6)
            remove_all
            ;;
        7)
            show_stats
            ;;
        8)
            test_health
            ;;
        9)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
done
