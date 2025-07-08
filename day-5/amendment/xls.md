# XLS-??d Quantum-Resistant Signatures

```markdown
Title: Quantum-Resistant Signatures
Revision: 1 (2025-07-08)
Type: Draft
Author:
    Atharva Lele, Trinity College Dublin
    Denis Angell, XRPL Labs
```

## Abstract

This proposal introduces quantum-resistant digital signatures to the XRP Ledger (XRPL) using the Dilithium post-quantum cryptographic algorithm. The amendment provides accounts with the ability to use quantum-resistant signatures for enhanced security against future quantum computing threats while maintaining backward compatibility with existing signature schemes.

## Motivation and Rationale

As quantum computing advances, current cryptographic signatures (secp256k1, ed25519) may become vulnerable to quantum attacks. This proposal adds support for Dilithium, a NIST-standardized post-quantum signature algorithm, ensuring long-term security for XRPL accounts.

## Amendment

This feature enables accounts to use quantum-resistant signatures with an optional enforcement mechanism.

The amendment adds:
- Support for Dilithium signature algorithm (`KeyType::dilithium = 2`)
- New account flag `lsfForceQuantum` to enforce quantum-resistant signatures
- Updated key generation, encoding, and verification systems

---

## Development Branch

### Implementation Repository

The quantum-resistant signatures implementation is currently under active development in the following branch:

**Repository**: [Transia-RnD/rippled](https://github.com/Transia-RnD/rippled)  
**Branch**: [`dilithium-full`](https://github.com/Transia-RnD/rippled/tree/dilithium-full)

### Development Status

This branch contains the working implementation of the quantum-resistant signature system, including:

- **Core Dilithium Integration**: Implementation of the Dilithium post-quantum signature algorithm
- **Key Management Updates**: Modified key generation, storage, and retrieval systems
- **Signature Verification**: Updated transaction signing and verification processes
- **Account Flag Implementation**: `lsfForceQuantum` flag enforcement mechanisms
- **Backward Compatibility**: Maintained support for existing signature schemes

### Testing and Validation

The quantum branch includes:
- Unit tests for Dilithium key operations
- Integration tests for quantum-resistant transaction processing
- Performance benchmarks comparing signature verification times
- Compatibility tests ensuring existing functionality remains intact

### Contributing

Developers interested in contributing to the quantum-resistant signatures implementation should:

1. Fork the repository and checkout the `quantum` branch
2. Review the existing implementation and test coverage
3. Submit pull requests against the `quantum` branch
4. Ensure all tests pass and maintain backward compatibility

---

## Implementation Details

### Key Specifications

| Aspect | secp256k1 | ed25519 | **Dilithium** |
|--------|-----------|---------|---------------|
| Public Key Size | 33 bytes | 33 bytes | **1312 bytes** |
| Secret Key Size | 32 bytes | 32 bytes | **2528 bytes** |
| Signature Size | ~70 bytes | 64 bytes | **~2420 bytes** |
| Security Level | 128-bit | 128-bit | **128-bit (quantum-resistant)** |

### Key Generation

```cpp
// Generate quantum-resistant keys
auto keyPair = generateKeyPair(KeyType::dilithium, seed);
auto secretKey = randomSecretKey(KeyType::dilithium);
```

### Public Key Detection

```cpp
std::optional<KeyType> publicKeyType(Slice const& slice) {
    if (slice.size() == 33) {
        if (slice[0] == 0xED) return KeyType::ed25519;
        if (slice[0] == 0x02 || slice[0] == 0x03) return KeyType::secp256k1;
    }
    else if (slice.size() == CRYPTO_PUBLICKEYBYTES) {
        return KeyType::dilithium;  // 1312 bytes
    }
    return std::nullopt;
}
```

---

## Account Flag: Force Quantum Signatures

### `lsfForceQuantum` Flag

| Field | Value | Description |
|-------|-------|-------------|
| `lsfForceQuantum` | `0x02000000` | When set, account requires quantum-resistant signatures |
| `asfForceQuantum` | `11` | AccountSet flag to enable/disable quantum requirement |

### Usage

```json
{
  "TransactionType": "AccountSet",
  "Account": "rAccount...",
  "SetFlag": 11  // Enable quantum-only signatures
}
```

### Enforcement

```cpp
if (account.isFlag(lsfForceQuantum) && publicKey.size() != DILITHIUM_PK_SIZE)
    return telBAD_PUBLIC_KEY;
```

---

## Signature Operations

### Signature Generation

```cpp
case KeyType::dilithium: {
    uint8_t sig[CRYPTO_BYTES];
    size_t len;
    crypto_sign_signature(sig, &len, message.data(), message.size(), secretKey.data());
    return Buffer{sig, len};
}
```

### Signature Verification

```cpp
if (keyType == KeyType::dilithium) {
    return crypto_sign_verify(
        sig.data(), sig.size(), 
        message.data(), message.size(), 
        publicKey.data()) == 0;
}
```

---

## Migration Strategy

### Gradual Adoption
1. **Optional Phase**: Quantum signatures available but not required
2. **Account Choice**: Individual accounts can enable `lsfForceQuantum`
3. **Network Transition**: Networks can mandate quantum signatures over time

### Backward Compatibility
- Existing accounts continue using current signature types
- No breaking changes to existing functionality
- Smooth upgrade path for enhanced security

---

## Error Codes

| Error Code | Description |
|------------|-------------|
| `telBAD_PUBLIC_KEY` | Non-quantum signature used with `lsfForceQuantum` account |

---

## Future Requirements

### Validator Infrastructure Updates

As quantum-resistant signatures become standard, several validator-related components will require updates:

#### Validator Code Updates
- **rippled**: Core validator software must support quantum-resistant key generation and signature verification
- **Consensus Algorithm**: Ensure quantum-resistant signatures are properly validated during consensus
- **Peer Communication**: Update peer-to-peer communication to handle larger quantum signatures

#### UNL (Unique Node List) Generation
- **UNL Tools**: Update UNL generation tools to support quantum-resistant validator keys
- **Key Format**: Modify UNL file format to accommodate larger Dilithium public keys (1312 bytes)
- **Validation**: Ensure UNL validation processes can verify quantum-resistant signatures

#### validator-keys Repository
- **Key Generation**: Update validator-keys tool to generate Dilithium key pairs
- **Key Management**: Modify key storage and management for larger quantum keys
- **Migration Tools**: Provide utilities for existing validators to transition to quantum-resistant keys
- **Documentation**: Update validator setup guides for quantum key generation

### Network Transition Considerations
- **Phased Rollout**: Gradual migration of validators to quantum-resistant keys
- **Backward Compatibility**: Maintain support for existing validator keys during transition
- **Performance Impact**: Account for increased signature verification time and bandwidth usage

---

## Dependencies

- **Dilithium Library**: pq-crystals/dilithium reference implementation

---

## Example Usage

### Generate Quantum-Resistant Keys

```cpp
// From seed
auto seed = generateSeed("masterpassphrase");
auto keyPair = generateKeyPair(KeyType::dilithium, seed);

// Random generation
auto secretKey = randomSecretKey(KeyType::dilithium);
auto publicKey = derivePublicKey(KeyType::dilithium, secretKey);
```

### Enable Quantum-Only Account

```json
{
  "TransactionType": "AccountSet",
  "Account": "rQuantumAccount...",
  "SetFlag": 11
}
```

### Sign Transaction with Quantum Key

```cpp
auto signature = sign(publicKey, secretKey, transactionData);
bool isValid = verify(publicKey, transactionData, signature);
```