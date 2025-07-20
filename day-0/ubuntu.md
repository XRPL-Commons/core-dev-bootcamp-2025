# Rippled Build Guide for Ubuntu

This guide walks you through building the Rippled project on ubuntu with all necessary dependencies and toolchain setup.

## Prerequisites

- ubuntu with admin privileges
- Stable internet connection for downloading dependencies

### Install Package Management Tools

Install essential build tools:

```bash
apt update
apt install --yes curl git libssl-dev pipx python3.10-dev python3-pip make g++-11 libprotobuf-dev protobuf-compiler

curl --location --remote-name \
  "https://github.com/Kitware/CMake/releases/download/v3.25.1/cmake-3.25.1.tar.gz"
tar -xzf cmake-3.25.1.tar.gz
rm cmake-3.25.1.tar.gz
cd cmake-3.25.1
./bootstrap --parallel=$(nproc)
make --jobs $(nproc)
make install
cd ..

pipx install 'conan>2'
pipx ensurepath
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
#conan profile new default --detect
conan profile detect --force

nano ~/.conan2/profiles/default

# Configure C++ standard
conan profile update settings.compiler.cppstd=20 default

# Link libstdc++
conan profile update settings.compiler.libcxx=libstdc++11 default
```

**Verify your configuration:**
```bash
conan profile show default
```

**Example Conan profile for Ubuntu:**
```ini
[settings]
os=Linux
os_build=Linux
arch=x86_64
arch_build=x86_64
compiler=gcc
compiler.version=11
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

1. **Verify Conan profile**: Run `conan profile show default` to check settings
2. **Environment variables**: Make sure `DEVELOPER_DIR` points to your Xcode installation
3. **Build logs**: Check the build output for specific error messages

## Additional Resources

- [Build Troubleshooting](https://github.com/XRPLF/rippled/blob/develop/BUILD.md#troubleshooting)
- [Official Build Documentation](https://github.com/XRPLF/rippled/blob/develop/BUILD.md)
- [Environment Setup Guide](https://github.com/XRPLF/rippled/blob/develop/docs/build/environment.md#macos)
- [Rippled GitHub Repository](https://github.com/XRPLF/rippled)

## Notes

- This build creates a debug version suitable for development
- The process may take 30-60 minutes depending on your hardware
- Ensure you have sufficient disk space (several GB) for dependencies and build artifacts