# 🚀 Quick Deploy Reference

## Fastest Way to Deploy

```bash
# Make script executable (first time only)
chmod +x deploy.sh

# Run the interactive deployment script
./deploy.sh
```

## Manual Commands

### Build Image

```bash
podman build -t amu-api:latest .
```

### Run Container

```bash
podman run -d \
  --name amu-api \
  -p 8080:8080 \
  --env-file .env \
  -v ./logs:/app/logs:Z \
  -v ./service_account.json:/app/service_account.json:ro,Z \
  amu-api:latest
```

### View Logs

```bash
podman logs -f amu-api
```

### Stop Container

```bash
podman stop amu-api && podman rm amu-api
```

### Restart

```bash
podman restart amu-api
```

## Test Endpoints

```bash
# Health check
curl http://localhost:8080/health

# API Documentation
open http://localhost:8080/api/docs
```

## Troubleshooting

### Container won't start?

```bash
# Check logs
podman logs amu-api

# Check if port is in use
sudo lsof -i :8080
```

### Need to rebuild?

```bash
podman stop amu-api
podman rm amu-api
podman rmi amu-api:latest
podman build --no-cache -t amu-api:latest .
```

### Environment issues?

```bash
# Verify .env is loaded
podman exec amu-api env | grep -E "NODE_ENV|PORT|FIREBASE"
```

## Using podman-compose (Alternative)

```bash
# Install
pip3 install podman-compose

# Start
podman-compose up -d

# Logs
podman-compose logs -f

# Stop
podman-compose down
```

---

📚 For detailed documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
