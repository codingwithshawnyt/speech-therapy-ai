#!/bin/bash

# deploy.sh - Deployment script for StutterOn (replace with your app name)

# Set environment variables (replace with your actual values)
export NODE_ENV=production
export API_URL=https://api.yourdomain.com
export S3_BUCKET=your-s3-bucket-name
export AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
export CLOUDFRONT_DISTRIBUTION_ID=YOUR_CLOUDFRONT_DISTRIBUTION_ID

# Set colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print messages with colors
print_message() {
  local type=$1
  local message=$2
  case $type in
    "info") echo -e "${GREEN}[INFO]${NC} $message" ;;
    "warning") echo -e "${YELLOW}[WARNING]${NC} $message" ;;
    "error") echo -e "${RED}[ERROR]${NC} $message" ;;
  esac
}

# Function to check if a command exists
command_exists() {
  command -v "$1" > /dev/null 2>&1
}

# Check dependencies
if ! command_exists npm; then
  print_message "error" "npm is not installed. Please install npm before proceeding."
  exit 1
fi

if ! command_exists aws; then
  print_message "error" "AWS CLI is not installed. Please install AWS CLI before proceeding."
  exit 1
fi

# 1. Build the client application
print_message "info" "Building client application..."
npm run build --prefix client || {
  print_message "error" "Failed to build client application."
  exit 1
}

# 2. Build the server application (if applicable)
if [ -d "server" ]; then
  print_message "info" "Building server application..."
  npm run build --prefix server || {
    print_message "error" "Failed to build server application."
    exit 1
  }
fi

# 3. Deploy the client application to S3
print_message "info" "Deploying client application to S3..."
aws s3 sync client/build s3://$S3_BUCKET --delete --acl public-read || {
  print_message "error" "Failed to deploy client application to S3."
  exit 1
}

# 4. Invalidate CloudFront cache
print_message "info" "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --invalidation-batch '{
    "Paths": {
      "Quantity": 1,
      "Items": [
        "/*"
      ]
    },
    "CallerReference": "'"$(date +%Y%m%d%H%M%S)"'"
  }' || {
  print_message "error" "Failed to invalidate CloudFront cache."
  exit 1
}

# 5. Deploy the server application (if applicable)
if [ -d "server" ]; then
  print_message "info" "Deploying server application..."
  # Implement your server deployment logic here (e.g., using PM2, Docker, etc.)
  # ...
fi

# 6. Run database migrations (if applicable)
if [ -f "scripts/migrate_db.sql" ]; then
  print_message "info" "Running database migrations..."
  # Implement your database migration logic here (e.g., using psql, mysql, etc.)
  # ...
fi

# 7. Post-deployment tasks (optional)
# - Send notifications (e.g., Slack, email)
# - Run health checks
# - ...

print_message "info" "Deployment completed successfully!"