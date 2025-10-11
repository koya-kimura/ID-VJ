#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATES_DIR="$PROJECT_ROOT/templates"
SCENE_TEMPLATE="$TEMPLATES_DIR/sceneTemplate.ts"
UI_TEMPLATE="$TEMPLATES_DIR/uiOverlayTemplate.ts"

read -r -p "Generate type (scene/ui): " typeInput
type=$(echo "$typeInput" | tr '[:upper:]' '[:lower:]')
if [[ "$type" != "scene" && "$type" != "ui" ]]; then
  echo "[Error] Type must be 'scene' or 'ui'." >&2
  exit 1
fi

function require_pascal_case() {
  local value="$1"
  if [[ ! $value =~ ^[A-Z][A-Za-z0-9]+$ ]]; then
    echo "[Error] Name must be PascalCase (letters and numbers only, starting with a capital)." >&2
    exit 1
  fi
}

function to_display_name() {
  python3 - "$1" <<'PY'
import re, sys
name = sys.argv[1]
spaced = re.sub(r'(?<!^)([A-Z])', r' \1', name)
print(spaced)
PY
}

if [[ "$type" == "scene" ]]; then
  read -r -p "Enter base name (PascalCase, without 'Scene' suffix): " base
  base=${base// /}
  require_pascal_case "$base"
  base=${base%Scene}
  className="${base}Scene"
  targetPath="$PROJECT_ROOT/src/scenes/${className}.ts"
  templatePath="$SCENE_TEMPLATE"
  displayName=$(to_display_name "$className")
  displayName=$(echo "$displayName" | sed -E 's/ Scene$//')
  postCopyNote="Remember to add ${className} to DEFAULT_SCENE_LIBRARY in src/config/sceneConfig.ts."
else
  read -r -p "Enter base name (PascalCase, without 'Overlay' suffix): " base
  base=${base// /}
  require_pascal_case "$base"
  base=${base%Overlay}
  className="${base}Overlay"
  targetPath="$PROJECT_ROOT/src/ui/${className}.ts"
  templatePath="$UI_TEMPLATE"
  displayName=$(to_display_name "$className")
  displayName=$(echo "$displayName" | sed -E 's/ Overlay$//')
  postCopyNote="Remember to add ${className} to DEFAULT_UI_OVERLAYS in src/config/uiConfig.ts."
fi

if [[ -z "$base" ]]; then
  echo "[Error] Name cannot be empty after removing suffix." >&2
  exit 1
fi

if [[ -e "$targetPath" ]]; then
  echo "[Error] ${targetPath#$PROJECT_ROOT/} already exists." >&2
  exit 1
fi

if [[ ! -f "$templatePath" ]]; then
  echo "[Error] Template not found: $templatePath" >&2
  exit 1
fi

mkdir -p "$(dirname "$targetPath")"
cp "$templatePath" "$targetPath"

sed -i '' "s/__CLASS_NAME__/${className}/g" "$targetPath"
sed -i '' "s/__DISPLAY_NAME__/${displayName}/g" "$targetPath"
sed -i '' "s#\.\./src/#../#g" "$targetPath"

if command -v code >/dev/null 2>&1; then
  code "$targetPath"
  openMessage="Opened in VS Code via 'code'."
else
  openMessage="VS Code CLI 'code' not found. Open the file manually."
fi

cat <<EOF
[Success] Created ${targetPath#$PROJECT_ROOT/}
> Class Name : ${className}
> Display Name : ${displayName}

${postCopyNote}
${openMessage}
EOF
