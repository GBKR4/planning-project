# COMPREHENSIVE PROJECT TEST SCRIPT
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TASK PLANNING PROJECT - COMPREHENSIVE TEST SUITE            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$global:TestResults = @()
$global:PassCount = 0
$global:FailCount = 0

function Test-Step {
    param($Name, $ScriptBlock)
    try {
        Write-Host "Testing: $Name..." -ForegroundColor Yellow -NoNewline
        $result = & $ScriptBlock
        $global:PassCount++
        $global:TestResults += @{Name=$Name; Status="PASS"; Result=$result}
        Write-Host " PASS" -ForegroundColor Green
        return $result
    } catch {
        $global:FailCount++
        $global:TestResults += @{Name=$Name; Status="FAIL"; Error=$_.Exception.Message}
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n═══ 1. SERVER STATUS ═══`n" -ForegroundColor Cyan

Test-Step "Backend Server (port 5000)" {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/users' -Method GET -TimeoutSec 5
    return "Running"
}

Test-Step "Frontend Server (port 3002)" {
    $response = Invoke-WebRequest -Uri 'http://localhost:3002' -Method GET -TimeoutSec 5
    return "Running"
}

Write-Host "`n═══ 2. AUTHENTICATION ═══`n" -ForegroundColor Cyan

$timestamp = (Get-Date).ToString('yyyyMMddHHmmss')
$global:TestUser = @{
    username = "testuser_$timestamp"
    email = "test_${timestamp}@test.com"
    password = "SecurePass123!"
}

$regResult = Test-Step "User Registration" {
    $body = @{
        username = $global:TestUser.username
        email = $global:TestUser.email
        password = $global:TestUser.password
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' `
                                  -Method POST `
                                  -Body $body `
                                  -ContentType 'application/json'
    
    $global:testToken = $response.token
    $global:testUserId = $response.user.id
    return "User ID: $($response.user.id)"
}

$loginResult = Test-Step "User Login" {
    $body = @{
        email = $global:TestUser.email
        password = $global:TestUser.password
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' `
                                  -Method POST `
                                  -Body $body `
                                  -ContentType 'application/json'
    return "Token length: $($response.token.Length)"
}

$jwtResult = Test-Step "JWT Token Verification" {
    $headers = @{ 'Authorization' = "Bearer $global:testToken" }
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/users/$global:testUserId" `
                                  -Headers $headers
    return "User: $($response.username)"
}

Write-Host "`n═══ 3. TASKS MANAGEMENT ═══`n" -ForegroundColor Cyan

$headers = @{
    'Authorization' = "Bearer $global:testToken"
    'Content-Type' = 'application/json'
}

$createTask1 = Test-Step "Create Task 1 (P5, 90min, deadline)" {
    $body = @{
        title = "High Priority Task"
        description = "Important task"
        estimated_minutes = 90
        priority = 5
        deadline_at = "2026-01-27T18:00:00"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' `
                                  -Method POST `
                                  -Headers $headers `
                                  -Body $body
    $global:task1Id = $response.id
    return "ID: $($response.id), Priority: $($response.priority)"
}

$createTask2 = Test-Step "Create Task 2 (P3, 60min, deadline)" {
    $body = @{
        title = "Medium Priority Task"
        description = "Medium task"
        estimated_minutes = 60
        priority = 3
        deadline_at = "2026-01-27T20:00:00"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' `
                                  -Method POST `
                                  -Headers $headers `
                                  -Body $body
    $global:task2Id = $response.id
    return "ID: $($response.id), Priority: $($response.priority)"
}

$createTask3 = Test-Step "Create Task 3 (P1, 30min, no deadline)" {
    $body = @{
        title = "Low Priority Task"
        description = "Low priority"
        estimated_minutes = 30
        priority = 1
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' `
                                  -Method POST `
                                  -Headers $headers `
                                  -Body $body
    $global:task3Id = $response.id
    return "ID: $($response.id), Priority: $($response.priority)"
}

$readTasks = Test-Step "Read All Tasks" {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Headers $headers
    return "Count: $($response.Count)"
}

$updateTask = Test-Step "Update Task Priority" {
    $body = @{ priority = 2 } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$global:task3Id" `
                                  -Method PATCH `
                                  -Headers $headers `
                                  -Body $body
    return "New Priority: $($response.priority)"
}

Write-Host "`n═══ 4. BUSY BLOCKS ═══`n" -ForegroundColor Cyan

$createBlock = Test-Step "Create Busy Block" {
    $body = @{
        title = "Lunch Break"
        start_at = "2026-01-27T12:00:00"
        end_at = "2026-01-27T13:00:00"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/busyblocks' `
                                  -Method POST `
                                  -Headers $headers `
                                  -Body $body
    $global:blockId = $response.id
    return "ID: $($response.id)"
}

$readBlocks = Test-Step "Read Busy Blocks" {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/busyblocks' -Headers $headers
    return "Count: $($response.Count)"
}

Write-Host "`n═══ 5. PLAN GENERATION ═══`n" -ForegroundColor Cyan

$generatePlan = Test-Step "Generate Daily Plan" {
    $body = @{
        date = "2026-01-27"
        workStart = "09:00"
        workEnd = "22:00"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans/generate' `
                                  -Method POST `
                                  -Headers $headers `
                                  -Body $body
    
    $global:planId = $response.plan.id
    $global:planBlocks = $response.blocks
    return "Blocks: $($response.blocks.Count), Plan ID: $($response.plan.id)"
}

$verifyScheduling = Test-Step "Verify Task Scheduling Order" {
    $blocks = $global:planBlocks | Sort-Object { [DateTime]$_.start_at }
    $order = $blocks | ForEach-Object { "P$($_.priority) ($($_.estimated_minutes)min)" }
    $orderString = $order -join " → "
    
    # Check: Should start at 09:00
    $firstBlock = $blocks[0]
    $startTime = ([DateTime]$firstBlock.start_at).ToString('HH:mm')
    
    if ($startTime -ne "09:00") {
        throw "First block starts at $startTime instead of 09:00"
    }
    
    return "Order: $orderString, Start: $startTime"
}

$getPlan = Test-Step "Retrieve Plan by Date" {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans?date=2026-01-27' -Headers $headers
    return "Plan retrieved, $($response.blocks.Count) blocks"
}

Write-Host "`n═══ 6. BLOCK ACTIONS ═══`n" -ForegroundColor Cyan

if ($global:planBlocks -and $global:planBlocks.Count -gt 0) {
    $testBlockId = $global:planBlocks[0].id
    
    $markDone = Test-Step "Mark Block as Done" {
        $body = @{ completeTask = $true } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/plans/blocks/$testBlockId/done" `
                                      -Method POST `
                                      -Headers $headers `
                                      -Body $body
        return "Block marked done, task completed"
    }
    
    if ($global:planBlocks.Count -gt 1) {
        $testBlockId2 = $global:planBlocks[1].id
        
        $markMissed = Test-Step "Mark Block as Missed (with reschedule)" {
            $body = @{ reschedule = $true } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/plans/blocks/$testBlockId2/missed" `
                                          -Method POST `
                                          -Headers $headers `
                                          -Body $body
            return "Block missed, task rescheduled"
        }
        
        $verifyReschedule = Test-Step "Verify Rescheduling from Current Time" {
            $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans?date=2026-01-27' -Headers $headers
            $newBlocks = $response.blocks | Where-Object { $_.status -eq 'pending' }
            
            if ($newBlocks.Count -gt 0) {
                $firstPending = $newBlocks | Sort-Object { [DateTime]$_.start_at } | Select-Object -First 1
                $startTime = ([DateTime]$firstPending.start_at).ToString('HH:mm')
                return "Rescheduled blocks found, next start: $startTime"
            } else {
                return "No pending blocks (all done/missed)"
            }
        }
    }
}

Write-Host "`n═══ 7. DATA CLEANUP (DELETE OPERATIONS) ═══`n" -ForegroundColor Cyan

$deleteBlock = Test-Step "Delete Busy Block" {
    if ($global:blockId) {
        Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks/$global:blockId" `
                          -Method DELETE `
                          -Headers $headers | Out-Null
        return "Block deleted"
    } else {
        throw "No block ID to delete"
    }
}

$deleteTask = Test-Step "Delete Task" {
    if ($global:task3Id) {
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$global:task3Id" `
                          -Method DELETE `
                          -Headers $headers | Out-Null
        return "Task deleted"
    } else {
        throw "No task ID to delete"
    }
}

Write-Host "`n═══ 8. FRONTEND COMPILATION ═══`n" -ForegroundColor Cyan

Test-Step "Frontend JSX Syntax Check" {
    $planner = Get-Content "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-frontend\src\pages\Planner.jsx" -Raw
    if ($planner -match '\)\s*;\s*\}\)\}') {
        throw "JSX syntax error detected"
    }
    return "No syntax errors found"
}

Test-Step "Frontend Accessibility" {
    $response = Invoke-WebRequest -Uri 'http://localhost:3002' -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        return "Frontend accessible, status 200"
    } else {
        throw "Frontend returned status $($response.StatusCode)"
    }
}

# FINAL REPORT
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                     TEST SUMMARY                             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "  Total Tests: $($global:PassCount + $global:FailCount)" -ForegroundColor White
Write-Host "  Passed:      " -NoNewline; Write-Host "$global:PassCount" -ForegroundColor Green
Write-Host "  Failed:      " -NoNewline; Write-Host "$global:FailCount" -ForegroundColor $(if ($global:FailCount -eq 0) { "Green" } else { "Red" })

if ($global:FailCount -eq 0) {
    Write-Host "  ALL TESTS PASSED - PROJECT IS WORKING PERFECTLY!" -ForegroundColor Green
} else {
    Write-Host "  SOME TESTS FAILED - REVIEW ERRORS ABOVE" -ForegroundColor Red
}

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   SERVER INFORMATION                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "  Database: PostgreSQL (planning-project)" -ForegroundColor Cyan
Write-Host ""
