# PowerShell Script para Windows - Auto-Discovery de Nodes
# Detecta IP e configura monitoramento automaticamente

# Função para log colorido
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Log-Success {
    param([string]$message)
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Log-Error {
    param([string]$message)
    Write-ColorOutput Red "[ERROR] $message"
}

function Log-Info {
    param([string]$message)
    Write-ColorOutput Yellow "[INFO] $message"
}

# Função para obter IP local
function Get-LocalIP {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | 
               Where-Object {$_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"} | 
               Select-Object -First 1).IPAddress
        
        if (-not $ip) {
            # Fallback: tentar outro método
            $ip = (Test-Connection -ComputerName $env:COMPUTERNAME -Count 1).IPV4Address.IPAddressToString
        }
        
        return $ip
    }
    catch {
        Log-Error "Falha ao detectar IP: $_"
        exit 1
    }
}

# Obter o diretório do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetsDir = Join-Path (Split-Path -Parent $scriptPath) "prometheus\targets"

# Criar diretório targets se não existir
if (-not (Test-Path $targetsDir)) {
    try {
        New-Item -ItemType Directory -Path $targetsDir -Force | Out-Null
        Log-Info "Diretório criado: $targetsDir"
    }
    catch {
        Log-Error "Falha ao criar diretório: $_"
        exit 1
    }
}

# Obter IP da máquina
$machineIP = Get-LocalIP
if (-not $machineIP) {
    Log-Error "Não foi possível detectar o IP da máquina"
    exit 1
}

Log-Info "IP detectado: $machineIP"

# Criar arquivo node-exporter.json
$nodeExporterFile = Join-Path $targetsDir "node-exporter.json"
$jsonContent = @"
[
  {
    "labels": {
      "job": "node-exporter",
      "instance": "$machineIP"
    },
    "targets": ["$machineIP:9100"]
  }
]
"@

try {
    $jsonContent | Out-File -FilePath $nodeExporterFile -Encoding UTF8 -Force
    Log-Success "Arquivo criado: node-exporter.json com IP: $machineIP"
}
catch {
    Log-Error "Falha ao criar node-exporter.json: $_"
    exit 1
}

# Criar/atualizar arquivo .env
$envFile = Join-Path (Split-Path -Parent $scriptPath) ".env"
try {
    "MACHINE_IP=$machineIP" | Out-File -FilePath $envFile -Encoding UTF8 -Force
    Log-Success "Variável MACHINE_IP exportada e salva no arquivo .env"
}
catch {
    Log-Error "Falha ao criar arquivo .env: $_"
    exit 1
}

# Exportar variável de ambiente para sessão atual
$env:MACHINE_IP = $machineIP

Log-Success "Configuração concluída com sucesso!"
Log-Info ""
Log-Info "Próximos passos:"
Log-Info "  1. Execute: docker compose up -d"
Log-Info "  2. Acesse Grafana em: http://localhost:3001"
Log-Info "  3. Acesse Prometheus em: http://localhost:9090"
