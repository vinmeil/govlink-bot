# GovLink Discord Bot - AWS ECS/Fargate Deployment

## 📋 Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Docker** installed and running
3. **AWS Account** with ECS, ECR, and VPC access
4. **Discord Bot Token** and App ID

## 🚀 Deployment Steps

### 1. Set up AWS IAM Role

Ensure you have the `ecsTaskExecutionRole` with these policies:

- `AmazonECSTaskExecutionRolePolicy`
- Custom policy for CloudWatch Logs access

### 2. Set Environment Variables

Export your Discord credentials:

```bash
export DISCORD_TOKEN="your_discord_bot_token"
export APP_ID="your_discord_app_id"
export PUBLIC_KEY="your_discord_public_key"
```

### 3. Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Create ECS Service (if not automated)

If the script couldn't create the service automatically, run:

```bash
# Replace subnet-12345 and sg-12345 with your actual subnet and security group IDs
aws ecs create-service \
    --cluster govlink-bot-cluster \
    --service-name govlink-bot-service \
    --task-definition govlink-bot-task \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration 'awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}' \
    --region us-east-1
```

### 5. Monitor Your Bot

- **ECS Console**: Check service and task status
- **CloudWatch Logs**: Monitor logs at `/ecs/govlink-bot`
- **Discord**: Test your bot with `/ask` command

## 🔧 Configuration

Your bot runs 24/7 on ECS/Fargate with:

- **CPU**: 256 units (0.25 vCPU)
- **Memory**: 512 MB
- **Network**: Fargate with awsvpc networking
- **Auto-restart**: Failed tasks are automatically restarted

## 📦 Architecture

```
Discord API → Internet Gateway → ALB (optional) → ECS Service → Fargate Tasks
                                                      ↓
                                                CloudWatch Logs
```

## 🔧 Troubleshooting

### Common Issues

1. **Service won't start**: Check task definition and execution role
2. **No logs appearing**: Verify CloudWatch log group exists
3. **Bot offline**: Check ECS service status and task health
4. **Network errors**: Ensure security group allows outbound HTTPS

### Debug Commands

```bash
# Check service status
aws ecs describe-services --cluster govlink-bot-cluster --services govlink-bot-service

# Check task logs
aws logs get-log-events --log-group-name "/ecs/govlink-bot" --log-stream-name "ecs/govlink-bot/TASK_ID"

# List running tasks
aws ecs list-tasks --cluster govlink-bot-cluster --service-name govlink-bot-service
```

## 🏗️ Infrastructure Components

### Created Resources:

- **ECR Repository**: Stores your Docker image
- **ECS Cluster**: Manages your container instances
- **ECS Service**: Ensures desired number of tasks are running
- **ECS Task Definition**: Defines your container configuration
- **CloudWatch Log Group**: Stores application logs

### Required AWS Permissions:

- ECS full access
- ECR full access
- CloudWatch logs access
- VPC access (for networking)

## 💡 Production Enhancements

1. **Use AWS Secrets Manager** for Discord tokens:

```bash
aws secretsmanager create-secret --name "discord-bot-token" --secret-string "$DISCORD_TOKEN"
```

2. **Set up Application Load Balancer** for health checks
3. **Configure auto-scaling** based on CPU/memory usage
4. **Use multiple AZs** for high availability
5. **Implement proper monitoring** with CloudWatch alarms

## � Security Best Practices

- Use IAM roles with minimal required permissions
- Store sensitive data in AWS Secrets Manager
- Configure security groups to allow only necessary traffic
- Enable VPC Flow Logs for network monitoring
- Regularly update container images

## 💰 Cost Optimization

- **Fargate Pricing**: ~$0.04/hour for 0.25 vCPU + 512MB memory
- **Monthly Estimate**: ~$30/month for 24/7 operation
- **ECR Storage**: Minimal cost for Docker images
- **CloudWatch Logs**: Based on log volume

## 📊 Monitoring

Your bot includes comprehensive logging:

- Connection status to Discord
- Command executions
- Error handling
- API rate limiting information

Monitor in CloudWatch under `/ecs/govlink-bot`

---

**Why ECS/Fargate over Lambda?**

Discord bots need persistent WebSocket connections and always-on availability. ECS/Fargate provides:

- ✅ No cold starts
- ✅ Persistent WebSocket connections
- ✅ Always-on operation
- ✅ Better suited for long-running applications
- ✅ Proper Discord.js gateway connection handling

## 📞 Support

If you run into issues:

1. Check CloudWatch logs in AWS Console
2. Verify environment variables are set
3. Ensure IAM role has correct permissions
4. Test Discord bot token validity
