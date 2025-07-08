# 🎓 "Walk a Ledger in My Shoes" Workshop: Transaction Journey Through Ripple Consensus - Answer Key

## Phase 1: Network Entry - Implementation Details

**Your Role:** You're a new transaction just submitted to a `rippled` server

### Key Implementation Files:
- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/overlay/detail/PeerImp.cpp`
- **Function**: `onMessage()` and `handleTransaction()`
- **Lines**: ~1200-1300

```cpp
void PeerImp::onMessage(std::shared_ptr<protocol::TMTransaction> const& m)
{
    handleTransaction(m, true, false);
}

void PeerImp::handleTransaction(
    std::shared_ptr<protocol::TMTransaction> const& m,
    bool eraseTxQueue,
    bool batch)
```

**What to Look For:**
- Connection handshaking in `PeerImp` constructor
- Peer protocol validation in `handleTransaction()`
- Transaction deserialization: `SerialIter sit(makeSlice(m->rawtransaction()));`
- Basic format validation before processing

**Could Go Wrong:**
- Invalid format caught in `SerialIter` parsing
- Network connectivity issues in overlay network
- Insufficient fees rejected early

---

## Phase 2: Open Ledger Application - Implementation Details

**Your Role:** You're now in the server's open ledger awaiting consensus

### Key Implementation Files:
- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/ledger/OpenLedger.cpp`
- **Function**: `apply_one()` and `modify()`
- **Lines**: ~200-300

```cpp
auto OpenLedger::apply_one(
    Application& app,
    OpenView& view,
    std::shared_ptr<STTx const> const& tx,
    bool retryAssured,
    ApplyFlags flags,
    beast::Journal j) -> std::pair<TER, bool>
```

- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/TxQ.cpp`
- **Function**: `apply()` and `canBeHeld()`
- **Lines**: ~400-500

**What to Look For:**
- Transaction queue mechanics in `TxQ::apply()`
- Fee escalation logic in fee calculation functions
- Balance checking before application
- Queue capacity management

**Could Go Wrong:**
- Insufficient funds detected in balance checks
- Queue rejection due to capacity limits
- Conflicting transactions in same ledger

---

## Phase 3: Consensus Proposal - Implementation Details

**Your Role:** You're part of an initial proposal when the ledger closes

### Key Implementation Files:
- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.cpp`
- **Function**: `timerEntry()` and proposal creation
- **Lines**: ~800-900

```cpp
void RCLConsensus::timerEntry(NetClock::time_point const& now)
```

- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.ipp`
- **Function**: `startRound()`
- **Lines**: ~400-500

**What to Look For:**
- Validator behavior in `RCLConsensus::Adaptor`
- Proposal broadcasting through overlay network
- Transaction set creation and canonicalization
- Initial position generation

**Could Go Wrong:**
- Validators exclude you due to different ledger states
- Network partitions affecting proposal distribution
- Timing issues in consensus rounds

---

## Phase 4: Consensus Rounds - Implementation Details

**Your Role:** You're being negotiated through multiple consensus rounds

### Key Implementation Files:
- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.ipp`
- **Function**: `updateOurPositions()` and `haveConsensus()`
- **Lines**: ~600-700

```cpp
template<class Adaptor>
void Consensus<Adaptor>::updateOurPositions(
    NetClock::time_point const& now)
```

- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NetworkOPs.cpp`
- **Function**: `processTrustedProposal()`
- **Lines**: ~1800-1900

**What to Look For:**
- Trust lines between validators in `ValidatorList`
- Proposal modifications during consensus rounds
- Dispute resolution mechanisms
- Convergence checking algorithms

**Could Go Wrong:**
- Network partitions preventing consensus
- Validator disagreements on transaction set
- Trust relationship failures affecting proposals

---

## Phase 5: Final Validation - Implementation Details

**Your Role:** You're in the final accepted transaction set

### Key Implementation Files:
- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/ledger/BuildLedger.cpp`
- **Function**: `buildLedger()`
- **Lines**: ~100-200

```cpp
std::shared_ptr<Ledger> buildLedger(
    std::shared_ptr<Ledger const> const& parent,
    NetClock::time_point closeTime,
    const bool closeTimeCorrect,
    NetClock::duration closeResolution,
    Application& app,
    beast::Journal j,
    CanonicalTXSet& retriableTxs)
```

- **File**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLValidations.cpp`
- **Function**: `doValidation()`
- **Lines**: ~200-300

**What to Look For:**
- Ledger header creation with hash calculations
- State tree updates in ledger construction
- Final cryptographic validation signatures
- Validation broadcasting to network

**Could Go Wrong:**
- Last-minute validation failures during apply
- Ledger construction errors in state tree
- Hash calculation mismatches

---

## Key Reference Points for Code Exploration

### Network Layer Functions:
- **Overlay Network**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/overlay/detail/PeerImp.cpp`
- **Peer Protocol**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/overlay/README.md` (documentation)
- **Connection Management**: `PeerImp` constructor and message handlers

### Consensus Layer Functions:
- **Validator Trust**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/ValidatorList.cpp`
- **Proposal Mechanisms**: `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.ipp`
- **Trust Relationships**: `NetworkOPs::processTrustedProposal()`

### Validation Points:
- **Transaction Format**: `STTx` deserialization in `PeerImp::handleTransaction()`
- **Account States**: Balance and sequence checking in transaction apply functions
- **Cryptographic Signatures**: Validation creation in `RCLValidations::doValidation()`

### Transaction Apply Chain:
1. `NetworkOPs::processTransaction()` - Entry point
2. `TxQ::apply()` - Queue management  
3. `OpenLedger::apply_one()` - Open ledger application
4. `apply()` in `https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/apply.cpp` - Core apply logic
5. Transaction-specific `doApply()` methods (Payment, Offer, etc.)

### Status Tracking:
- **Tentative**: In open ledger, not yet in consensus
- **Proposed**: Part of consensus proposal set
- **Accepted**: Agreed upon by consensus
- **Validated**: Permanently recorded in closed ledger