param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$npmPath = @(
  "C:\Program Files\nodejs\npm.cmd",
  "C:\Program Files (x86)\nodejs\npm.cmd",
  (Join-Path $env:APPDATA "npm\npm.cmd")
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $npmPath) {
  throw "Unable to find npm.cmd. Install Node.js or add npm to PATH."
}

$nodeBin = Split-Path -Parent $npmPath
if ($env:PATH -notlike "*$nodeBin*") {
  $env:PATH = "$nodeBin;$env:PATH"
}

& $npmPath @Args
exit $LASTEXITCODE
