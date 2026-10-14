# ERP Application - Automated Test Script
# Run from: C:\Users\Krisc\Desktop\git projects\ERP
param()

$ErrorActionPreference = "Continue"
$BaseUrl = "http://localhost:3001/api/v1"
$WebUrl = "http://localhost:3000"
$TestResults = @()

function Write-Test {
    param($Name, $Status, $Details = "")
    $Script:TestResults += [PSCustomObject]@{
        Test = $Name
        Status = $Status
        Details = $Details
        Time = Get-Date -Format "HH:mm:ss"
    }
    $color = if ($Status -eq "PASS") { "Green" } elseif ($Status -eq "FAIL") { "Red" } else { "Yellow" }
    Write-Host "  [$Status] $Name" -ForegroundColor $color
    if ($Details) { Write-Host "         $Details" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ERP Application Test Suite" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get JWT Token
function Get-Token {
    try {
        $body = @{ email = "admin@erp.com"; password = "admin123" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$BaseUrl/auth-v2/login" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
        return $response.accessToken
    }
    catch {
        return $null
    }
}

# Make authenticated request
function Invoke-Api {
    param($Endpoint, $Method = "GET", $Body = $null)
    $headers = @{ "Authorization" = "Bearer $script:Token"; "Content-Type" = "application/json" }
    $uri = "$BaseUrl$Endpoint"
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json) -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -ErrorAction Stop
        }
        return $response
    }
    catch {
        return $null
    }
}

Write-Host "Running API Tests..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Login
Write-Host "AUTHENTICATION TESTS" -ForegroundColor Cyan
$Token = Get-Token
if ($Token) {
    Write-Test "POST /auth-v2/login" "PASS" "Token received"
} else {
    Write-Test "POST /auth-v2/login" "FAIL" "Server may not be running"
}

# Test 2: Profile
Write-Host ""
Write-Host "USER MANAGEMENT TESTS" -ForegroundColor Cyan
$profile = Invoke-Api "/auth-v2/me"
if ($profile) {
    Write-Test "GET /auth-v2/me" "PASS"
    $permCount = $profile.permissions.Count
    Write-Test "Permissions loaded" $(if ($permCount -gt 0) { "PASS" } else { "FAIL" }) "Count: $permCount"
} else {
    Write-Test "GET /auth-v2/me" "FAIL"
}

# Test 3: Masters
Write-Host ""
Write-Host "MASTERS MODULE TESTS" -ForegroundColor Cyan
$products = Invoke-Api "/masters/products"
Write-Test "GET /masters/products" $(if ($products) { "PASS" } else { "FAIL" })
$categories = Invoke-Api "/masters/categories"
Write-Test "GET /masters/categories" $(if ($categories) { "PASS" } else { "FAIL" })
$brands = Invoke-Api "/masters/brands"
Write-Test "GET /masters/brands" $(if ($brands) { "PASS" } else { "FAIL" })
$customers = Invoke-Api "/masters/customers"
Write-Test "GET /masters/customers" $(if ($customers) { "PASS" } else { "FAIL" })

# Test 4: Sales
Write-Host ""
Write-Host "SALES MODULE TESTS" -ForegroundColor Cyan
$enquiries = Invoke-Api "/sales-enquiries"
Write-Test "GET /sales-enquiries" $(if ($enquiries) { "PASS" } else { "FAIL" })
$stats = Invoke-Api "/sales-enquiries/stats"
Write-Test "GET /sales-enquiries/stats" $(if ($stats) { "PASS" } else { "FAIL" })

# Test 5: Purchase
Write-Host ""
Write-Host "PURCHASE MODULE TESTS" -ForegroundColor Cyan
$quotes = Invoke-Api "/purchase/quotes"
Write-Test "GET /purchase/quotes" $(if ($quotes) { "PASS" } else { "FAIL" })

# Test 6: Rate
Write-Host ""
Write-Host "RATE MODULE TESTS" -ForegroundColor Cyan
$analysis = Invoke-Api "/rate/analysis"
Write-Test "GET /rate/analysis" $(if ($analysis) { "PASS" } else { "FAIL" })
$currency = Invoke-Api "/rate/currency"
Write-Test "GET /rate/currency" $(if ($currency) { "PASS" } else { "FAIL" })

# Test 7: FMS
Write-Host ""
Write-Host "FMS MODULE TESTS" -ForegroundColor Cyan
$tasks = Invoke-Api "/fms/tasks"
Write-Test "GET /fms/tasks" $(if ($tasks) { "PASS" } else { "FAIL" })
$myTasks = Invoke-Api "/fms/tasks/my"
Write-Test "GET /fms/tasks/my" $(if ($myTasks) { "PASS" } else { "FAIL" })
$dashboard = Invoke-Api "/fms/dashboard/stats"
Write-Test "GET /fms/dashboard/stats" $(if ($dashboard) { "PASS" } else { "FAIL" })

# Test 8: Reports
Write-Host ""
Write-Host "REPORTS MODULE TESTS" -ForegroundColor Cyan
$report = Invoke-Api "/reports/dashboard"
Write-Test "GET /reports/dashboard" $(if ($report) { "PASS" } else { "FAIL" })

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$passCount = ($TestResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $TestResults.Count

Write-Host ""
Write-Host "  Total Tests: $totalCount" -ForegroundColor White
Write-Host "  Passed: $passCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0 -and $passCount -gt 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
} elseif ($failCount -gt 0) {
    Write-Host "  SOME TESTS FAILED - Check server status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Access Web UI: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Access API:   http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

# Open browser
Start-Process $WebUrl
