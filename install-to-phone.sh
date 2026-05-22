#!/bin/bash

# Campus Lost & Found - Phone Installation Script
# This script guides you through installing the app on your Android phone

set -e

echo "🚀 Campus Lost & Found - Installation Guide"
echo "==========================================="
echo ""

# Step 1: Check ADB
echo "📱 Step 1: Checking ADB Connection..."
echo ""
echo "Please connect your phone via USB and enable USB Debugging:"
echo "  1. Go to Settings → About Phone"
echo "  2. Tap 'Build Number' 7 times to enable Developer Mode"
echo "  3. Go back to Settings → Developer Options"
echo "  4. Enable 'USB Debugging'"
echo "  5. Connect phone via USB"
echo ""
read -p "Press ENTER when your phone is connected..." 

if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Please install Android SDK Platform-Tools"
    echo "   Download from: https://developer.android.com/studio/releases/platform-tools"
    exit 1
fi

echo "Checking connected devices..."
adb devices

echo ""
echo "✅ ADB is ready!"
echo ""

# Step 2: Build APK
echo "🔨 Step 2: Building Debug APK..."
echo "This may take 5-10 minutes..."
echo ""

cd /home/melkamu/Desktop/new/mobile_app

npm run apk:debug

if [ $? -eq 0 ]; then
    echo "✅ APK built successfully!"
else
    echo "❌ APK build failed. Check the errors above."
    exit 1
fi

echo ""

# Step 3: Grant USB permission on phone
echo "⚠️  Step 3: Grant USB Permission"
echo "Look at your phone screen and tap 'Allow' when asked for USB Debugging permission"
echo ""
read -p "Press ENTER after granting permission on phone..."

echo ""

# Step 4: Install APK
echo "📦 Step 4: Installing APK on Phone..."
echo ""

adb install -r android/app/build/outputs/apk/debug/app-debug.apk

if [ $? -eq 0 ]; then
    echo "✅ App installed successfully!"
else
    echo "❌ Installation failed. Try again with: adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
    exit 1
fi

echo ""
echo "🎉 Installation Complete!"
echo ""
echo "📍 Next Steps:"
echo "  1. Open the app on your phone to test"
echo "  2. Start the backend server:"
echo "     npm run server:dev"
echo "  3. Start the Metro bundler (in another terminal):"
echo "     npm start"
echo ""
echo "✨ Happy testing! 🚀"
