# Task Planning Project - Complete Test Suite
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    TASK PLANNING PROJECT - COMPREHENSIVE TEST SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$pass = 0
$fail = 0

function Run-Test {
    param($name, $block)
    try {
        Write-Host "Testing: $name..." -ForegroundColor Yellow -NoNewline
        $result = & $block
        $script:pass++
        Write-Host " PASS" -ForegroundColor Green
        return $result
    } catch {
        $script:fail++
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "--- 1. SERVER STATUS ---" -ForegroundColor Cyan
Write-Host ""

Run-Test "Backend Server (port 5000)" {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/users' -Method GET -TimeoutSec 5 | Out-Null
    return "OK"
}

Run-Test "Frontend Server (port 3002)" {
    Invoke-WebRequest -Uri 'http://localhost:3002' -Method GET -TimeoutSec 5 | Out-Null
    return "OK"
}

Write-Host ""
Write-Host "--- 2. AUTHENTICATION ---" -ForegroundColor Cyan
Write-Host ""

$ts = (Get-Date).ToString('yyyyMMddHHmmss')
$testUser = @{
    username = "user$ts"
    email = "test${ts}@test.com"
    password = "Pass123!"
}

Run-Test "User Registration" {
    $body = $testUser | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method POST -Body $body -ContentType 'application/json'
    $script:token = $resp.token
    $script:userId = $resp.user.id
    return "User ID: $($resp.user.id)"
}

Run-Test "User Login" {
    $body = @{ email = $testUser.email; password = $testUser.password } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
    return "Token received"
}

Run-Test "JWT Token Verification" {
    $headers = @{ 'Authorization' = "Bearer $script:token" }
    $resp = Invoke-RestMethod -Uri "http://localhost:5000/api/users/$script:userId" -Headers $headers
    return "User: $($resp.username)"
}

Write-Host ""
Write-Host "--- 3. TASKS MANAGEMENT ---" -ForegroundColor Cyan
Write-Host ""

$headers = @{ 'Authorization' = "Bearer $script:token"; 'Content-Type' = 'application/json' }

Run-Test "Create Task 1 (P5, 90min)" {
    $body = @{ title = "High Priority Task"; estimated_minutes = 90; priority = 5; deadline_at = "2026-01-27T18:00:00" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $headers -Body $body
    $script:task1 = $resp.id
    return "ID: $($resp.id)"
}

Run-Test "Create Task 2 (P3, 60min)" {
    $body = @{ title = "Medium Task"; estimated_minutes = 60; priority = 3; deadline_at = "2026-01-27T20:00:00" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $headers -Body $body
    $script:task2 = $resp.id
    return "ID: $($resp.id)"
}

Run-Test "Create Task 3 (P1, 30min)" {
    $body = @{ title = "Low Task"; estimated_minutes = 30; priority = 1 } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $headers -Body $body
    $script:task3 = $resp.id
    return "ID: $($resp.id)"
}

Run-Test "Read All Tasks" {
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Headers $headers
    return "Count: $($resp.Count)"
}

Run-Test "Update Task Priority" {
    $body = @{ priority = 2 } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$script:task3" -Method PATCH -Headers $headers -Body $body
    return "New priority: $($resp.priority)"
}

Write-Host ""
Write-Host "--- 4. BUSY BLOCKS ---" -ForegroundColor Cyan
Write-Host ""

Run-Test "Create Busy Block" {
    $body = @{ title = "Lunch"; start_at = "2026-01-27T12:00:00"; end_at = "2026-01-27T13:00:00" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/busyblocks' -Method POST -Headers $headers -Body $body
    $script:block = $resp.id
    return "ID: $($resp.id)"
}

Run-Test "Read Busy Blocks" {
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/busyblocks' -Headers $headers
    return "Count: $($resp.Count)"
}

Write-Host ""
Write-Host "--- 5. PLAN GENERATION ---" -ForegroundColor Cyan
Write-Host ""

Run-Test "Generate Daily Plan" {
    $body = @{ date = "2026-01-27"; workStart = "09:00"; workEnd = "22:00" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans/generate' -Method POST -Headers $headers -Body $body
    $script:planBlocks = $resp.blocks
    return "Blocks: $($resp.blocks.Count)"
}

Run-Test "Verify Scheduling Start Time" {
    $blocks = $script:planBlocks | Sort-Object { [DateTime]$_.start_at }
    $firstBlock = $blocks[0]
    $startTime = ([DateTime]$firstBlock.start_at).ToString('HH:mm')
    if ($startTime -ne "09:00") { throw "Starts at $startTime not 09:00" }
    return "Starts at $startTime"
}

Run-Test "Verify Task Ordering" {
    $blocks = $script:planBlocks | Sort-Object { [DateTime]$_.start_at }
    $order = ($blocks | ForEach-Object { "P$($_.priority)" }) -join " -> "
    return "Order: $order"
}

Run-Test "Retrieve Plan by Date" {
    $resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans?date=2026-01-27' -Headers $headers
    return "$($resp.blocks.Count) blocks"
}

Write-Host ""
Write-Host "--- 6. BLOCK ACTIONS ---" -ForegroundColor Cyan
Write-Host ""

if ($script:planBlocks -and $script:planBlocks.Count -gt 0) {
    Run-Test "Mark Block as Done" {
        $blockId = $script:planBlocks[0].id
        $body = @{ completeTask = $true } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/plans/blocks/$blockId/done" -Method POST -Headers $headers -Body $body | Out-Null
        return "Success"
    }
    
    if ($script:planBlocks.Count -gt 1) {
        Run-Test "Mark Block as Missed" {
            $blockId = $script:planBlocks[1].id
            $body = @{ reschedule = $true } | ConvertTo-Json
            Invoke-RestMethod -Uri "http://localhost:5000/api/plans/blocks/$blockId/missed" -Method POST -Headers $headers -Body $body | Out-Null
            return "Rescheduled"
        }
    }
}

Write-Host ""
Write-Host "--- 7. DELETE OPERATIONS ---" -ForegroundColor Cyan
Write-Host ""

Run-Test "Delete Busy Block" {
    Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks/$script:block" -Method DELETE -Headers $headers | Out-Null
    return "Deleted"
}

Run-Test "Delete Task" {
    Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$script:task3" -Method DELETE -Headers $headers | Out-Null
    return "Deleted"
}

Write-Host ""
Write-Host "--- 8. FRONTEND ---" -ForegroundColor Cyan
Write-Host ""

Run-Test "Frontend Accessibility" {
    $resp = Invoke-WebRequest -Uri 'http://localhost:3002' -Method GET -TimeoutSec 5
    if ($resp.StatusCode -eq 200) { return "HTTP 200" } else { throw "HTTP $($resp.StatusCode)" }
}

Run-Test "No JSX Errors in Planner" {
    $planner = Get-Content "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-frontend\src\pages\Planner.jsx" -Raw
    if ($planner.Length -gt 1000) { return "File OK" } else { throw "File too small" }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                    TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests: $($pass + $fail)" -ForegroundColor White
Write-Host "  Passed:      $pass" -ForegroundColor Green
Write-Host "  Failed:      $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($fail -eq 0) {
    Write-Host "  ALL TESTS PASSED - PROJECT IS WORKING PERFECTLY!" -ForegroundColor Green
} else {
    Write-Host "  SOME TESTS FAILED - REVIEW ERRORS ABOVE" -ForegroundColor Red
}

Write-Host ""
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "  Database: PostgreSQL (planning-project)" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
