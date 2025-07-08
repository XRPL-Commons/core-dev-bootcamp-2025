# Rippled Build Guide for macOS

This guide walks you through building the Rippled project on macOS with all necessary dependencies and toolchain setup.

## Prerequisites

- macOS with admin privileges
- Apple Developer account (for downloading older Xcode versions)
- Stable internet connection for downloading dependencies

## Step 1: Check Development Tools

### Check Current Clang Version

First, check if you already have the required Clang version:

```bash
clang --version
```

**If the output shows Apple Clang version 15 or 16, you can skip to Step 2.**

> ⚠️ **Important**: You need exactly version 15 or 16. Version 17 will not compile successfully.

### Install Xcode with Apple Clang 15 or 16 (if needed)

If your Clang version is not version 15 or 16, you'll need to install the correct Xcode version:

1. **Download Xcode**
   - Visit [Apple Developer Downloads](https://developer.apple.com/download/more/)
   - Sign in with your Apple Developer account
   - Search for an Xcode version that includes **Apple Clang 15 or 16**
   - Download the `.xip` file

2. **Install and Configure Xcode**
   ```bash
   # Extract the .xip file and rename for version management
   # Example: Xcode_16.2.app
   
   # Move to Applications directory
   sudo mv Xcode_16.2.app /Applications/
   
   # Set as default toolchain
   sudo xcode-select -s /Applications/Xcode_16.2.app/Contents/Developer
   ```

3. **Verify Installation**
   ```bash
   clang --version  # Should now show version 15 or 16
   git --version    # Should be available from command line tools
   ```

### Install Package Management Tools

Install Homebrew and essential build tools:

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Update Homebrew and install dependencies
brew update
brew install xz pyenv cmake
```

### Setup Python Environment

Configure Python 3.10 with pyenv:

```bash
# Install Python 3.10
pyenv install 3.10-dev
pyenv global 3.10-dev
eval "$(pyenv init -)"

# Install Conan package manager
pip install 'conan<2'
```

## Step 2: Clone Repository

```bash
# Create project directory and clone rippled
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/XRPLF/rippled.git
cd rippled
git checkout develop
```

## Step 3: Configure Conan

Set up Conan with the correct compiler settings:

```bash
# Create default profile
conan profile new default --detect

# Configure C++ standard
conan profile update settings.compiler.cppstd=20 default

# Enable recipe revisions (Conan 1.x)
conan config set general.revisions_enabled=1
```

### Additional Setup for Apple Clang 15

**If you're using Apple Clang 15**, you need additional boost/std string_view compatibility settings:

```bash
# Configure boost/std string_view compatibility (Clang 15 only)
conan profile update 'conf.tools.build:cxxflags+=["-DBOOST_BEAST_USE_STD_STRING_VIEW"]' default
conan profile update 'env.CXXFLAGS="-DBOOST_BEAST_USE_STD_STRING_VIEW"' default
```

**If you're using Apple Clang 16**, you can skip the above compatibility settings.

**Verify your configuration:**
```bash
conan profile show default
```

**Example Conan profile for Apple Silicon Mac:**
```ini
[settings]
os=Macos
os_build=Macos
arch=armv8
arch_build=armv8
compiler=apple-clang
compiler.version=16
compiler.libcxx=libc++
build_type=Debug
compiler.cppstd=20
[options]
[conf]
[build_requires]
[env]
```

## Step 4: Build Rippled

### Environment Setup

```bash
# Initialize Python environment
eval "$(pyenv init -)"

# Set development environment variables
export DEVELOPER_DIR=/Applications/Xcode_16.2.app/Contents/Developer
```

### Build Process

```bash
# Create and enter build directory
mkdir -p build && cd build

# Install dependencies with Conan
conan install .. \
    --output-folder . \
    --build \
    --settings build_type=Debug

# Configure project with CMake
cmake -G Ninja \
    -DCMAKE_TOOLCHAIN_FILE:FILEPATH=build/generators/conan_toolchain.cmake \
    -DCMAKE_CXX_FLAGS=-DBOOST_ASIO_HAS_STD_INVOKE_RESULT \
    -DCMAKE_BUILD_TYPE=Debug \
    -DUNIT_TEST_REFERENCE_FEE=200 \
    -Dtests=TRUE \
    -Dxrpld=TRUE \
    -Dstatic=OFF \
    -Dassert=TRUE \
    -Dwerr=TRUE \
    ..

# Build rippled (using 10 parallel jobs)
cmake --build . --target rippled --parallel 10
```

## Troubleshooting

If you encounter issues during the build process:

1. **Check Clang version**: Ensure you have Apple Clang 16 installed
2. **Verify Conan profile**: Run `conan profile show default` to check settings
3. **Environment variables**: Make sure `DEVELOPER_DIR` points to your Xcode installation
4. **Build logs**: Check the build output for specific error messages

## Additional Resources

- [Build Troubleshooting](https://github.com/XRPLF/rippled/blob/develop/BUILD.md#troubleshooting)
- [Official Build Documentation](https://github.com/XRPLF/rippled/blob/develop/BUILD.md)
- [Environment Setup Guide](https://github.com/XRPLF/rippled/blob/develop/docs/build/environment.md#macos)
- [Rippled GitHub Repository](https://github.com/XRPLF/rippled)

## Notes

- This build creates a debug version suitable for development
- The process may take 30-60 minutes depending on your hardware
- Ensure you have sufficient disk space (several GB) for dependencies and build artifacts