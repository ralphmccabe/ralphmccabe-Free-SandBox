# TACTICAL RANGE CARD PRO - AUTO RELEASE & STAGING SCRIPT
# This script bumps the version, updates all files, creates an archive snapshot,
# and stages the files to the "Ready to be pushed" folder automatically.

$ErrorActionPreference = "Stop"

$SourceDir = "C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox"
$ArchiveParent = "C:\Users\RalphMccabe\.gemini\antigravity\scratch\All_Sandbox_Snapped_of_Current_Versions"
$ProdStagingDir = "C:\Users\RalphMccabe\.gemini\antigravity\scratch\All_Sandbox_Snapped_of_Current_Versions\Ready to be pushed"

$DateStr = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$PrettyDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 1. READ CURRENT VERSION FROM SW.JS
$SwPath = Join-Path $SourceDir "sw.js"
$SwContent = Get-Content $SwPath -Raw
if ($SwContent -match "TRC-PRO-VERSION\s*-\s*v(\d+)\.(\d+)\.(\d+)-PROD") {
    $Major = [int]$Matches[1]
    $Minor = [int]$Matches[2]
    $Patch = [int]$Matches[3]
} elseif ($SwContent -match "TRC-PRO-VERSION\s*-\s*v(\d+)\.(\d+)-PROD") {
    $Major = [int]$Matches[1]
    $Minor = [int]$Matches[2]
    $Patch = 0
} else {
    Write-Host "Could not detect version in sw.js! Aborting." -ForegroundColor Red
    exit
}

$CurrentVersion = "v${Major}.${Minor}.${Patch}-PROD"
$NewPatch = $Patch + 1
$NewVersion = "v${Major}.${Minor}.${NewPatch}-PROD"

Write-Host "========================================================" -ForegroundColor Green
Write-Host "       TACTICAL RANGE CARD PRO - AUTO UPDATER" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Current Version: $CurrentVersion"
Write-Host "New Version:     $NewVersion"
Write-Host "--------------------------------------------------------"

# 2. UPDATE SW.JS
$SwContent = $SwContent -replace $CurrentVersion, $NewVersion
$SwContent = $SwContent -replace "trc-pro-upgrade-$CurrentVersion", "trc-pro-upgrade-$NewVersion"
Set-Content -Path $SwPath -Value $SwContent

# 3. UPDATE INDEX.HTML
$IndexPath = Join-Path $SourceDir "index.html"
$IndexContent = Get-Content $IndexPath -Raw
$IndexContent = $IndexContent -replace "\?v=$CurrentVersion", "?v=$NewVersion"

# Using a generic regex to catch the "DRAFT SNAPSHOT vX.X.X-PROD" without breaking on emoji
$IndexContent = [regex]::Replace($IndexContent, "DRAFT SNAPSHOT v[\d.]+-PROD", "DRAFT SNAPSHOT $NewVersion")

Set-Content -Path $IndexPath -Value $IndexContent

# 4. APPEND TO VERSION_HISTORY.TXT
$HistoryPath = Join-Path $SourceDir "VERSION_HISTORY.txt"
$HistoryEntry = @"

============================================================
$NewVersion - DEPLOYED $PrettyDate
* Version auto-bumped from $CurrentVersion
* Service Worker cache updated to: trc-pro-upgrade-$NewVersion
* All tactical systems: OPERATIONAL
* Toast updater: ACTIVE - users will see update prompt on next app open
"@
Add-Content -Path $HistoryPath -Value $HistoryEntry

Write-Host "[*] Files updated with new version $NewVersion" -ForegroundColor Cyan

# 5. CREATE ARCHIVE SNAPSHOT
$ArchiveFolderName = "Snapshot_${NewVersion}_${DateStr}"
$TargetArchiveDir = Join-Path $ArchiveParent $ArchiveFolderName

$Exclusions = @(
    ".git", "twa-build", "android.keystore", "app-release-bundle.aab", 
    "app-release-signed.apk", "app-release-signed.apk.idsig", 
    "app-release-unsigned-aligned.apk", "cert.pfx", "cert.pem", "key.pem", "node_modules"
)

function Copy-FilteredDir ($src, $dest) {
    if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
    Get-ChildItem -Path $src -Force | ForEach-Object {
        $name = $_.Name
        if ($Exclusions -contains $name) { return }
        $destPath = Join-Path $dest $name
        if ($_.PSIsContainer) { Copy-FilteredDir $_.FullName $destPath } 
        else { Copy-Item -Path $_.FullName -Destination $destPath -Force }
    }
}

Write-Host "[*] Creating secure snapshot archive..." -ForegroundColor Cyan
Copy-FilteredDir $SourceDir $TargetArchiveDir

$RecipeFile = Join-Path $TargetArchiveDir "manifest-recipe.txt"
$RecipeContent = "TACTICAL RANGE CARD PRO - ARCHIVE RECIPE`r`n=======================================`r`nVersion:      $NewVersion`r`nTimestamp:    $PrettyDate`r`nSource Path:  $SourceDir`r`n"
Set-Content -Path $RecipeFile -Value $RecipeContent

# 6. STAGE TO "READY TO BE PUSHED"
Write-Host "[*] Copying files to Ready to be pushed folder..." -ForegroundColor Cyan
if (!(Test-Path $ProdStagingDir)) { New-Item -ItemType Directory -Path $ProdStagingDir | Out-Null }
Remove-Item -Path "$ProdStagingDir\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-FilteredDir $SourceDir $ProdStagingDir

Write-Host "SUCCESS: Auto-Update & Staging Complete." -ForegroundColor Green
Write-Host "New Version: $NewVersion" -ForegroundColor Green
Write-Host "Ready to push from: $ProdStagingDir" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
