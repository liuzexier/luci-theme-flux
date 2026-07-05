#!/usr/bin/env bash
set -euo pipefail

OPENWRT_VERSION="${OPENWRT_VERSION:-24.10.7}"
TARGETS="${TARGETS:-x86/64 mediatek/filogic}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$ROOT_DIR/build}"
DOWNLOAD_DIR="$BUILD_DIR/downloads"
SDK_DIR="$BUILD_DIR/sdk"
OUT_DIR="$ROOT_DIR/dist"

if [ "$(uname -s)" != "Linux" ]; then
  echo "OpenWrt SDK archives are Linux toolchains. Run this script on Linux or GitHub Actions." >&2
  exit 1
fi

command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }
command -v tar >/dev/null || { echo "tar is required" >&2; exit 1; }
command -v rsync >/dev/null || { echo "rsync is required" >&2; exit 1; }

mkdir -p "$DOWNLOAD_DIR" "$SDK_DIR" "$OUT_DIR"

find_sdk_name() {
  local target="$1"
  local index_url="https://downloads.openwrt.org/releases/$OPENWRT_VERSION/targets/$target/"

  curl -fsSL "$index_url" |
    sed -n 's/.*href="\([^"]*openwrt-sdk-[^"]*Linux-x86_64\.tar\.zst\)".*/\1/p' |
    head -n 1
}

copy_theme_into_sdk() {
  local sdk="$1"
  local dest="$sdk/feeds/luci/themes/luci-theme-flux"

  rm -rf "$dest"
  mkdir -p "$dest"

  rsync -a --delete \
    --exclude ".git" \
    --exclude ".github" \
    --exclude "build" \
    --exclude "dist" \
    --exclude "preview" \
    "$ROOT_DIR/" "$dest/"
}

build_target() {
  local target="$1"
  local target_slug="${target//\//-}"
  local index_url="https://downloads.openwrt.org/releases/$OPENWRT_VERSION/targets/$target/"
  local sdk_name
  local archive
  local sdk

  echo "==> Resolving SDK for $target"
  sdk_name="$(find_sdk_name "$target")"

  if [ -z "$sdk_name" ]; then
    echo "Could not find SDK archive at $index_url" >&2
    exit 1
  fi

  archive="$DOWNLOAD_DIR/$sdk_name"

  if [ ! -f "$archive" ]; then
    echo "==> Downloading $sdk_name"
    curl -fL "$index_url$sdk_name" -o "$archive"
  fi

  echo "==> Extracting $sdk_name"
  rm -rf "$SDK_DIR/$target_slug"
  mkdir -p "$SDK_DIR/$target_slug"
  tar --zstd -xf "$archive" -C "$SDK_DIR/$target_slug" --strip-components=1
  sdk="$SDK_DIR/$target_slug"

  echo "==> Updating LuCI feed for $target"
  (cd "$sdk" && ./scripts/feeds update luci)

  echo "==> Copying luci-theme-flux into LuCI feed"
  copy_theme_into_sdk "$sdk"

  echo "==> Installing luci-theme-flux feed package"
  (cd "$sdk" && ./scripts/feeds install luci-theme-flux)

  echo "==> Compiling luci-theme-flux for $target"
  (cd "$sdk" && make package/feeds/luci/luci-theme-flux/compile V=s)

  echo "==> Collecting ipk artifacts"
  mkdir -p "$OUT_DIR/$target_slug"
  find "$sdk/bin/packages" -path "*/luci/luci-theme-flux_*.ipk" -exec cp -v {} "$OUT_DIR/$target_slug/" \;
}

for target in $TARGETS; do
  build_target "$target"
done

echo "==> Done. Artifacts:"
find "$OUT_DIR" -name "luci-theme-flux_*.ipk" -print
