#!/bin/bash

# Setup Environment for Campus Lost & Found Build

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH

echo "✅ Environment variables set:"
echo "   JAVA_HOME=$JAVA_HOME"
echo "   ANDROID_HOME=$ANDROID_HOME"
echo ""
echo "Verifying Java installation..."
java -version
echo ""
echo "Ready to build! Run: npm run apk:debug"
