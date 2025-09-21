# Navigate to your project directory
cd ~/documents/projects/govlink-bot

# Build new image with version tag
VERSION=$(date +%Y%m%d-%H%M%S)  # or use your own versioning
sudo docker build -t govlink-bot:$VERSION .

# Tag for ECR
sudo docker tag govlink-bot:$VERSION 843170959800.dkr.ecr.us-east-1.amazonaws.com/govlink-bot:$VERSION
sudo docker tag govlink-bot:$VERSION 843170959800.dkr.ecr.us-east-1.amazonaws.com/govlink-bot:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | sudo docker login --username AWS --password-stdin 843170959800.dkr.ecr.us-east-1.amazonaws.com

# Push images
sudo docker push 843170959800.dkr.ecr.us-east-1.amazonaws.com/govlink-bot:$VERSION
sudo docker push 843170959800.dkr.ecr.us-east-1.amazonaws.com/govlink-bot:latest

echo "Pushed version: $VERSION"
