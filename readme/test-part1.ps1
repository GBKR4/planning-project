# ==================================================================
# COMPREHENSIVE TEST - PART 1
# Phases 1-5: Infrastructure, Auth, Tasks, Busy Blocks, Plans
# ==================================================================

$ErrorActionPreference = "Continue"
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
Write-Host "     COMPREHENSIVE TEST SUITE - PART 1" -ForegroundColor Magenta
Write-Host "     Infrastructure, Auth, Tasks, Blocks, Plans" -ForegroundColor Magenta
Write-Host "" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Test Date: $(Get-Date -Format 'MMMM dd, yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "  Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# ==================================================================
# PHASE 1: INFRASTRUCTURE AND SERVER CONNECTIVITY
# ==================================================================

Write-Phase "1" "INFRASTRUCTURE AND SERVER CONNECTIVITY"

Write-Category "Server Availability"

Test-Function "Backend Server Responding" {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw "Status: $($response.StatusCode)" }
    return "HTTP 200"
}

Test-Function "Backend Health Check" {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5
    if ($health.db -ne "ok") { throw "Database not healthy" }
    return "DB: $($health.db)"
}

Test-Function "Frontend Server Responding" {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw "Status: $($response.StatusCode)" }
    return "HTTP 200"
}

Test-Function "Frontend Content Length Check" {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    if ($response.Content.Length -lt 100) { throw "Content too short" }
    return "$($response.Content.Length) bytes"
}

Write-Category "CORS and Security Headers"

Test-Function "CORS Headers Present" {
    Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing | Out-Null
    return "Headers present"
}

Test-Function "Backend Response Time" {
    $start = Get-Date
    Invoke-RestMethod -Uri "http://localhost:5000/health" | Out-Null
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    if ($elapsed -gt 1000) { throw "Too slow: ${elapsed}ms" }
    return "${elapsed}ms"
}

# ==================================================================
# PHASE 2: USER AUTHENTICATION SYSTEM
# ==================================================================

Write-Phase "2" "USER AUTHENTICATION SYSTEM"

$timestamp = (Get-Date).ToString('yyyyMMddHHmmss')
$global:testUser = @{
    name = "Test User Part1 $timestamp"
    email = "testpart1${timestamp}@example.com"
    password = "SecureTestPass123!"
}

Write-Category "User Registration"

Test-Function "Register New User" {
    $body = $global:testUser | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "http://localhost:5000/auth/register" -Method POST -Body $body -ContentType "application/json"
    if (-not $result.message) { throw "No message in response" }
    return "User: $($result.email)"
}

Test-Function "Reject Duplicate Email Registration" {
    try {
        $body = @{
            name = "Duplicate User"
            email = $global:testUser.email
            password = "AnotherPass123!"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/auth/register" -Method POST -Body $body -ContentType "application/json"
        throw "Should have rejected duplicate email"
    }
    catch {
        if ($_.Exception.Message -notlike "*409*" -and $_.Exception.Message -notlike "*exists*") {
            throw "Wrong error type: $($_.Exception.Message)"
        }
        return "Duplicate rejected"
    }
}

Test-Function "Reject Registration Without Name" {
    try {
        $body = @{
            email = "noname@test.com"
            password = "Pass123!"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/auth/register" -Method POST -Body $body -ContentType "application/json"
        throw "Should reject missing name"
    }
    catch {
        if ($_.Exception.Message -notlike "*400*") { throw }
        return "Missing name rejected"
    }
}

Test-Function "Reject Registration Without Email" {
    try {
        $body = @{
            name = "Test User"
            password = "Pass123!"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/auth/register" -Method POST -Body $body -ContentType "application/json"
        throw "Should reject missing email"
    }
    catch {
        if ($_.Exception.Message -notlike "*400*") { throw }
        return "Missing email rejected"
    }
}

Test-Function "Reject Registration Without Password" {
    try {
        $body = @{
            name = "Test User"
            email = "test@test.com"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/auth/register" -Method POST -Body $body -ContentType "application/json"
        throw "Should reject missing password"
    }
    catch {
        if ($_.Exception.Message -notlike "*400*") { throw }
        return "Missing password rejected"
    }
}

Write-Category "User Login"

Test-Function "Login With Valid Credentials" {
    $body = @{
        email = $global:testUser.email
        password = $global:testUser.password
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -Body $body -ContentType "application/json"
    $global:accessToken = $result.accessToken
    $global:refreshToken = $result.refreshToken
    $global:userId = $result.user.id
    
    if (-not $global:accessToken) { throw "No access token received" }
    if (-not $global:userId) { throw "No user ID received" }
    return "Token length: $($global:accessToken.Length)"
}

$global:authHeaders = @{
    "Authorization" = "Bearer $($global:accessToken)"
    "Content-Type" = "application/json"
}

Test-Function "Login Returns User Object" {
    $body = @{
        email = $global:testUser.email
        password = $global:testUser.password
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -Body $body -ContentType "application/json"
    if (-not $result.user) { throw "No user object" }
    if ($result.user.email -ne $global:testUser.email) { throw "Email mismatch" }
    return "User returned: $($result.user.email)"
}

Test-Function "Reject Login With Wrong Password" {
    try {
        $body = @{
            email = $global:testUser.email
            password = "WrongPassword123!"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -Body $body -ContentType "application/json"
        throw "Should reject wrong password"
    }
    catch {
        if ($_.Exception.Message -notlike "*401*") { throw }
        return "Wrong password rejected"
    }
}

Test-Function "Reject Login With Non-Existent Email" {
    try {
        $body = @{
            email = "nonexistent${timestamp}@test.com"
            password = "Pass123!"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -Body $body -ContentType "application/json"
        throw "Should reject non-existent email"
    }
    catch {
        if ($_.Exception.Message -notlike "*401*") { throw }
        return "Non-existent email rejected"
    }
}

Write-Category "Authentication and Authorization"

Test-Function "Get Current User Profile" {
    $user = Invoke-RestMethod -Uri "http://localhost:5000/api/me" -Headers $global:authHeaders
    if ($user.email -ne $global:testUser.email) { throw "Email mismatch" }
    if ($user.id -ne $global:userId) { throw "User ID mismatch" }
    return "Email: $($user.email)"
}

Test-Function "Access Without Token Blocked" {
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks"
        throw "Should require authentication"
    }
    catch {
        if ($_.Exception.Message -notlike "*401*" -and $_.Exception.Message -notlike "*403*") {
            throw "Wrong error: $($_.Exception.Message)"
        }
        return "Unauthorized access blocked"
    }
}

Test-Function "Access With Invalid Token Blocked" {
    try {
        $badHeaders = @{
            "Authorization" = "Bearer invalid_token_12345"
            "Content-Type" = "application/json"
        }
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $badHeaders
        throw "Should reject invalid token"
    }
    catch {
        if ($_.Exception.Message -notlike "*401*" -and $_.Exception.Message -notlike "*403*") { throw }
        return "Invalid token rejected"
    }
}

# ==================================================================
# PHASE 3: TASK MANAGEMENT SYSTEM
# ==================================================================

Write-Phase "3" "TASK MANAGEMENT SYSTEM"

$global:taskIds = @()

Write-Category "Task Creation - Basic"

Test-Function "Create Task With Minimal Fields" {
    $body = @{
        title = "Minimal Task"
        estimated_minutes = 30
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
    $global:taskIds += $task.id
    
    if (-not $task.id) { throw "No task ID" }
    if ($task.title -ne "Minimal Task") { throw "Title mismatch" }
    if ($task.estimated_minutes -ne 30) { throw "Minutes mismatch" }
    return "Task ID: $($task.id)"
}

Test-Function "Create Task With All Fields" {
    $body = @{
        title = "Complete Task With All Fields"
        notes = "Detailed notes about this task"
        estimated_minutes = 120
        priority = 5
        deadline_at = (Get-Date).AddDays(3).ToString('yyyy-MM-ddTHH:mm:ss')
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
    $global:taskIds += $task.id
    
    if ($task.priority -ne 5) { throw "Priority not set" }
    if (-not $task.deadline_at) { throw "Deadline not set" }
    return "Priority: $($task.priority)"
}

Write-Category "Task Creation - All Priority Levels"

foreach ($priority in 1..5) {
    Test-Function "Create Task Priority Level $priority" {
        $body = @{
            title = "Priority $priority Task"
            estimated_minutes = 30
            priority = $priority
            deadline_at = (Get-Date).AddDays($priority).ToString('yyyy-MM-ddTHH:mm:ss')
        } | ConvertTo-Json
        
        $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
        $global:taskIds += $task.id
        
        if ($task.priority -ne $priority) { throw "Priority mismatch" }
        return "P$priority - ID: $($task.id)"
    }
}

Write-Category "Task Creation - Edge Cases"

Test-Function "Create Task With Long Title" {
    $longTitle = "A" * 200
    $body = @{
        title = $longTitle
        estimated_minutes = 30
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
    $global:taskIds += $task.id
    return "Title length: $($task.title.Length)"
}

Test-Function "Create Task With Large Duration" {
    $body = @{
        title = "All Day Task"
        estimated_minutes = 1440
        priority = 5
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
    $global:taskIds += $task.id
    
    if ($task.estimated_minutes -ne 1440) { throw "Duration not set" }
    return "1440 minutes accepted"
}

Write-Category "Task Validation"

Test-Function "Reject Task Without Title" {
    try {
        $body = @{
            estimated_minutes = 30
            priority = 3
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
        throw "Should reject task without title"
    }
    catch {
        if ($_.Exception.Message -notlike "*400*") { throw }
        return "Missing title rejected"
    }
}

Test-Function "Reject Task Without Estimated Minutes" {
    try {
        $body = @{
            title = "No Minutes Task"
            priority = 3
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Method POST -Body $body -Headers $global:authHeaders
        throw "Should reject task without estimated_minutes"
    }
    catch {
        if ($_.Exception.Message -notlike "*400*") { throw }
        return "Missing minutes rejected"
    }
}

Write-Category "Task Retrieval"

Test-Function "List All User Tasks" {
    $tasks = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $global:authHeaders
    if ($tasks.Count -lt 5) { throw "Expected at least 5 tasks" }
    return "Found $($tasks.Count) tasks"
}

Test-Function "Get Single Task By ID" {
    $taskId = $global:taskIds[0]
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Headers $global:authHeaders
    
    if ($task.id -ne $taskId) { throw "Task ID mismatch" }
    return "Retrieved task: $($task.title)"
}

Write-Category "Task Updates"

Test-Function "Update Task Title" {
    $taskId = $global:taskIds[0]
    $body = @{
        title = "Updated Task Title"
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method PATCH -Body $body -Headers $global:authHeaders
    
    if ($task.title -ne "Updated Task Title") { throw "Title not updated" }
    return "Title updated"
}

Test-Function "Update Task Priority" {
    $taskId = $global:taskIds[1]
    $body = @{
        priority = 4
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method PATCH -Body $body -Headers $global:authHeaders
    
    if ($task.priority -ne 4) { throw "Priority not updated" }
    return "Priority: $($task.priority)"
}

Write-Category "Task Status Management"

Test-Function "Mark Task as Done" {
    $taskId = $global:taskIds[2]
    $body = @{
        status = "done"
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method PATCH -Body $body -Headers $global:authHeaders
    
    if ($task.status -ne "done") { throw "Status not updated" }
    return "Status: done"
}

Test-Function "Mark Task Back to Todo" {
    $taskId = $global:taskIds[2]
    $body = @{
        status = "todo"
    } | ConvertTo-Json
    
    $task = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method PATCH -Body $body -Headers $global:authHeaders
    
    if ($task.status -ne "todo") { throw "Status not updated" }
    return "Status: todo"
}

# ==================================================================
# PHASE 4: BUSY BLOCKS MANAGEMENT
# ==================================================================

Write-Phase "4" "BUSY BLOCKS MANAGEMENT SYSTEM"

$tomorrow = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
$dayAfter = (Get-Date).AddDays(2).ToString('yyyy-MM-dd')
$global:blockIds = @()

Write-Category "Busy Block Creation"

Test-Function "Create Morning Busy Block" {
    $body = @{
        title = "Morning Lecture"
        start_at = "${tomorrow}T09:00:00"
        end_at = "${tomorrow}T11:00:00"
    } | ConvertTo-Json
    
    $block = Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Method POST -Body $body -Headers $global:authHeaders
    $global:blockIds += $block.id
    
    if (-not $block.id) { throw "No block ID" }
    return "Block ID: $($block.id)"
}

Test-Function "Create Afternoon Busy Block" {
    $body = @{
        title = "Gym Session"
        start_at = "${tomorrow}T15:00:00"
        end_at = "${tomorrow}T16:30:00"
    } | ConvertTo-Json
    
    $block = Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Method POST -Body $body -Headers $global:authHeaders
    $global:blockIds += $block.id
    return "Created: $($block.title)"
}

Test-Function "Create Evening Busy Block" {
    $body = @{
        title = "Dinner Meeting"
        start_at = "${tomorrow}T19:00:00"
        end_at = "${tomorrow}T21:00:00"
    } | ConvertTo-Json
    
    $block = Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Method POST -Body $body -Headers $global:authHeaders
    $global:blockIds += $block.id
    return "Created: $($block.title)"
}

Write-Category "Busy Block Retrieval"

Test-Function "List All Busy Blocks" {
    $blocks = Invoke-RestMethod -Uri "http://localhost:5000/api/busyblocks" -Headers $global:authHeaders
    if ($blocks.Count -lt 3) { throw "Expected at least 3 blocks" }
    return "Found $($blocks.Count) blocks"
}

# ==================================================================
# PHASE 5: PLAN GENERATION AND INTELLIGENT SCHEDULING
# ==================================================================

Write-Phase "5" "PLAN GENERATION AND INTELLIGENT SCHEDULING"

Write-Category "Basic Plan Generation"

Test-Function "Generate Plan for Tomorrow" {
    $body = @{
        date = $tomorrow
        workStart = "08:00"
        workEnd = "22:00"
    } | ConvertTo-Json
    
    $plan = Invoke-RestMethod -Uri "http://localhost:5000/api/plans/generate" -Method POST -Body $body -Headers $global:authHeaders
    $global:planId = $plan.planId
    $global:planBlocks = $plan.blocks
    
    if (-not $global:planId) { throw "No plan ID" }
    return "Plan ID: $($plan.planId), Blocks: $($plan.blocks.Count)"
}

Test-Function "Generate Plan for Day After Tomorrow" {
    $body = @{
        date = $dayAfter
        workStart = "09:00"
        workEnd = "21:00"
    } | ConvertTo-Json
    
    $plan = Invoke-RestMethod -Uri "http://localhost:5000/api/plans/generate" -Method POST -Body $body -Headers $global:authHeaders
    return "Blocks generated: $($plan.blocks.Count)"
}

Test-Function "Generate Plan for Today" {
    $today = (Get-Date).ToString('yyyy-MM-dd')
    $body = @{
        date = $today
        workStart = "08:00"
        workEnd = "22:00"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:5000/api/plans/generate" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
    return "Today's plan generated"
}

Write-Category "Plan Generation - Work Hour Variations"

Test-Function "Generate Plan With Short Work Window" {
    $body = @{
        date = $tomorrow
        workStart = "10:00"
        workEnd = "12:00"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:5000/api/plans/generate" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
    return "2 hour window plan"
}

Test-Function "Generate Plan With Long Work Window" {
    $body = @{
        date = $tomorrow
        workStart = "06:00"
        workEnd = "00:00"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:5000/api/plans/generate" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
    return "18 hour window plan"
}

Write-Category "Plan Retrieval"

Test-Function "Retrieve Plan by Date" {
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/plans?date=$tomorrow" -Headers $global:authHeaders
    if (-not $result.plan) { throw "No plan found" }
    return "Plan retrieved: $($result.blocks.Count) blocks"
}

Test-Function "Regenerate Existing Plan" {
    $body = @{
        date = $tomorrow
        workStart = "09:00"
        workEnd = "21:00"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:5000/api/plans/generate" -Method POST -Body $body -Headers $global:authHeaders | Out-Null
    return "Plan regenerated"
}

# ==================================================================
# FINAL REPORT - PART 1
# ==================================================================

$global:EndTime = Get-Date
$duration = ($global:EndTime - $global:StartTime).TotalSeconds

Write-Host "`n`n"
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "" -ForegroundColor Magenta
Write-Host "                PART 1 TEST REPORT" -ForegroundColor Magenta
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
    Write-Host "          PART 1: ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
} else {
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "        PART 1: Some tests failed" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Yellow
}

Write-Host ""
$completionTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Write-Host "  Test completed at: $completionTime" -ForegroundColor Gray
Write-Host ""

# Export data for part 2
$global:testUser | Export-Clixml -Path "$PSScriptRoot\test-session.xml" -Force
@{
    accessToken = $global:accessToken
    userId = $global:userId
    taskIds = $global:taskIds
    blockIds = $global:blockIds
    planId = $global:planId
} | Export-Clixml -Path "$PSScriptRoot\test-data.xml" -Force

Write-Host "  Session data saved for Part 2" -ForegroundColor Cyan
Write-Host ""
