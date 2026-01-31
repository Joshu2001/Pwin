$file = "c:\Users\user\Downloads\Regaarder-4.0-main\Regaarder-4.0-main\src\creatordashboard.jsx"
$content = Get-Content $file -Raw
$newContent = $content -replace 'font-black', 'font-normal'
Set-Content $file $newContent -NoNewline
Write-Host "Replaced all font-black with font-normal"
