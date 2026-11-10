$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $PSScriptRoot).Path.TrimEnd('\')
$name = Split-Path -Leaf $root
$zipPath = Join-Path (Split-Path -Parent $root) "$name.zip"
$relativeFiles = @(
    '.gitignore', 'README.md', 'pack.ps1',
    'backend/.env.example', 'backend/requirements.txt', 'backend/requests.http',
    'frontend/.env.example', 'frontend/index.html', 'frontend/package.json',
    'frontend/pnpm-lock.yaml', 'frontend/tsconfig.json', 'frontend/vite.config.ts'
)
$sourceDirectories = @('backend/app', 'backend/tests', 'frontend/src', 'frontend/public')
$files = @()
foreach ($relative in $relativeFiles) {
    $files += Get-Item -LiteralPath (Join-Path $root $relative)
}
foreach ($relative in $sourceDirectories) {
    $files += Get-ChildItem -LiteralPath (Join-Path $root $relative) -Recurse -File |
        Where-Object { $_.FullName -notmatch '[\\/]__pycache__[\\/]' -and $_.Extension -ne '.pyc' }
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}
$archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
        $entry = "$name/$relative"
        [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, $file.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal
        )
    }
}
finally {
    $archive.Dispose()
}
Write-Output "$zipPath ($($files.Count) archivos)"
