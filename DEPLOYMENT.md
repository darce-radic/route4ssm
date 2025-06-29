# Route4SSM Deployment Guide for Portainer

This guide will help you deploy the Route4SSM route optimization application using Portainer.

## 🚀 Quick Deployment

### Prerequisites
- Docker and Docker Compose installed on your server
- Portainer installed and running
- Access to your server's web interface

### Option 1: Deploy via Portainer Web Interface (Recommended)

1. **Access Portainer**
   - Open your web browser and navigate to your Portainer instance
   - Log in with your credentials

2. **Create a New Stack**
   - In the Portainer dashboard, go to **Stacks** section
   - Click **Add stack**

3. **Configure the Stack**
   - **Name**: `route4ssm`
   - **Build method**: Select **Web editor**
   - Copy and paste the contents of `docker-compose.yml` into the editor

4. **Deploy the Stack**
   - Click **Deploy the stack**
   - Wait for the deployment to complete

### Option 2: Deploy via Git Repository

1. **In Portainer Stacks**
   - Click **Add stack**
   - **Name**: `route4ssm`
   - **Build method**: Select **Repository**
   - **Repository URL**: `https://github.com/yourusername/route4ssm.git`
   - **Repository reference**: `main` (or your preferred branch)
   - **Compose path**: `docker-compose.yml`

2. **Deploy**
   - Click **Deploy the stack**

## 🔧 Configuration Options

### Environment Variables

You can customize the deployment by adding environment variables:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - PORT=3009
      - LOG_LEVEL=info

  frontend:
    environment:
      - NODE_ENV=production
      - PORT=8080
      - BACKEND_URL=http://backend:3009
```

### Port Configuration

Default ports:
- **Frontend**: 8080
- **Backend**: 3009
- **Nginx** (if enabled): 80, 443

To change ports, modify the `ports` section in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3000:8080"  # External:Internal
```

## 🌐 Production Deployment

### With Nginx Reverse Proxy

For production deployment with SSL and load balancing:

1. **Enable Nginx service** by removing the `profiles` section:
```yaml
nginx:
  image: nginx:alpine
  # ... other config
  # Remove this line:
  # profiles:
  #   - production
```

2. **Configure SSL certificates**:
   - Create `ssl/` directory
   - Add your SSL certificates:
     - `ssl/cert.pem` (SSL certificate)
     - `ssl/key.pem` (Private key)

3. **Update nginx.conf**:
   - Uncomment the HTTPS server block
   - Update `server_name` with your domain

4. **Deploy with production profile**:
```bash
docker-compose --profile production up -d
```

### Without Nginx (Direct Access)

For simple deployments without reverse proxy:

1. **Remove nginx service** from `docker-compose.yml`
2. **Update frontend ports** to expose directly:
```yaml
frontend:
  ports:
    - "80:8080"  # Serve on port 80
```

## 📊 Monitoring and Health Checks

The application includes built-in health checks:

- **Frontend**: `http://your-server:8080/health`
- **Backend**: `http://your-server:3009/health`

### Viewing Logs in Portainer

1. Go to **Containers** in Portainer
2. Click on `route4ssm-frontend` or `route4ssm-backend`
3. Click **Logs** tab to view real-time logs

### Container Status

- **Green**: Healthy and running
- **Yellow**: Starting up
- **Red**: Failed or unhealthy

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Use non-root containers (already configured)
- [ ] Set up proper environment variables
- [ ] Configure rate limiting (nginx)
- [ ] Regular security updates

### Environment Variables for Security

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://yourdomain.com
      - RATE_LIMIT_ENABLED=true
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Check if ports 8080/3009 are available
   - Change ports in docker-compose.yml

2. **Container Won't Start**
   - Check logs: `docker logs route4ssm-backend`
   - Verify environment variables
   - Check disk space

3. **Health Check Failures**
   - Ensure curl is installed in containers
   - Check if services are responding
   - Verify network connectivity

4. **Frontend Can't Connect to Backend**
   - Verify BACKEND_URL environment variable
   - Check if backend container is healthy
   - Ensure network connectivity

### Debug Commands

```bash
# Check container status
docker ps -a

# View logs
docker logs route4ssm-frontend
docker logs route4ssm-backend

# Check network
docker network ls
docker network inspect route4ssm_route4ssm-network

# Access container shell
docker exec -it route4ssm-backend sh
```

## 📈 Scaling

### Horizontal Scaling

To scale the backend service:

1. **In Portainer**:
   - Go to **Services** (if using Swarm)
   - Select the backend service
   - Click **Scale** and set desired replicas

2. **Or via docker-compose**:
```yaml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing

With nginx enabled, requests are automatically load balanced across backend instances.

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull latest changes**:
```bash
git pull origin main
```

2. **Rebuild and restart**:
   - In Portainer: **Stacks** → **route4ssm** → **Editor** → **Update the stack**
   - Or via command line: `docker-compose up -d --build`

### Backup and Restore

1. **Backup data**:
```bash
docker run --rm -v route4ssm_route4ssm-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

2. **Restore data**:
```bash
docker run --rm -v route4ssm_route4ssm-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

## 📞 Support

For issues or questions:
- Check the logs in Portainer
- Review this deployment guide
- Check the main README.md for application details

## 🎯 Quick Start Commands

```bash
# Deploy the stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the stack
docker-compose down

# Restart services
docker-compose restart

# Update and rebuild
docker-compose up -d --build
```

Your Route4SSM application should now be accessible at:
- **Frontend**: `http://your-server:8080`
- **Backend API**: `http://your-server:3009`
- **Health Check**: `http://your-server:8080/health` 