# Building Quantum-Resistant Signatures for XRPL: A Developer's Guide

This guide walks through implementing post-quantum cryptographic signatures in the XRP Ledger using the Dilithium algorithm. We'll build this as an amendment that allows accounts to opt into quantum-resistant signing.

## Overview

## Implementation Reference

The complete implementation can be found in the GitHub commit:
[bc8f0c2e13002887d57e69e27eafd0f11260bac2](https://github.com/Transia-RnD/rippled/commit/bc8f0c2e13002887d57e69e27eafd0f11260bac2)

The implementation adds support for Dilithium-2, a NIST-standardized post-quantum digital signature algorithm, as a third signature type alongside the existing secp256k1 and ed25519 options. This prepares XRPL for the quantum computing threat to current cryptographic methods.

## Step 1: Adding Dilithium to the Build System

The first step is integrating the Dilithium cryptographic library into our CMake build system.

### Create the Dilithium CMake Module
- Create `cmake/deps/dilithium.cmake` to fetch and build the Dilithium library from the pq-crystals repository
- Configure it to build Dilithium-2 mode with randomized signing and AES support: [dilithium.cmake](https://github.com/Transia-RnD/rippled/blob/bc8f0c2e13002887d57e69e27eafd0f11260bac2/cmake/deps/dilithium.cmake)
- Set up imported targets for the static libraries (`libdilithium2_ref.a`, `libdilithium2aes_ref.a`, `libfips202_ref.a`)

### Update Main CMake Files
- Add `include(deps/dilithium)` to the main `CMakeLists.txt`
- Update `cmake/RippledCore.cmake` to link `NIH::dilithium2_ref` to the main target

### Delete the build dir
```
cd .. && rm -r build
```

### Recompile The Build System
```bash
eval "$(pyenv init -)" && \
mkdir -p build && cd build && \
conan install .. --output-folder . --build --settings build_type=Debug && \
cmake -G Ninja \
    -DCMAKE_TOOLCHAIN_FILE:FILEPATH=build/generators/conan_toolchain.cmake \
    -DCMAKE_CXX_FLAGS=-DBOOST_ASIO_HAS_STD_INVOKE_RESULT \
    -DCMAKE_BUILD_TYPE=Debug \
    -DUNIT_TEST_REFERENCE_FEE=200 \
    -Dtests=TRUE \
    -Dxrpld=TRUE \
    -Dstatic=OFF \
    -Dassert=TRUE \
    -Dwerr=TRUE ..
cmake --build . --target rippled --parallel 10
```

Verify the build system changes work before proceeding.

## Step 2: Create the Amendment Feature

Add the quantum signature feature to the amendment system:

- Update [include/xrpl/protocol/detail/features.macro](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/detail/features.macro) to add:
  ```cpp
  XRPL_FEATURE(Quantum, Supported::yes, VoteBehavior::DefaultNo)
  ```

This creates a new amendment that validators can vote on to enable quantum-resistant signatures network-wide.

## Step 3: Extend Cryptographic Key Support

### Update Key Type System
- Extend [include/xrpl/protocol/KeyType.h](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/KeyType.h) to add `dilithium = 2` as a new key type
- Update `keyTypeFromString()` and `to_string()` functions to handle "dilithium"

### Modify PublicKey Class
- Update [include/xrpl/protocol/PublicKey.h](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/PublicKey.h) to support variable-sized keys:
  - Change from fixed 33-byte buffer to 1312-byte buffer (Dilithium public key size)
  - Add size tracking since keys are now variable length
- Update [src/libxrpl/protocol/PublicKey.cpp](https://github.com/XRPLF/rippled/tree/develop/src/libxrpl/protocol/PublicKey.cpp):
  - Add Dilithium headers and API definitions
  - Implement Dilithium key type detection in `publicKeyType()`
  - Add Dilithium signature verification in `verify()`

### Modify SecretKey Class
- Update [include/xrpl/protocol/SecretKey.h](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/SecretKey.h) to support larger secret keys:
  - Change buffer size to 2528 bytes (Dilithium secret key size)
  - Add constructor for Dilithium-sized keys
- Update [src/libxrpl/protocol/SecretKey.cpp](https://github.com/XRPLF/rippled/tree/develop/src/libxrpl/protocol/SecretKey.cpp):
  - Add comprehensive Dilithium implementation including key generation, signing
  - Implement `randomSecretKey(KeyType type)` for type-specific key generation
  - Add custom Dilithium key pair generation from seeds
  - Update signing functions to handle Dilithium signatures

### Update Base58 Encoding
- Modify [src/libxrpl/protocol/tokens.cpp](https://github.com/XRPLF/rippled/tree/develop/src/libxrpl/protocol/tokens.cpp) to handle larger key sizes:
  - Remove the 64-character limit that would block Dilithium keys
  - Add fallback to reference implementation for large keys

### Compile and Test Cryptographic Changes
```bash
cmake --build . --target rippled --parallel 10
```

## Step 4: Add Force Quantum Feature

Implement the account flag that enforces quantum-resistant signatures:

### Update Ledger Formats
- Add `lsfForceQuantum = 0x02000000` flag to [include/xrpl/protocol/LedgerFormats.h](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/LedgerFormats.h)

### Update Transaction Flags
- Add `asfForceQuantum = 11` to [include/xrpl/protocol/TxFlags.h](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/TxFlags.h)

### Implement SetAccount Transaction Support
- Update [src/xrpld/app/tx/detail/SetAccount.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/SetAccount.cpp) to handle setting/clearing the ForceQuantum flag

### Add Signature Validation
- Update [src/xrpld/app/tx/detail/Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp) in `checkSign()`:
  - Check if account has `lsfForceQuantum` flag set
  - Reject transactions with non-Dilithium signatures when flag is active

### Final Compilation
```bash
cmake --build . --target rippled --parallel 10
```

Ensure all protocol changes build correctly.

## Step 5: Create Comprehensive Tests

### Create Integration Test
- Add `src/test/app/MyTests_test.cpp` to test:
  - Simple payment with Dilithium signatures
  - ForceQuantum flag functionality

## Step 6: Testing and Validation

### Run the Primary Integration Test
```bash
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.app.MyTests
```

## Step 7: Create Quantum Key Ledger Entry

Now we need to create a new ledger entry type to store quantum public keys on-ledger. This allows accounts to register their quantum keys and enables validation during transaction processing.

### Add LedgerNameSpace Entry

First, add the quantum key namespace to the `LedgerNameSpace` enum in `src/xrpl/protocol/Indexes.cpp`:

```cpp
enum class LedgerNameSpace : std::uint16_t {
    // ... existing entries ...
    VAULT = 'V',
    QUANTUM_KEY = 'Q',  // Add this new entry

    // No longer used or supported entries...
};
```

### Add New Ledger Entry Type

Update `ledger_entries.macro` to define the new `QuantumKey` ledger entry:

```cpp
LEDGER_ENTRY(ltQUANTUM_KEY, 0x0071, QuantumKey, quantumKey, ({
    {sfAccount,              soeREQUIRED},
    {sfQuantumPublicKey,     soeREQUIRED},
    {sfPreviousTxnID,        soeREQUIRED},
    {sfPreviousTxnLgrSeq,    soeREQUIRED},
    {sfOwnerNode,            soeREQUIRED},
}))
```

### Add New SField for Quantum Public Key

Update `sfields.macro` to add the quantum public key field:

```cpp
TYPED_SFIELD(sfQuantumPublicKey, VL, 19)
```

### Add Keylet Support

Add the quantum key keylet function to the `keylet` namespace in `src/xrpl/protocol/Indexes.cpp`:

```cpp
namespace keylet {

// ... existing keylet functions ...

Keylet
quantum(AccountID const& account, Slice const& quantumPublicKey) noexcept
{
    return {
        ltQUANTUM_KEY,
        indexHash(
            LedgerNameSpace::QUANTUM_KEY,
            account,
            quantumPublicKey)
    };
}

}  // namespace keylet
```

And declare it in `include/xrpl/protocol/Indexes.h`:

```cpp
namespace keylet {

// ... existing declarations ...

Keylet
quantum(AccountID const& account, Slice const& quantumPublicKey) noexcept;

}  // namespace keylet
```

## Step 8: Create SetQuantumKey Transaction

Now we need to create a new transaction type that allows accounts to register their quantum public keys.

### Add Transaction Type

#### Update `transactions.macro`
Add the new transaction type:
```cpp
TRANSACTION(ttSET_QUANTUM_KEY, 25, SetQuantumKey, Delegation::notDelegatable, ({
    {sfQuantumPublicKey, soeREQUIRED},
}))
```

### Create Transaction Implementation

Create `src/xrpld/app/tx/detail/SetQuantumKey.cpp` with the basic structure:

```cpp
#include <xrpld/app/tx/detail/SetQuantumKey.h>
#include <xrpl/protocol/Feature.h>
#include <xrpl/protocol/KeyType.h>
#include <xrpl/protocol/PublicKey.h>
#include <xrpl/protocol/Indexes.h>

namespace ripple {

NotTEC
SetQuantumKey::preflight(PreflightContext const& ctx)
{
    if (!ctx.rules.enabled(featureQuantum))
        return temDISABLED;

    if (auto const ret = preflight1(ctx); !isTesSuccess(ret))
        return ret;

    // TODO: Validate quantum public key format and size
    // Hint: Check sfQuantumPublicKey field exists and is valid Dilithium key

    return preflight2(ctx);
}

TER
SetQuantumKey::preclaim(PreclaimContext const& ctx)
{
    // TODO: Check if quantum key already exists for this account
    // Hint: Use keylet::quantum() to check if ledger entry exists
    
    return tesSUCCESS;
}

TER
SetQuantumKey::doApply()
{
    // TODO: Create or update the quantum key ledger entry
    // Hint: Use keylet::quantum() to create the entry
    // Set all required fields: sfAccount, sfQuantumPublicKey, etc.
    
    return tesSUCCESS;
}

} // namespace ripple
```

### Create Header File

Create `src/xrpld/app/tx/detail/SetQuantumKey.h`:
```cpp
#pragma once

#include <xrpld/app/tx/detail/Transactor.h>

namespace ripple {

class SetQuantumKey : public Transactor
{
public:
    static constexpr ConsequencesFactoryType ConsequencesFactory{Normal};

    explicit SetQuantumKey(ApplyContext& ctx) : Transactor(ctx)
    {
    }

    static NotTEC
    preflight(PreflightContext const& ctx);

    static TER
    preclaim(PreclaimContext const& ctx);

    TER
    doApply() override;
};

} // namespace ripple
```

## Step 9: Update Signature Validation

### Modify Transaction Validation

Update the signature validation logic in `src/xrpld/app/tx/detail/Transactor.cpp` to check for quantum keys when validating signatures:

```cpp
// In checkSign() method, add quantum key validation:
if (publicKeyType(signingPubKey) == KeyType::dilithium)
{
    // TODO: Verify that the quantum public key exists in the ledger
    // Hint: Use keylet::quantum() to lookup the key
    // Ensure the signing key matches the registered quantum key
}
```

## Testing Strategy

### Unit Tests
1. Test quantum key index generation with various inputs
2. Validate keylet creation and lookup functions
3. Test error conditions and edge cases

### Integration Tests
1. Test complete quantum key registration flow
2. Validate signature verification with registered keys
3. Test interaction with ForceQuantum account flag
4. Test key rotation scenarios