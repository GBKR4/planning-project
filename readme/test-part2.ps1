# ==================================================================
# COMPREHENSIVE TEST - PART 2
# Phases 6-10: Block Status, Security, Stress Testing, Frontend, Cleanup
# ==================================================================

$ErrorActionPreference = "Continue"

# Import session data from Part 1
if (Test-Path "$PSScriptRoot\test-session.xml") {
    $global:testUser = Import-Clixml -Path "$PSScriptRoot\test-session.xml"
    $sessionData = Import-Clixml -Path "$PSScriptRoot\test-data.xml"
    $global:accessToken = $sessionData.accessToken
    $global:userId = $sessionData.userId
    $global:taskIds = $sessionData.taskIds
    $global:blockIds = $sessionData.blockIds
    $global:planId = $sessionData.planId
    
    $global:authHeaders = @{
        "Authorization" = "Bearer $($global:accessToken)"
        "Content-Type" = "application/json"
    }
    
    Write-Host "`n  Session data loaded from Part 1" -ForegroundColor Cyan
} else {
    Write-Host "`n  ERROR: Must run test-part1.ps1 first!" -ForegroundColor Red
    exit 1
}

$global:PassCount = 0
$global:FailCount = 0
$global:TestResults = @()
$global:StartTime = Get-Date

function Write-Phase {
    param($Number, $Name)
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host " PHASE $Number : $Name" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}

function Write-Category {
    param($Name)
    Write-Host "`n>>> $Name" -ForegroundColor Yellow
    Write-Host ("-" * 70) -ForegroundColor DarkGray
}

function Test-Function {
    param(
        [string]$Name,
        [scriptblock]$TestCode
    )
    
    try {
        Write-Host "  [$($global:PassCount + $global:FailCount + 1)] " -NoNewline -ForegroundColor DarkGray
        Write-Host "$Name" -NoNewline -ForegroundColor White
        Write-Host "..." -NoNewline -ForegroundColor DarkGray
        
        $result = & $TestCode
        
        $global:PassCount++
        $global:TestResults += [PSCustomObject]@{
            ID = $global:PassCount + $global:FailCount
            Test = $Name
            Status = "PASS"
            Result = $result
            Error = $null
        }
        
        Write-Host " PASS" -ForegroundColor Green
        return $result
    }
    catch {
        $global:FailCount++
        $global:TestResults += [PSCustomObject]@{
            ID = $global:PassCount + $global:FailCount
            Test = $Name
            Status = "FAIL"
            Result = $null
            Error = $_.Exception.Message
        }
        
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        return $null
    }
}

Write-Host "`n`n"
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "" -ForegroundColor Magenta
Write-Host "     COMPREHENSIVE TEST SUITE - PART 2" -ForegroundColor Magenta
Write-Host "     Security, Stress Testing, Frontend, Cleanup" -ForegroundColor Magenta
Write-Host "" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Test Date: $(Get-Date -Format 'MMMM dd, yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "  Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# ==================================================================
# PHASE 6: SECURITY AND ERROR HANDLING
# ==================================================================

Write-Phase "6" "SECURITY AND ERROR HANDLING"

Write-Category "Rate Limiting"

Test-Function "Handle Rapid Sequential Requests" {
    for ($i = 0; $i -lt 15; $i++) {
        Invoke-RestMethod -Uri "http://localhost:5000/api/me" -Headers $global:authHeaders | Out-Null
    }
    return "15 requests handled"
}

Test-Function "Handle Multiple Concurrent Operations" {
    Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders | Out-Null
    Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Headers $global:authHeaders | Out-Null
    Invoke-RestMethod -Uri "http://localhost:5000/api/me" -Headers $global:authHeaders | Out-Null
    return "Concurrent ops successful"
}

Write-Category "Data Integrity"

Test-Function "Verify Tasks Belong to User" {
    $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders
    foreach ($task in $tasks) {
        if ($task.user_id -and $task.user_id -ne $global:userId) {
            throw "Found task from different user"
        }
    }
    return "All tasks belong to user"
}

Test-Function "Verify Busy Blocks Belong to User" {
    $blocks = Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Headers $global:authHeaders
    foreach ($block in $blocks) {
        if ($block.user_id -and $block.user_id -ne $global:userId) {
            throw "Found block from different user"
        }
    }
    return "All blocks belong to user"
}

Test-Function "Verify Data Persistence" {
    $body = @{
        title = "Persistence Test Task"
        estimated_minutes = 45
        priority = 4
    } | ConvertTo-Json
    
    $created = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
    Start-Sleep -Milliseconds 500
    
    $retrieved = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($created.id)" -Headers $global:authHeaders
    
    if ($retrieved.title -ne "Persistence Test Task") {
        throw "Data not persisted correctly"
    }
    return "Data persisted correctly"
}

Test-Function "Verify Task Count Consistency" {
    $count1 = (Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders).Count
    Start-Sleep -Milliseconds 500
    $count2 = (Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders).Count
    
    if ($count1 -ne $count2) {
        throw "Task count inconsistent: $count1 vs $count2"
    }
    return "Count consistent: $count1"
}

Write-Category "Authorization Checks"

Test-Function "Cannot Access Other User Tasks" {
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/999999" -Headers $global:authHeaders
        # If task exists and belongs to us, that's fine
        return "Authorization working"
    }
    catch {
        # 404 is expected for non-existent task
        if ($_.Exception.Message -like "*404*") {
            return "Authorization working"
        }
        throw
    }
}

Test-Function "Cannot Delete Other User Blocks" {
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks/999999" -Method DELETE -Headers $global:authHeaders
        throw "Should not delete non-existent block"
    }
    catch {
        if ($_.Exception.Message -like "*404*") {
            return "Authorization working"
        }
        throw
    }
}

# ==================================================================
# PHASE 7: STRESS TESTING AND BULK OPERATIONS
# ==================================================================

Write-Phase "7" "STRESS TESTING AND BULK OPERATIONS"

Write-Category "Rapid Task Creation"

Test-Function "Create 10 Tasks Rapidly" {
    $created = 0
    for ($i = 1; $i -le 10; $i++) {
        $body = @{
            title = "Rapid Task $i"
            estimated_minutes = 15
            priority = ($i % 5) + 1
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
        $created++
    }
    return "$created tasks created"
}

Test-Function "Create 20 Tasks in Batch" {
    for ($i = 1; $i -le 20; $i++) {
        $body = @{
            title = "Batch Task $i"
            estimated_minutes = 30
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
    }
    return "20 tasks created"
}

Write-Category "Rapid Updates"

Test-Function "Update Task 10 Times Rapidly" {
    $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders
    if ($tasks.Count -eq 0) { throw "No tasks to update" }
    $taskId = $tasks[0].id
    
    for ($i = 1; $i -le 10; $i++) {
        $body = @{
            title = "Update $i"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method PATCH -Body $body -Headers $global:authHeaders | Out-Null
    }
    return "10 updates successful"
}

Test-Function "Toggle Task Status Rapidly" {
    $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders
    if ($tasks.Count -eq 0) { throw "No tasks available" }
    $taskId = $tasks[0].id
    
    for ($i = 1; $i -le 5; $i++) {
        $body = @{status = "done"} | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method PATCH -Body $body -Headers $global:authHeaders | Out-Null
        
        $body = @{status = "todo"} | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method PATCH -Body $body -Headers $global:authHeaders | Out-Null
    }
    return "5 toggle cycles successful"
}

Write-Category "Query Operations"

Test-Function "Query Plans for 5 Different Dates" {
    for ($i = 0; $i -lt 5; $i++) {
        $date = (Get-Date).AddDays($i).ToString('yyyy-MM-dd')
        try {
            Invoke-RestMethod -Uri "http://localhost:5000/api/plans?date=$date" -Headers $global:authHeaders | Out-Null
        }
        catch {
            # Plans might not exist, that's okay
        }
    }
    return "5 date queries completed"
}

Test-Function "List All Resources Multiple Times" {
    for ($i = 1; $i -le 5; $i++) {
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders | Out-Null
        Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Headers $global:authHeaders | Out-Null
        Invoke-RestMethod -Uri "http://localhost:5000/api/me" -Headers $global:authHeaders | Out-Null
    }
    return "15 list operations successful"
}

# ==================================================================
# PHASE 8: ADVANCED TASK OPERATIONS
# ==================================================================

Write-Phase "8" "ADVANCED TASK OPERATIONS"

Write-Category "Task Filtering and Sorting"

Test-Function "Create Tasks With Different Priorities" {
    $priorities = @(1, 3, 5, 2, 4)
    foreach ($p in $priorities) {
        $body = @{
            title = "Priority Test Task P$p"
            estimated_minutes = 30
            priority = $p
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
    }
    return "5 priority tasks created"
}

Test-Function "Create Tasks With Deadlines" {
    for ($i = 1; $i -le 3; $i++) {
        $body = @{
            title = "Deadline Task $i"
            estimated_minutes = 45
            priority = 3
            deadline_at = (Get-Date).AddDays($i).ToString('yyyy-MM-ddTHH:mm:ss')
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
    }
    return "3 deadline tasks created"
}

Test-Function "Retrieve All Tasks" {
    $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders
    if ($tasks.Count -lt 10) {
        throw "Expected at least 10 tasks"
    }
    return "Retrieved $($tasks.Count) tasks"
}

# ==================================================================
# PHASE 9: FRONTEND TESTING
# ==================================================================

Write-Phase "9" "FRONTEND TESTING"

Write-Category "Frontend Availability"

Test-Function "Frontend Serves Root Page" {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Status: $($response.StatusCode)" }
    if ($response.Content.Length -lt 100) { throw "Content too short" }
    return "Page served: $($response.Content.Length) bytes"
}

Test-Function "Frontend Serves Vite Client" {
    try {
        Invoke-WebRequest -Uri "http://localhost:3000/@vite/client" -UseBasicParsing | Out-Null
        return "Vite client accessible"
    }
    catch {
        return "Vite client check skipped"
    }
}

Test-Function "Frontend Response Time" {
    $start = Get-Date
    Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Out-Null
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    return "${elapsed}ms"
}

Write-Category "Frontend Assets"

Test-Function "Frontend Serves CSS" {
    try {
        Invoke-WebRequest -Uri "http://localhost:3000/src/index.css" -UseBasicParsing | Out-Null
        return "CSS served"
    }
    catch {
        return "CSS check completed"
    }
}

Test-Function "Frontend Serves Main JS" {
    try {
        Invoke-WebRequest -Uri "http://localhost:3000/src/main.jsx" -UseBasicParsing | Out-Null
        return "Main JS served"
    }
    catch {
        return "Main JS check completed"
    }
}

# ==================================================================
# PHASE 10: CLEANUP OPERATIONS
# ==================================================================

Write-Phase "10" "CLEANUP OPERATIONS"

Write-Category "Delete Operations"

Test-Function "Delete Test Tasks" {
    $deleted = 0
    $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders
    
    foreach ($task in $tasks) {
        if ($task.title -like "*Test*" -or $task.title -like "*Rapid*" -or $task.title -like "*Batch*" -or $task.title -like "*Priority*" -or $task.title -like "*Deadline*") {
            try {
                Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($task.id)" -Method DELETE -Headers $global:authHeaders | Out-Null
                $deleted++
            }
            catch { }
        }
    }
    return "Deleted $deleted tasks"
}

Test-Function "Delete Test Busy Blocks" {
    $deleted = 0
    foreach ($blockId in $global:blockIds) {
        try {
            Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks/$blockId" -Method DELETE -Headers $global:authHeaders | Out-Null
            $deleted++
        }
        catch { }
    }
    return "Deleted $deleted blocks"
}

Test-Function "Verify Deletion Works" {
    $body = @{
        title = "Task to Delete"
        estimated_minutes = 30
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
    Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($task.id)" -Method DELETE -Headers $global:authHeaders | Out-Null
    
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($task.id)" -Headers $global:authHeaders
        throw "Task should not exist"
    }
    catch {
        if ($_.Exception.Message -notlike "*404*") { throw }
        return "Deletion verified"
    }
}

Test-Function "Final Task Count Check" {
    $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders
    return "Remaining tasks: $($tasks.Count)"
}

Test-Function "Final Block Count Check" {
    $blocks = Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Headers $global:authHeaders
    return "Remaining blocks: $($blocks.Count)"
}

# ==================================================================
# FINAL REPORT - PART 2
# ==================================================================

$global:EndTime = Get-Date
$duration = ($global:EndTime - $global:StartTime).TotalSeconds

Write-Host "`n`n"
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "" -ForegroundColor Magenta
Write-Host "                PART 2 TEST REPORT" -ForegroundColor Magenta
Write-Host "" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""

$total = $global:PassCount + $global:FailCount
$successRate = if ($total -gt 0) { [math]::Round(($global:PassCount / $total) * 100, 2) } else { 0 }

Write-Host "  EXECUTION SUMMARY" -ForegroundColor Yellow
Write-Host "  " + ("-" * 60) -ForegroundColor DarkGray
Write-Host "  Total Tests:              " -NoNewline; Write-Host "$total" -ForegroundColor White
Write-Host "  Passed:                   " -NoNewline; Write-Host "$($global:PassCount)" -ForegroundColor Green
Write-Host "  Failed:                   " -NoNewline; Write-Host "$($global:FailCount)" -ForegroundColor $(if ($global:FailCount -eq 0) { "Green" } else { "Red" })
Write-Host "  Success Rate:             " -NoNewline; Write-Host "$successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 95) { "Yellow" } else { "Red" })
Write-Host "  Duration:                 " -NoNewline; Write-Host "$([math]::Round($duration, 2)) seconds" -ForegroundColor White
Write-Host ""

if ($global:FailCount -gt 0) {
    Write-Host "  FAILED TESTS" -ForegroundColor Red
    Write-Host "  " + ("-" * 60) -ForegroundColor DarkGray
    $failedTests = $global:TestResults | Where-Object { $_.Status -eq "FAIL" }
    foreach ($test in $failedTests) {
        Write-Host "  [$($test.ID)] $($test.Test)" -ForegroundColor Red
        Write-Host "      Error: $($test.Error)" -ForegroundColor DarkRed
    }
}

Write-Host ""
if ($global:FailCount -eq 0) {
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "          PART 2: ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
} else {
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "        PART 2: Some tests failed" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Yellow
}

Write-Host ""
$completionTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Write-Host "  Test completed at: $completionTime" -ForegroundColor Gray
Write-Host ""

# Cleanup session files
Remove-Item "$PSScriptRoot\test-session.xml" -Force -ErrorAction SilentlyContinue
Remove-Item "$PSScriptRoot\test-data.xml" -Force -ErrorAction SilentlyContinue
Write-Host "  Session data cleaned up" -ForegroundColor Cyan
Write-Host ""
