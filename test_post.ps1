$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MjBkNzNiNS1iMGUzLTQ0M2YtYWFjNS00OGVmZWQ3ZTFlMzciLCJlbWFpbCI6ImFkbWluQGZvcnRhbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjMwNzQyMDYsImV4cCI6MTc2MzY3OTAwNn0.366-VHgPqXnCiEiUWsiRmyOM9uS_QF-Jd4iyLN9VXIA"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    client_name = "Teste PowerShell"
    value = 1000
    kilowatts = 100
    sale_type = "direct"
} | ConvertTo-Json

Write-Host "Enviando requisicao POST para http://localhost:4000/api/sales..."
Write-Host "Body: $body"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/sales" -Method POST -Headers $headers -Body $body -TimeoutSec 5
    Write-Host "Sucesso! Resposta:"
    $response | ConvertTo-Json
} catch {
    Write-Host "Erro: $_"
    Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__
}
