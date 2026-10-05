$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$atlasEsbuild = Join-Path (Get-Location) 'node_modules/.pnpm/@esbuild+win32-x64@0.28.2/node_modules/@esbuild/win32-x64/esbuild.exe'
if (-not (Test-Path -LiteralPath $atlasEsbuild)) {
    $atlasEsbuild = Join-Path (Get-Location) 'node_modules/@esbuild/win32-x64/esbuild.exe'
}
if (-not (Test-Path -LiteralPath $atlasEsbuild)) { throw 'Install the pinned dependencies first.' }
& node node_modules/typescript/bin/tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed.' }
New-Item -ItemType Directory -Force -Path .test-build | Out-Null
foreach ($atlasTest in (Get-ChildItem -LiteralPath tests -Filter '*.test.ts')) {
    $atlasOutput = '.test-build/' + $atlasTest.BaseName + '.mjs'
    & $atlasEsbuild $atlasTest.FullName --bundle --platform=node --format=esm "--outfile=$atlasOutput" --packages=external --jsx=automatic --alias:@=./src
    if ($LASTEXITCODE -ne 0) { throw "Test bundling failed: $($atlasTest.Name)" }
    & node $atlasOutput
    if ($LASTEXITCODE -ne 0) { throw "Test failed: $($atlasTest.Name)" }
}
& $atlasEsbuild src/main.tsx --bundle --minify --format=iife --platform=browser --target=chrome110,edge110,firefox115,safari17 --jsx=automatic --alias:@=./src --legal-comments=eof --outfile=.test-build/atlas-app.js
if ($LASTEXITCODE -ne 0) { throw 'Production bundling failed.' }
& node scripts/build.mjs --bundled-js .test-build/atlas-app.js
if ($LASTEXITCODE -ne 0) { throw 'Standalone packaging failed.' }
Copy-Item -LiteralPath dist/atlas-study-world.html -Destination atlas-study-world.html
Get-FileHash -LiteralPath dist/atlas-study-world.html -Algorithm SHA256
