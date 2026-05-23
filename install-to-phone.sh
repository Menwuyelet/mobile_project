#!/bin/bash

# Campus Lost & Found - Remote Phone Installation Script
# Builds and installs the standalone release APK (no local Metro/backend needed).

set -euo pipefail

APP_ID="com.campuslostfoundtemplate074"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

echo "Campus Lost & Found - Remote Install"
echo "===================================="
echo

if ! command -v adb >/dev/null 2>&1; then
  echo "ADB not found. Install Android SDK Platform-Tools first."
  echo "https://developer.android.com/studio/releases/platform-tools"
  exit 1
fi

echo "Checking connected Android devices..."
DEVICE_COUNT="$(adb devices | awk 'NR>1 && $2=="device" {count++} END {print count+0}')"
if [ "${DEVICE_COUNT}" -eq 0 ]; then
  echo "No authorized Android device found."
  echo "Connect your phone with USB debugging enabled, then run this script again."
  exit 1
fi
adb devices
echo

echo "Building release APK..."
npm run apk:release
echo "Release build complete."
echo

echo "Installing release APK..."
adb install -r "${APK_PATH}"
echo "Install complete."
echo

echo "Launching app..."
adb shell am start -n "${APP_ID}/.MainActivity" >/dev/null 2>&1 || true
echo
echo "Done. App is installed in remote mode and uses hosted backend."
