# Rippled Development Environment Setup Guide

## Prerequisites

Before starting, ensure you have the following tools installed:
- **Node.js/npm**: Use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions
- **Python**: Managed via pyenv
- **CMake**: Install CMake.app and ensure it's in your PATH

## Setting up Rippled

### Step 1: Follow Official Build Instructions

Refer to the official build documentation: https://github.com/XRPLF/rippled/blob/develop/BUILD.md

**Need help?** Contact: denis@xrpl-labs.com

### Step 2: Install Xcode with Apple Clang 16 (macOS)

#### Download Older Xcode Version

1. Visit the [Apple Developer Downloads](https://developer.apple.com/download/more/) page
2. Sign in with your Apple Developer account
3. Search for the Xcode version that includes **Apple Clang 16**
   - Check the release notes for each Xcode version to confirm Clang version
4. Download the Xcode `.xip` file

#### Install Xcode

1. Extract the downloaded `.xip` file
2. Rename the Xcode application for version management:
   ```bash
   # Example: Xcode_16.2.app
   ```
3. Move to Applications directory:
   ```bash
   # Drag to /Applications directory
   ```

#### Switch Xcode Toolchain

1. Set the desired Xcode version as default:
   ```bash
   sudo xcode-select -s /Applications/Xcode_16.2.app/Contents/Developer
   ```
   *Replace `Xcode_16.2.app` with your actual Xcode version*

2. Verify Clang version:
   ```bash
   clang --version
   ```

### Step 3: Clone the Repository

```bash
mkdir ~/projects && \
cd ~/projects && \
git clone https://github.com/Xahau/xahaud.git && \
cd xahaud && \
git checkout dev
```

### Step 4: Build the Project

```bash
# Initialize Python environment
eval "$(pyenv init -)"

# Set development environment variables
export DEVELOPER_DIR=/Applications/Xcode_16.2.app/Contents/Developer
export PATH="/Applications/CMake.app/Contents/bin:$PATH"

# Create build directory and configure
mkdir build && cd build

# Install dependencies with Conan
conan install .. --output-folder . --build --settings build_type=Debug

# Configure with CMake
cmake -G Ninja \
    -DCMAKE_TOOLCHAIN_FILE:FILEPATH=build/generators/conan_toolchain.cmake \
    -DCMAKE_BUILD_TYPE=Debug \
    -Dassert=ON \
    -Dunity=ON \
    -Dstatic=OFF ..

# Build rippled
cmake --build . --target rippled --parallel 10
```

## Setting up Playground Environment

### Node.js Setup

Install and configure Node.js using nvm for better version management:

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use the latest LTS version of Node.js
nvm install --lts
nvm use --lts

# Verify installation
node --version
npm --version
```

---

## Troubleshooting

- **Build issues**: Contact denis@xrpl-labs.com
- **Xcode compatibility**: Ensure you're using the correct Xcode version with Apple Clang 16
- **Path issues**: Verify all environment variables are set correctly
- **Conan issues**: Make sure Conan is properly installed and configured

## Next Steps

After successful setup, you can proceed with your rippled development workflow. Refer to the official documentation for additional configuration and usage instructions.