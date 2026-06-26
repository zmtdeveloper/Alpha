$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Get-Location) "supabase\backups"
$backupPath = Join-Path $backupDir "local-$timestamp.sql"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

& docker exec supabase_db_alpha pg_dump `
  -U postgres `
  -d postgres `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges `
  --quote-all-identifiers `
  1> $backupPath

if ($LASTEXITCODE -ne 0) {
  if (Test-Path -LiteralPath $backupPath) {
    Remove-Item -LiteralPath $backupPath -Force
  }

  throw "Local Supabase backup failed. Confirm Docker Desktop is running and the Supabase stack is started."
}

if (-not (Test-Path -LiteralPath $backupPath) -or (Get-Item -LiteralPath $backupPath).Length -eq 0) {
  throw "Local Supabase backup failed because no dump content was written."
}

Write-Output "Saved local Supabase backup to $backupPath"
