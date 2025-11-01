# Amu API Deployment Guide with Podman

This guide will help you deploy the Amu API server using Podman (a lightweight Docker alternative).

## Prerequisites

1. **Install Podman**:

   ```bash
   # On Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install podman

   # On Fedora
   sudo dnf install podman

   # On Arch
   sudo pacman -S podman
   ```

2. **Install podman-compose** (optional, for docker-compose syntax):
   ```bash
   pip3 install podman-compose
   ```

## Quick Start

### Option 1: Using Podman Compose (Recommended)

1. **Ensure your `.env` file is configured**:

   ```bash
   # Copy the example if you haven't already
   cp .env.example .env
   # Edit with your actual credentials
   nano .env
   ```

2. **Build and start the container**:

   ```bash
   podman-compose up -d
   ```

3. **Check logs**:

   ```bash
   podman-compose logs -f
   ```

4. **Stop the container**:
   ```bash
   podman-compose down
   ```

### Option 2: Using Podman Directly

1. **Build the image**:

   ```bash
   podman build -t amu-api:latest .
   ```

2. **Run the container**:

   ```bash
   podman run -d \
     --name amu-api \
     -p 8080:8080 \
     --env-file .env \
     -v ./logs:/app/logs:Z \
     -v ./service_account.json:/app/service_account.json:ro,Z \
     amu-api:latest
   ```

3. **Check logs**:

   ```bash
   podman logs -f amu-api
   ```

4. **Stop the container**:
   ```bash
   podman stop amu-api
   podman rm amu-api
   ```

## Useful Commands

### Container Management

```bash
# List running containers
podman ps

# List all containers (including stopped)
podman ps -a

# View container logs
podman logs amu-api

# Follow logs in real-time
podman logs -f amu-api

# Execute commands inside container
podman exec -it amu-api /bin/sh

# Restart container
podman restart amu-api

# View container stats (CPU, memory usage)
podman stats amu-api
```

### Image Management

```bash
# List images
podman images

# Remove image
podman rmi amu-api:latest

# Remove unused images
podman image prune

# Rebuild image without cache
podman build --no-cache -t amu-api:latest .
```

### Debugging

```bash
# Check container health
podman inspect --format='{{.State.Health.Status}}' amu-api

# View container IP address
podman inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' amu-api

# Test API from host
curl http://localhost:8080/health
curl http://localhost:8080/api/docs
```

## Production Deployment Tips

### 1. Enable Systemd Service (Auto-start on boot)

Create a systemd service file:

```bash
# Generate systemd service file
podman generate systemd --name amu-api --files --new

# Move to systemd directory
sudo mv container-amu-api.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable container-amu-api.service
sudo systemctl start container-amu-api.service

# Check status
sudo systemctl status container-amu-api.service
```

### 2. Use Secrets for Sensitive Data

Instead of `.env` file:

```bash
# Create secrets
echo -n "your_secret" | podman secret create gemini_api_key -
echo -n "your_jwt_secret" | podman secret create jwt_secret -

# Run with secrets
podman run -d \
  --name amu-api \
  --secret gemini_api_key \
  --secret jwt_secret \
  -p 8080:8080 \
  amu-api:latest
```

### 3. Resource Limits

Limit CPU and memory:

```bash
podman run -d \
  --name amu-api \
  --memory="512m" \
  --cpus="1.0" \
  -p 8080:8080 \
  --env-file .env \
  amu-api:latest
```

### 4. Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Backup Volumes

Backup logs and data:

```bash
# Backup logs
podman run --rm \
  -v ./logs:/source:ro \
  -v ./backups:/backup \
  alpine tar czf /backup/logs-$(date +%Y%m%d).tar.gz -C /source .
```

## Environment Variables

Make sure these are set in your `.env` file:

- `NODE_ENV`: Set to `production`
- `PORT`: Application port (default: 8080)
- `GEMINI_API_KEY`: Your Google Gemini API key
- `JWT_SECRET`: Secure JWT secret for authentication
- Firebase credentials (all `FIREBASE_*` variables)

## Troubleshooting

### Image registry error (Podman-specific)

If you see: `short-name "oven/bun:1.1.42-alpine" did not resolve to an alias`:

**Solution**: The Dockerfile uses the full registry URL `docker.io/oven/bun:...` for Podman compatibility. Make sure you're using the latest Dockerfile.

**Alternative**: Configure unqualified-search registries:

```bash
# Edit registries config
sudo nano /etc/containers/registries.conf

# Add under [registries.search]:
unqualified-search-registries = ["docker.io"]
```

### Container won't start

```bash
# Check logs for errors
podman logs amu-api

# Verify environment variables
podman exec amu-api env

# Test inside container
podman exec -it amu-api /bin/sh
```

### Port already in use

```bash
# Find process using port 8080
sudo lsof -i :8080

# Change port in .env or docker-compose
PORT=3000
```

### Permission issues with volumes

```bash
# SELinux context (if on Fedora/RHEL)
# Note the :Z flag in volume mounts handles this automatically

# Manual fix if needed
sudo chcon -Rt svirt_sandbox_file_t ./logs
```

### Firebase connection issues

```bash
# Verify service_account.json is mounted
podman exec amu-api ls -la service_account.json

# Check Firebase environment variables
podman exec amu-api env | grep FIREBASE
```

## Monitoring

### Basic health check

```bash
# From host
curl http://localhost:8080/health

# Inside container
podman exec amu-api wget -qO- http://localhost:8080/health
```

### View metrics

```bash
# Real-time resource usage
podman stats amu-api

# Container processes
podman top amu-api
```

## Security Considerations

1. **Never commit `.env` or `service_account.json`** - they're in `.gitignore`
2. **Use secrets management** in production (Podman secrets, Vault, etc.)
3. **Run as non-root user** inside container (can add to Dockerfile)
4. **Keep images updated**: `podman pull oven/bun:latest && podman build -t amu-api:latest .`
5. **Use HTTPS** in production with reverse proxy (Nginx/Traefik)

## Next Steps

- Set up CI/CD pipeline for automated builds
- Configure monitoring (Prometheus, Grafana)
- Set up log aggregation (ELK stack, Loki)
- Implement container orchestration (Kubernetes/Podman pods) for scaling
