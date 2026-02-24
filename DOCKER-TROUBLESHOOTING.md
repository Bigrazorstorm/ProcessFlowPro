# Development Dockerfiles - Troubleshooting

## Problem: pnpm-lock.yaml not found

Die Development Dockerfiles funktionieren jetzt auch **ohne** `pnpm-lock.yaml`.

### Schnelle Lösung (auf dem Server):

```bash
# Wenn pnpm-lock.yaml fehlt
sudo docker compose --profile fullstack up -d --build

# Die Dockerfiles installieren Dependencies automatisch
```

### Für reproduzierbare Builds:

1. **Lokal:** Stelle sicher, dass `pnpm-lock.yaml` committed ist
   ```bash
   git add pnpm-lock.yaml
   git commit -m "Add pnpm-lock.yaml for reproducible builds"
   git push
   ```

2. **Auf dem Server:**
   ```bash
   git pull
   sudo docker compose --profile fullstack up -d --build
   ```

## Unterschiede: Dev vs Production

| Dockerfile | Lock-File | Zweck |
|------------|-----------|-------|
| `Dockerfile.dev` | Optional | Schnelle Entwicklung |
| `Dockerfile` (prod) | Erforderlich | Reproduzierbare Builds |

## Häufige Docker-Fehler

### Image-Cache aufräumen
```bash
sudo docker system prune -a
sudo docker compose --profile fullstack build --no-cache
```

### Einzelne Services neu bauen
```bash
# Nur Backend
sudo docker compose build backend

# Nur Frontend
sudo docker compose build frontend
```

### Logs prüfen
```bash
# Build-Logs
sudo docker compose --profile fullstack up --build

# Runtime-Logs
sudo docker compose logs -f backend
sudo docker compose logs -f frontend
```

### Volumes löschen (bei Problemen)
```bash
# ACHTUNG: Löscht alle Daten!
sudo docker compose down -v
sudo docker compose --profile fullstack up -d --build
```
