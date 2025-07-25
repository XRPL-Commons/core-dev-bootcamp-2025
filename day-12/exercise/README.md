# XRPL Smart Escrow Development Exercise Guide

## Overview

This exercise guides you through setting up a local XRPL node with Smart Escrow capabilities, deploying smart contracts using the Craft framework, and testing escrow functionality with WebAssembly (WAMR) integration.

## Prerequisites

- Git
- Python 3
- Node.js and npm
- Rust and Cargo
- CMake and Ninja build system
- Basic understanding of XRPL and smart contracts

## Exercise 1: Environment Setup

### Step 1: Update Conan Package Manager

Remove the old Conan version and install Conan 2:

```bash
pip3 uninstall conan
pip3 install conan
conan --version
```

### Step 2: Configure Conan Profile

Create and configure a new Conan profile:

```bash
# Create new profile
conan profile detect --force

# Edit the profile (adjust as needed for your system)
nano ~/.conan2/profiles/default
```

## Exercise 2: Build Rippled with Smart Escrow

### Step 1: Checkout Smart Escrow Branch

```bash
git fetch --all && git checkout ripple/smart-escrow
```

### Step 2: Clean and Prepare Build Environment

```bash
# Remove old build directory
rm -rf build

# Create new build directory
mkdir -p build && cd build
```

### Step 3: Install Dependencies

```bash
# Export WAMR dependency
conan export external/wamr --name=wamr --version=2.3.1

# Install dependencies with Conan
conan install .. --output-folder . --build missing --settings build_type=Debug
```

### Step 4: Configure and Build

```bash
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

## Exercise 3: Configure and Run Standalone Node

### Step 1: Setup Configuration

```bash
# Copy configuration files from day-12 exercise to build/config folder
# Ensure you have:
# - rippled.cfg
# - genesis.json
```

### Step 2: Start Standalone Node

```bash
./rippled -a --conf config/rippled.cfg --ledgerfile config/genesis.json
```

### Step 3: Monitor Debug Output

Open a new terminal and run:

```bash
tail -f config/debug.log 2>&1 | grep -E --color=always 'WAMR|ContractError|Publishing ledger [0-9]+'
```

This will show:
- **WAMR**: WebAssembly runtime messages
- **ContractError**: Smart contract execution errors
- **Publishing ledger**: Ledger progression

## Exercise 4: Setup Craft Development Framework

### Step 1: Clone and Install Craft

```bash
# Open new terminal
git clone https://github.com/ripple/craft.git
cd craft
git checkout devnet5
cargo install --path .
```

### Step 2: Verify Installation

```bash
craft --version
```

## Exercise 5: Deploy Smart Contract

### Step 1: Build KYC Contract

```bash
craft build kyc --release --opt aggressive
```

### Step 1.5: Deploy to Standalone Node

```bash
cd reference/js && npm install
```

### Step 2: Deploy to Standalone Node

```bash
node reference/js/deploy_sample_standalone.js kyc
```

### Expected Output

The deployment will create test accounts:

```
Account 1 (Origin) - Address: rEmwSjhsCpJSJE4pGTPMyUFjdgRiY1VoUj
Account 1 (Origin) - Secret: sEd7p6m4H6MdBBMz3zQDXzs26N9xNkH

Account 2 (Destination) - Address: rBue5JpRVgtKxDL39o5xn5gmdfam33RSkr
Account 2 (Destination) - Secret: sEdTeP7WVq89FihGWivK19u2K2mzURs
```

## Exercise 6: Test Smart Escrow Functionality

### Step 1: Understanding the Command Structure

The escrow finish command follows this pattern:
```
node reference/js/finish_escrow_kyc_standalone.js <Account> <AccountSecret> <Owner> <OfferSequence>
```

Where:
- **Account**: The account executing the escrow finish
- **AccountSecret**: Secret key for the executing account
- **Owner**: The account that created the original escrow
- **OfferSequence**: The sequence number of the escrow offer

### Step 2: Execute Smart Escrow

```bash
node reference/js/finish_escrow_kyc_standalone.js rEmwSjhsCpJSJE4pGTPMyUFjdgRiY1VoUj sEd7p6m4H6MdBBMz3zQDXzs26N9xNkH rEmwSjhsCpJSJE4pGTPMyUFjdgRiY1VoUj 7
```

### Step 3: Monitor Execution

Watch the debug output terminal for:
- WAMR execution messages
- Contract execution logs
- Transaction results
- Ledger updates