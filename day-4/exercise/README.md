# XRPL Cryptography Deep Dive: Transaction Signing & Verification

## 🔍 Quest Tasks

### Task 1: Signature Verification Discovery
**Objective**: Find where rippled verifies transaction signatures

**Steps**:
1. Start your investigation at `Transactor::apply()` in `src/ripple/app/tx/impl/Transactor.cpp`
2. Follow the call chain through `preflight()` and `checkSign()`
3. Identify the core verification function

**Questions to Answer**:
- Which function performs the actual signature check?
- What cryptographic method is used (ed25519, secp256k1, or both)?
- How does the system handle different signature algorithms?

> **Note:**  
> - `Transactor::checkSign()` is responsible for verifying ledger permissions, such as checking for the use of a `RegularKey` or a `SignerList` (multi-signature).  
> - `STTx::checkSign()` performs the actual cryptographic signature verification.  
> - The function `checkValidity` is also involved in checking the validity of the transaction and its signatures.

### Task 2: Public Key Flow Analysis
**Objective**: Trace how public keys are retrieved and validated

**Investigation Points**:
- How does the network retrieve the public key for a signing account?
- Where is the public key stored in the ledger?
- What validation steps ensure the public key is legitimate?

**Files to Examine**:
- `src/ripple/protocol/STTx.cpp`
- Account object handling in ledger code
- Public key extraction logic

### Task 3: Multi-Signature Deep Dive
**Objective**: Understand multi-signature implementation

**Research Areas**:
- Where is multisig logic implemented?
- How does the verification process change for multi-signed transactions?
- What are the requirements for valid multi-signature combinations?

**Key Questions**:
- How many signatures are required vs. how many are provided?
- How does the system handle partial signature verification?
- What happens when signature thresholds aren't met?

### Task 4: Security Mechanisms (Bonus Challenge)
**Objective**: Identify anti-fraud measures

**Security Analysis**:
- How does the network prevent signature reuse (replay attacks)?
- What mechanisms detect forged signatures?
- How are sequence numbers used in signature validation?

**Advanced Challenge**:
- Design a modification to support post-quantum signature schemes
- Consider backward compatibility and migration strategies
- Identify performance implications

## 🔧 Investigation Starting Points

### Core Files to Examine
```
src/ripple/app/tx/impl/Transactor.cpp     # Transaction processing entry point
src/ripple/protocol/STTx.cpp              # Transaction structure and validation
src/ripple/protocol/PublicKey.h           # Public key handling
src/ripple/protocol/SecretKey.h           # Sign & Verify handling
```

### Key Functions to Trace
```cpp
// Starting points for investigation
Transactor::apply()           // Main transaction processing
STTx::checkSign()            // Signature verification
Transactor::checkSign()      // Permissions verification (RegularKey, SignerList)
checkValidity()              // Transaction and signature validity
verify()                     // Core crypto verification
```

## 📝 Deliverables

### Required Output
Create a **technical write-up** (GitHub issue style) that includes:

1. **Signature Verification Pipeline**
   - Function call flow diagram
   - Key decision points
   - Error handling paths

2. **Cryptographic Methods Analysis**
   - Supported signature schemes
   - Algorithm selection logic
   - Performance characteristics

3. **Public Key Validation Process**
   - Key retrieval mechanism
   - Validation steps
   - Storage and caching

4. **Multi-Signature Implementation**
   - Architecture overview
   - Verification differences
   - Threshold handling

5. **Security Measures**
   - Anti-replay mechanisms
   - Forgery detection
   - Sequence number validation