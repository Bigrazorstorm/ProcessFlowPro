# Start Script for ProcessFlow Pro
Write-Host "🚀 Starting ProcessFlow Pro..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "1️⃣  Checking Docker..." -ForegroundColor Yellow
try {
    $null = docker ps 2>&1
    Write-Host "   ✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Start Docker Compose services
Write-Host ""
Write-Host "2️⃣  Starting infrastructure (PostgreSQL, Redis, MinIO)..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "   Waiting for services to be ready (15 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Check if PostgreSQL is ready
$dbReady = Test-NetConnection localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($dbReady) {
    Write-Host "   ✅ Database is ready" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Database might not be ready yet. Waiting 10 more seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Check if demo data exists
Write-Host ""
Write-Host "3️⃣  Checking demo data..." -ForegroundColor Yellow

$setupNeeded = $true
try {
    $result = docker exec processflowpro-postgres psql -U postgres -d processflowpro -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user';" 2>&1
    if ($result -match "\s*1\s*") {
        $userCount = docker exec processflowpro-postgres psql -U postgres -d processflowpro -t -c "SELECT COUNT(*) FROM ""user"";" 2>&1
        if ($userCount -match "\s*[1-9]\d*\s*") {
            Write-Host "   ✅ Demo data already exists" -ForegroundColor Green
            $setupNeeded = $false
        }
    }
} catch {
    Write-Host "   ⚠️  Could not check database status" -ForegroundColor Yellow
}

if ($setupNeeded) {
    Write-Host "   📦 Setting up database and demo data..." -ForegroundColor Cyan
    Set-Location apps\backend
    pnpm run setup
    Set-Location ..\..
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Demo data loaded successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Setup failed. Please check the errors above." -ForegroundColor Red
        exit 1
    }
}

# Final status
Write-Host ""
Write-Host "✅ All services are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Open a new terminal and run: pnpm backend" -ForegroundColor White
Write-Host "   2. Open another terminal and run: pnpm frontend" -ForegroundColor White
Write-Host "   3. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Login credentials:" -ForegroundColor Cyan
Write-Host "   Owner: owner@example.com / password123" -ForegroundColor White
Write-Host "   Senior: senior@example.com / password123" -ForegroundColor White
Write-Host "   Accountant: accountant@example.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
