# Building Quantum-Resistant Signatures for XRPL: A Developer's Guide

This guide walks through implementing post-quantum cryptographic signatures in the XRP Ledger using the Dilithium algorithm. We'll build this as an amendment that allows accounts to opt into quantum-resistant signing.

## Overview

## Implementation Reference

The complete implementation can be found in the GitHub commit:
https://github.com/Transia-RnD/rippled/commit/bc8f0c2e13002887d57e69e27eafd0f11260bac2

The implementation adds support for Dilithium-2, a NIST-standardized post-quantum digital signature algorithm, as a third signature type alongside the existing secp256k1 and ed25519 options. This prepares XRPL for the quantum computing threat to current cryptographic methods.

## Step 1: Adding Dilithium to the Build System

The first step is integrating the Dilithium cryptographic library into our CMake build system.

### Create the Dilithium CMake Module
- Create `cmake/deps/dilithium.cmake` to fetch and build the Dilithium library from the pq-crystals repository
- Configure it to build Dilithium-2 mode with randomized signing and AES support
- Set up imported targets for the static libraries (`libdilithium2_ref.a`, `libdilithium2aes_ref.a`, `libfips202_ref.a`)

### Update Main CMake Files
- Add `include(deps/dilithium)` to the main `CMakeLists.txt`
- Update `cmake/RippledCore.cmake` to link `NIH::dilithium2_ref` to the main target

### Compile and Test Build System
```bash
cmake --build . --target rippled --parallel 10
```

Verify the build system changes work before proceeding.

## Step 2: Create the Amendment Feature

Add the quantum signature feature to the amendment system:

- Update `include/xrpl/protocol/detail/features.macro` to add:
  ```cpp
  XRPL_FEATURE(Quantum, Supported::yes, VoteBehavior::DefaultNo)
  ```

This creates a new amendment that validators can vote on to enable quantum-resistant signatures network-wide.

## Step 3: Extend Cryptographic Key Support

### Update Key Type System
- Extend `include/xrpl/protocol/KeyType.h` to add `dilithium = 2` as a new key type
- Update `keyTypeFromString()` and `to_string()` functions to handle "dilithium"

### Modify PublicKey Class
- Update `include/xrpl/protocol/PublicKey.h` to support variable-sized keys:
  - Change from fixed 33-byte buffer to 1312-byte buffer (Dilithium public key size)
  - Add size tracking since keys are now variable length
- Update `src/libxrpl/protocol/PublicKey.cpp`:
  - Add Dilithium headers and API definitions
  - Implement Dilithium key type detection in `publicKeyType()`
  - Add Dilithium signature verification in `verify()`

### Modify SecretKey Class
- Update `include/xrpl/protocol/SecretKey.h` to support larger secret keys:
  - Change buffer size to 2528 bytes (Dilithium secret key size)
  - Add constructor for Dilithium-sized keys
- Update `src/libxrpl/protocol/SecretKey.cpp`:
  - Add comprehensive Dilithium implementation including key generation, signing
  - Implement `randomSecretKey(KeyType type)` for type-specific key generation
  - Add custom Dilithium key pair generation from seeds
  - Update signing functions to handle Dilithium signatures

### Update Base58 Encoding
- Modify `src/libxrpl/protocol/tokens.cpp` to handle larger key sizes:
  - Remove the 64-character limit that would block Dilithium keys
  - Add fallback to reference implementation for large keys

### Compile and Test Cryptographic Changes
```bash
cmake --build . --target rippled --parallel 10
```

## Step 4: Add Force Quantum Feature

Implement the account flag that enforces quantum-resistant signatures:

### Update Ledger Formats
- Add `lsfForceQuantum = 0x02000000` flag to `include/xrpl/protocol/LedgerFormats.h`

### Update Transaction Flags
- Add `asfForceQuantum = 11` to `include/xrpl/protocol/TxFlags.h`

### Implement SetAccount Transaction Support
- Update `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/SetAccount.cpp` to handle setting/clearing the ForceQuantum flag

### Add Signature Validation
- Update `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp` in `checkSign()`:
  - Check if account has `lsfForceQuantum` flag set
  - Reject transactions with non-Dilithium signatures when flag is active

### Final Compilation
```bash
cmake --build . --target rippled --parallel 10
```

Ensure all protocol changes build correctly.

## Step 5: Create Comprehensive Tests

### Create Integration Test
- Add `src/test/app/Wildcard_test.cpp` to test:
  - Wildcard network signing behavior
  - Simple payment with Dilithium signatures
  - ForceQuantum flag functionality

### Update Unit Tests
- Update `src/test/protocol/PublicKey_test.cpp`:
  - Add Dilithium key generation and validation tests
  - Test Base58 encoding/decoding for large keys
- Update `src/test/protocol/SecretKey_test.cpp`:
  - Add Dilithium key derivation tests
  - Test signing and verification with Dilithium
- Update `src/test/protocol/Seed_test.cpp`:
  - Add Dilithium keypair generation tests

## Step 6: Testing and Validation

### Run the Primary Integration Test
```bash
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.app.Wildcard
```

This will compile and run the Wildcard test that demonstrates quantum signature functionality.

### Run Additional Cryptography Tests
```bash
# Test public key functionality
./rippled -u ripple.protocol.PublicKey

# Test secret key functionality  
./rippled -u ripple.protocol.SecretKey

# Test seed functionality
./rippled -u ripple.protocol.Seed
```

### Test Transaction Flow
1. Create account with Dilithium keys
2. Set ForceQuantum flag on account
3. Verify only Dilithium signatures are accepted
4. Test transaction signing and validation

### Review Implementation
- Verify signature sizes and formats
- Check key generation determinism
- Validate Base58 encoding for large keys
- Test amendment activation behavior

## Next Steps: Validator Support

The current implementation focuses on account signatures, but validators will also need quantum-resistant protection:

1. **Validator Key Updates**: Extend validator key infrastructure to support Dilithium
2. **Consensus Integration**: Update consensus protocol to handle quantum-resistant validator signatures  
3. **Network Transition**: Plan staged rollout for validator quantum signature adoption
4. **Performance Optimization**: Optimize Dilithium operations for high-throughput validation

## Key Technical Considerations

- **Key Size Impact**: Dilithium signatures are significantly larger (~2.5KB vs ~70 bytes), affecting transaction size and network bandwidth
- **Performance**: Dilithium verification is slower than traditional algorithms, requiring performance testing under load
- **Backwards Compatibility**: The amendment system ensures old nodes continue working until upgrade
- **Base58 Encoding**: Large key sizes required extending the encoding system beyond original limits

## Build and Test Commands Summary

```bash
# Initial build after CMake changes
cmake --build . --target rippled --parallel 10

# Build and test after cryptographic implementation
cmake --build . --target rippled --parallel 10

# Final build and run integration test
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.app.Wildcard

# Run individual unit tests
./rippled -u ripple.protocol.PublicKey
./rippled -u ripple.protocol.SecretKey
./rippled -u ripple.protocol.Seed
```