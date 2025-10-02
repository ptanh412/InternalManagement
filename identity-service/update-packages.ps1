# PowerShell script to update package declarations
Get-ChildItem -Path "D:\InternalManagement\identity-service\src\main\java\com\mnp" -Recurse -Filter "*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'package com\.devteria', 'package com.mnp'
    $content = $content -replace 'import com\.devteria', 'import com.mnp'
    Set-Content -Path $_.FullName -Value $content -NoNewline
    Write-Host "Updated: $($_.FullName)"
}

# Update test files
Get-ChildItem -Path "D:\InternalManagement\identity-service\src\test\java\com\mnp" -Recurse -Filter "*.java" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'package com\.devteria', 'package com.mnp'
    $content = $content -replace 'import com\.devteria', 'import com.mnp'
    Set-Content -Path $_.FullName -Value $content -NoNewline
    Write-Host "Updated: $($_.FullName)"
}

Write-Host "Package update completed!"
