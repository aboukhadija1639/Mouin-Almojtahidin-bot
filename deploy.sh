#!/bin/bash

# Mouin-Almojtahidin Bot Deployment Script
# This script builds and deploys the bot to a free hosting service

set -e

echo "🚀 Starting deployment of Mouin-Almojtahidin Bot..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found! Please create it with your bot configuration."
    print_status "Example .env file:"
    cat << EOF
# Telegram Bot Configuration
BOT_TOKEN=your_actual_bot_token_from_botfather

# Admin Configuration
ADMIN_USER_IDS=123456789,987654321
GROUP_ID=-100123456789
SUPPORT_CHANNEL=@YourSupportChannel
ADMIN_CHAT_ID=-100123456789

# User Verification
ACTIVATION_CODE=YOUR_SECRET_CODE

# Zoom Configuration
ZOOM_LINK=https://zoom.us/j/your_meeting_id?pwd=your_password

# Rate Limiting
RATE_LIMITING_ENABLED=true
MAX_REQUESTS_PER_MINUTE=30
MAX_REQUESTS_PER_HOUR=100
EOF
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Building Docker image..."
docker build -t mouin-almojtahidin-bot .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully!"
else
    print_error "Failed to build Docker image!"
    exit 1
fi

# Check if container is already running
if docker ps -q -f name=mouin-bot | grep -q .; then
    print_warning "Bot container is already running. Stopping it..."
    docker stop mouin-bot
    docker rm mouin-bot
fi

print_status "Starting bot container..."
docker run -d \
    --name mouin-bot \
    --restart unless-stopped \
    --env-file .env \
    -v $(pwd)/data:/app/data \
    mouin-almojtahidin-bot

if [ $? -eq 0 ]; then
    print_success "Bot container started successfully!"
    print_status "Container ID: $(docker ps -q -f name=mouin-bot)"
    print_status "To view logs: docker logs -f mouin-bot"
    print_status "To stop bot: docker stop mouin-bot"
    print_status "To restart bot: docker restart mouin-bot"
else
    print_error "Failed to start bot container!"
    exit 1
fi

# Wait a moment and check if container is running
sleep 3
if docker ps -q -f name=mouin-bot | grep -q .; then
    print_success "Bot is running successfully!"
    print_status "Checking bot logs..."
    docker logs --tail 10 mouin-bot
else
    print_error "Bot container failed to start properly!"
    print_status "Checking container logs for errors..."
    docker logs mouin-bot
    exit 1
fi

print_success "Deployment completed successfully! 🎉"
print_status "Your bot should now be running and responding to commands."