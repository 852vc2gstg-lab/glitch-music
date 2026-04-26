param(
  [int]$Port = 8080,
  [string]$OutputFile = "links.txt",
  [int]$WaitSeconds = 30
)

$ErrorActionPreference = "Stop"

function Get-NgrokUrl {
  param([int]$Port)

  $api = "http://127.0.0.1:4040/api/tunnels"
  $response = Invoke-RestMethod -Uri $api -Method Get
  if (-not $response.tunnels) { return $null }

  $httpsTunnel = $response.tunnels |
    Where-Object { $_.proto -eq "https" -and $_.config.addr -match "(:|localhost:|127\.0\.0\.1:)$Port$" } |
    Select-Object -First 1

  if (-not $httpsTunnel) {
    $httpsTunnel = $response.tunnels |
      Where-Object { $_.proto -eq "https" } |
      Select-Object -First 1
  }

  return $httpsTunnel.public_url
}

function Build-Links {
  param([string]$BaseUrl)

  $ext = @(".mp3", ".flac", ".wav", ".m4a", ".aac", ".ogg", ".opus")
  $files = Get-ChildItem -File | Where-Object { $ext -contains $_.Extension.ToLowerInvariant() } | Sort-Object Name
  if (-not $files) {
    Set-Content -Path $OutputFile -Value "# Bu klasorde ses dosyasi bulunamadi." -Encoding UTF8
    return
  }

  $lines = @()
  $lines += "# Public base URL: $BaseUrl"
  $lines += "# Olusturma zamani: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
  $lines += ""

  foreach ($file in $files) {
    $encoded = [System.Uri]::EscapeDataString($file.Name)
    $lines += "$BaseUrl/$encoded"
  }

  Set-Content -Path $OutputFile -Value $lines -Encoding UTF8
}

$deadline = (Get-Date).AddSeconds($WaitSeconds)
$publicUrl = $null

while ((Get-Date) -lt $deadline -and -not $publicUrl) {
  try {
    $publicUrl = Get-NgrokUrl -Port $Port
  } catch {
    $publicUrl = $null
  }
  if (-not $publicUrl) {
    Start-Sleep -Milliseconds 700
  }
}

if (-not $publicUrl) {
  Write-Host "ngrok public URL alinmadi. 4040 API cevap vermiyor olabilir." -ForegroundColor Yellow
  exit 1
}

Build-Links -BaseUrl $publicUrl
Write-Host "Link listesi olusturuldu: $OutputFile" -ForegroundColor Green
Write-Host "Public URL: $publicUrl" -ForegroundColor Cyan

