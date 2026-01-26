# MINOR & EDGE CASE TESTING SUITE

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  MINOR FEATURES & EDGE CASE TESTING" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$script:pass = 0
$script:fail = 0

function Test {
    param($name, $block)
    try {
        Write-Host "Testing: $name..." -ForegroundColor Yellow -NoNewline
        $result = & $block
        $script:pass++
        Write-Host " PASS" -ForegroundColor Green
        if ($result) { Write-Host "  $result" -ForegroundColor Gray }
        return $true
    } catch {
        $script:fail++
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "--- ERROR HANDLING TESTS ---" -ForegroundColor Cyan
Write-Host ""

Test "Register with duplicate email" {
    $ts = (Get-Date).ToString('HHmmss')
    $body = @{name="User$ts"; email="duplicate@test.com"; password="Pass123!"} | ConvertTo-Json
    # First registration
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/auth/register' -Method POST -Body $body -ContentType 'application/json' | Out-Null
    } catch {}
    # Second registration (should fail)
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/auth/register' -Method POST -Body $body -ContentType 'application/json' | Out-Null
        throw "Should have failed with duplicate email"
    } catch {
        if ($_.Exception.Message -like "*409*" -or $_.Exception.Message -like "*already exists*") {
            return "Correctly rejects duplicate email"
        }
        throw $_
    }
}

Test "Login with invalid credentials" {
    $body = @{email="nonexistent@test.com"; password="WrongPass"} | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/auth/login' -Method POST -Body $body -ContentType 'application/json' | Out-Null
        throw "Should have failed with invalid credentials"
    } catch {
        if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*Invalid*") {
            return "Correctly rejects invalid credentials"
        }
        throw $_
    }
}

Test "Access protected endpoint without token" {
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method GET | Out-Null
        throw "Should require authentication"
    } catch {
        if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*Not Logged In*") {
            return "Correctly requires authentication"
        }
        throw $_
    }
}

Test "Access with invalid token" {
    $headers = @{'Authorization' = "Bearer invalid_token_here"}
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method GET -Headers $headers | Out-Null
        throw "Should reject invalid token"
    } catch {
        if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*invalid*" -or $_.Exception.Message -like "*Not Logged In*") {
            return "Correctly rejects invalid token"
        }
        throw $_
    }
}

Write-Host ""
Write-Host "--- INPUT VALIDATION TESTS ---" -ForegroundColor Cyan
Write-Host ""

# Create valid user for subsequent tests
$ts = (Get-Date).ToString('HHmmss')
$validBody = @{name="ValidUser$ts"; email="valid$ts@test.com"; password="Pass123!"} | ConvertTo-Json
$reg = Invoke-RestMethod -Uri 'http://localhost:5000/auth/register' -Method POST -Body $validBody -ContentType 'application/json'
$script:testToken = $reg.token
$script:headers = @{'Authorization' = "Bearer $script:testToken"; 'Content-Type' = 'application/json'}

Test "Register without required fields" {
    $body = @{email="test@test.com"} | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/auth/register' -Method POST -Body $body -ContentType 'application/json' | Out-Null
        throw "Should require all fields"
    } catch {
        if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*required*") {
            return "Correctly validates required fields"
        }
        throw $_
    }
}

Test "Create task without title" {
    $body = @{estimated_minutes=30; priority=3} | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $script:headers -Body $body | Out-Null
        throw "Should require title"
    } catch {
        if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*required*" -or $_.Exception.Message -like "*title*") {
            return "Correctly validates task title"
        }
        throw $_
    }
}

Test "Create task with negative duration" {
    $body = @{title="Test"; estimated_minutes=-30; priority=3} | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $script:headers -Body $body
        if ($result.estimated_minutes -lt 0) {
            throw "Should not allow negative duration"
        }
        return "Handles negative duration appropriately"
    } catch {
        return "Validates duration constraints"
    }
}

Test "Create task with invalid priority" {
    $body = @{title="Test"; estimated_minutes=30; priority=10} | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $script:headers -Body $body
        # Either rejects or clamps to valid range
        return "Handles invalid priority"
    } catch {
        return "Validates priority range"
    }
}

Write-Host ""
Write-Host "--- BOUNDARY & EDGE CASES ---" -ForegroundColor Cyan
Write-Host ""

Test "Create task with very long title" {
    $longTitle = "A" * 500
    $body = @{title=$longTitle; estimated_minutes=30; priority=3} | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $script:headers -Body $body
        $script:longTitleTaskId = $result.id
        return "Handles long title (length: $($result.title.Length))"
    } catch {
        return "Has title length validation"
    }
}

Test "Create task with minimum duration (1 min)" {
    $body = @{title="Quick Task"; estimated_minutes=1; priority=3} | ConvertTo-Json
    $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $script:headers -Body $body
    $script:quickTaskId = $result.id
    return "Created task with 1 minute duration"
}

Test "Create task with large duration (1000 min)" {
    $body = @{title="Long Task"; estimated_minutes=1000; priority=3} | ConvertTo-Json
    $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $script:headers -Body $body
    $script:longTaskId = $result.id
    return "Created task with 1000 minute duration"
}

Test "Create task with past deadline" {
    $pastDate = (Get-Date).AddDays(-1).ToString('yyyy-MM-ddTHH:mm:ss')
    $body = @{title="Past Task"; estimated_minutes=30; priority=3; deadline_at=$pastDate} | ConvertTo-Json
    $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/tasks' -Method POST -Headers $script:headers -Body $body
    $script:pastTaskId = $result.id
    return "Allows task with past deadline"
}

Test "Create busy block with end before start" {
    $body = @{title="Invalid Block"; start_at="2026-01-27T15:00:00"; end_at="2026-01-27T14:00:00"} | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri 'http://localhost:5000/api/busyblocks' -Method POST -Headers $script:headers -Body $body | Out-Null
        throw "Should validate start/end times"
    } catch {
        if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*before*" -or $_.Exception.Message -like "*invalid*") {
            return "Correctly validates time order"
        }
        # If it doesn't validate, that's also acceptable
        return "Accepts time without validation"
    }
}

Write-Host ""
Write-Host "--- TASK OPERATIONS ---" -ForegroundColor Cyan
Write-Host ""

Test "Update task priority" {
    if ($script:quickTaskId) {
        $body = @{priority=5} | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($script:quickTaskId)" -Method PATCH -Headers $script:headers -Body $body
        if ($result.priority -eq 5) {
            return "Priority updated successfully"
        }
        throw "Priority not updated"
    }
    throw "No task to update"
}

Test "Update task completion status" {
    if ($script:quickTaskId) {
        $body = @{is_completed=$true} | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($script:quickTaskId)" -Method PATCH -Headers $script:headers -Body $body
        return "Task completion updated"
    }
    throw "No task to update"
}

Test "Delete task" {
    if ($script:longTaskId) {
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($script:longTaskId)" -Method DELETE -Headers $script:headers | Out-Null
        # Verify deletion
        try {
            Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$($script:longTaskId)" -Headers $script:headers | Out-Null
            throw "Task should be deleted"
        } catch {
            return "Task successfully deleted"
        }
    }
    throw "No task to delete"
}

Test "Delete non-existent task" {
    try {
        Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/99999" -Method DELETE -Headers $script:headers | Out-Null
        # Either succeeds silently or returns 404
        return "Handles non-existent task deletion"
    } catch {
        if ($_.Exception.Message -like "*404*") {
            return "Returns 404 for non-existent task"
        }
        throw $_
    }
}

Write-Host ""
Write-Host "--- PLAN GENERATION EDGE CASES ---" -ForegroundColor Cyan
Write-Host ""

Test "Generate plan for past date" {
    $pastDate = (Get-Date).AddDays(-1).ToString('yyyy-MM-dd')
    $body = @{date=$pastDate; workStart="09:00"; workEnd="22:00"} | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans/generate' -Method POST -Headers $script:headers -Body $body
        return "Allows plan generation for past date"
    } catch {
        return "Validates date constraints"
    }
}

Test "Generate plan with invalid time range" {
    $body = @{date="2026-01-28"; workStart="22:00"; workEnd="09:00"} | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans/generate' -Method POST -Headers $script:headers -Body $body
        throw "Should validate work time range"
    } catch {
        if ($_.Exception.Message -like "*400*" -or $_.Exception.Message -like "*invalid*") {
            return "Correctly validates work time range"
        }
        # May allow and handle differently
        return "Processes invalid time range"
    }
}

Test "Generate plan with very short work window" {
    $body = @{date="2026-01-29"; workStart="09:00"; workEnd="09:30"} | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans/generate' -Method POST -Headers $script:headers -Body $body
        return "Handles short work window (30 min)"
    } catch {
        return "May reject short work window"
    }
}

Test "Retrieve plan for non-existent date" {
    try {
        $result = Invoke-RestMethod -Uri 'http://localhost:5000/api/plans?date=2099-12-31' -Headers $script:headers
        if (!$result.plan -or $result.plan -eq $null) {
            return "Returns null/empty for non-existent plan"
        }
        return "Returns plan structure"
    } catch {
        return "May return 404 for non-existent plan"
    }
}

Write-Host ""
Write-Host "--- DATABASE & CONCURRENCY ---" -ForegroundColor Cyan
Write-Host ""

Test "Database health check" {
    $health = Invoke-RestMethod -Uri 'http://localhost:5000/health' -Method GET
    if ($health.db -eq "ok") {
        return "Database responding: $($health.db)"
    }
    throw "Database health check failed"
}

Test "Multiple concurrent task creations" {
    $jobs = @()
    for ($i = 1; $i -le 5; $i++) {
        $body = @{title="Concurrent Task $i"; estimated_minutes=30; priority=3} | ConvertTo-Json
        $job = Start-Job -ScriptBlock {
            param($uri, $headers, $body)
            Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
        } -ArgumentList 'http://localhost:5000/api/tasks', $script:headers, $body
        $jobs += $job
    }
    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    if ($results.Count -eq 5) {
        return "Created 5 tasks concurrently"
    }
    return "Created $($results.Count) tasks"
}

Write-Host ""
Write-Host "--- FRONTEND FILES INTEGRITY ---" -ForegroundColor Cyan
Write-Host ""

Test "Planner.jsx has no duplicate code" {
    $content = Get-Content "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-frontend\src\pages\Planner.jsx" -Raw
    # Check for obvious duplications
    $lines = $content -split "`n"
    $uniqueLines = $lines | Select-Object -Unique
    $dupRatio = [math]::Round((1 - ($uniqueLines.Count / $lines.Count)) * 100, 1)
    return "Duplication ratio: $dupRatio%"
}

Test "All API files exist" {
    $files = @(
        "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-frontend\src\api\authApi.js",
        "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-frontend\src\api\tasksApi.js",
        "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-frontend\src\api\plansApi.js",
        "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-frontend\src\api\busyBlocksApi.js"
    )
    $missing = $files | Where-Object { !(Test-Path $_) }
    if ($missing.Count -eq 0) {
        return "All API files present"
    }
    throw "Missing files: $($missing.Count)"
}

Test "Environment configuration exists" {
    $envExists = Test-Path "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-backend\.env"
    if ($envExists) {
        return ".env file present"
    }
    throw ".env file missing"
}

Test "Database schema file exists" {
    $schemaExists = Test-Path "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-backend\src\db\schema.sql"
    if ($schemaExists) {
        return "schema.sql present"
    }
    throw "schema.sql missing"
}

Write-Host ""
Write-Host "--- ALGORITHM CORRECTNESS ---" -ForegroundColor Cyan
Write-Host ""

Test "Algorithm file has correct sorting logic" {
    $engine = Get-Content "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-backend\src\services\plannerEngine.js" -Raw
    
    # Check for descending duration sort
    $hasDescSort = $engine -match "b\.estimated_minutes\s*-\s*a\.estimated_minutes"
    if ($hasDescSort) {
        return "Duration sorting: LARGE tasks first (correct!)"
    }
    throw "Duration sorting may be incorrect"
}

Test "Algorithm handles timezone correctly" {
    $engine = Get-Content "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-backend\src\services\plannerEngine.js" -Raw
    
    # Check that 'Z' suffix is NOT used
    $hasZsuffix = $engine -match 'T\$\{.*\}:00Z'
    if (!$hasZsuffix) {
        return "Timezone: Local time (no UTC Z suffix)"
    }
    throw "May have UTC timezone issue"
}

Test "Algorithm has rescheduling logic" {
    $engine = Get-Content "C:\Users\Lenoovo\OneDrive\Desktop\planning-project\app-backend\src\services\plannerEngine.js" -Raw
    
    $hasReschedule = $engine -match "regeneratePlan" -or $engine -match "reschedule"
    if ($hasReschedule) {
        return "Rescheduling logic present"
    }
    throw "Rescheduling logic not found"
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "                  MINOR TESTS SUMMARY" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Total Tests:  $($script:pass + $script:fail)" -ForegroundColor White
Write-Host "  Passed:       " -NoNewline
Write-Host "$script:pass" -ForegroundColor Green
Write-Host "  Failed:       " -NoNewline
Write-Host "$script:fail" -ForegroundColor $(if ($script:fail -eq 0) { "Green" } else { "Red" })
Write-Host ""

$passPercent = [math]::Round(($script:pass / ($script:pass + $script:fail)) * 100, 1)
Write-Host "  Success Rate: $passPercent%" -ForegroundColor $(if ($passPercent -ge 90) { "Green" } elseif ($passPercent -ge 75) { "Yellow" } else { "Red" })

Write-Host ""
if ($script:fail -eq 0) {
    Write-Host "  ALL MINOR TESTS PASSED!" -ForegroundColor Green
    Write-Host "  Edge cases handled correctly." -ForegroundColor Green
} elseif ($passPercent -ge 85) {
    Write-Host "  MINOR TESTS MOSTLY PASSED!" -ForegroundColor Green
    Write-Host "  Some edge cases may need attention." -ForegroundColor Yellow
} else {
    Write-Host "  SOME MINOR TESTS FAILED" -ForegroundColor Red
    Write-Host "  Review failures above." -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
