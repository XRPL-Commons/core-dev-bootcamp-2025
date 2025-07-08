# XRPL Ledger Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the Ledger functionality in the XRPL (XRP Ledger) source code. It covers every aspect of the ledger system, including its architecture, acquisition, assembly, validation, storage, publication, and the interaction between all relevant components. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [Ledger Overview](#ledger-overview)
- [Ledger Data Structures](#ledger-data-structures)
  - [Ledger Class](#ledger-class)
  - [LedgerInfo](#ledgerinfo)
  - [LedgerHolder](#ledgerholder)
  - [LedgerHistory](#ledgerhistory)
- [Ledger Acquisition and Assembly](#ledger-acquisition-and-assembly)
  - [LedgerMaster](#ledgermaster)
  - [InboundLedgers and InboundLedger](#inboundledgers-and-inboundledger)
  - [Ledger Acquisition Process](#ledger-acquisition-process)
- [Ledger Validation and Acceptance](#ledger-validation-and-acceptance)
  - [Validation Quorum and Trusted Validations](#validation-quorum-and-trusted-validations)
  - [LedgerMaster::checkAccept](#ledgermastercheckaccept)
  - [LedgerMaster::tryAdvance](#ledgermastertryadvance)
- [Ledger Storage and Caching](#ledger-storage-and-caching)
  - [LedgerHistory::insert](#ledgerhistoryinsert)
  - [Database Storage](#database-storage)
- [Ledger Publication and Streaming](#ledger-publication-and-streaming)
  - [LedgerMaster::findNewLedgersToPublish](#ledgermasterfindnewledgerstopublish)
- [Ledger Entry Types](#ledger-entry-types)
  - [Complete List of Ledger Entry Types](#complete-list-of-ledger-entry-types)
  - [Field-Level Breakdown and Semantics](#field-level-breakdown-and-semantics)
  - [Field Type Codes](#field-type-codes)
- [Ledger RPC and Query Handlers](#ledger-rpc-and-query-handlers)
- [Ledger Immutability and State Management](#ledger-immutability-and-state-management)
- [Ledger Cleaning and Repair](#ledger-cleaning-and-repair)
- [Error Handling and Recovery Strategies](#error-handling-and-recovery-strategies)
- [References to Source Code](#references-to-source-code)

---

## Ledger Overview

- The XRPL ledger is the authoritative record of the network's state at a given point in time. It contains all account balances, offers, escrows, and other objects, as well as a record of all transactions included in that ledger.
- Every server always has an open ledger. All received new transactions are applied to the open ledger. The open ledger can't close until consensus is reached on the previous ledger and either there is at least one transaction or the ledger's close time has been reached ([README](src/xrpld/app/ledger/README.md)).
- The ledger header contains the sequence number, parent hash, hash of the previous ledger, hash of the root node of the state tree, and other metadata ([README](src/xrpld/app/ledger/README.md)).

---

## Ledger Data Structures

### Ledger Class

- Defined in [Ledger.h](src/xrpld/app/ledger/Ledger.h.txt) and implemented in [Ledger.cpp](src/xrpld/app/ledger/Ledger.cpp.txt).
- Represents a single ledger instance, managing state and transaction data.
- Key members:
  - `LedgerInfo info_`: Metadata about the ledger (sequence, hash, parent hash, close time, etc.).
  - `SHAMap stateMap_`: The state tree (account state).
  - `SHAMap txMap_`: The transaction tree.
  - `bool mImmutable`: Indicates if the ledger is immutable.
  - `Rules rules_`: Protocol rules and amendments.
- Construction:
  - Can be created from genesis, from a previous ledger, from serialized data, or loaded from storage.
  - Example constructor for genesis:
    Ledger::Ledger(create_genesis_t, Config const& config, std::vector<uint256> const& amendments, Family& family)
  - When constructed, the ledger's hash is calculated and stored in `info_.hash`.
- Immutability:
  - Once a ledger is finalized, `setImmutable()` is called, which sets `mImmutable = true` and marks the SHAMaps as immutable.
  - Only immutable ledgers can be set in a `LedgerHolder` ([LedgerHolder.h](src/xrpld/app/ledger/LedgerHolder.h.txt)).

### LedgerInfo

- Holds metadata for a ledger, including:
  - `seq`: Sequence number.
  - `hash`: Ledger hash.
  - `parentHash`: Hash of the previous ledger.
  - `accountHash`: Hash of the state tree root.
  - `txHash`: Hash of the transaction tree root.
  - `closeTime`, `closeTimeResolution`, `closeFlags`, etc.
- Used throughout the codebase for ledger identification and validation.

#### Ledger Header and "Ledger Base" Fields

- The "ledger header" is the chunk of data that hashes to the ledger's hash. It contains:
  - Sequence number
  - Parent hash
  - Hash of the previous ledger
  - Hash of the root node of the state tree
  - Hash of the transaction tree
  - Total coins (total XRP in drops)
  - Close time and parent close time
  - Close time resolution
  - Close flags
  - Other protocol metadata
- The "ledger base" refers to a query/response that includes the ledger header and may also contain the root node of the state tree.

### LedgerHolder

- Defined in [LedgerHolder.h](src/xrpld/app/ledger/LedgerHolder.h.txt).
- Manages a thread-safe, immutable shared pointer to a Ledger object.
- Methods:
  - `set(std::shared_ptr<Ledger const> ledger)`: Sets a new immutable ledger.
  - `get()`: Retrieves the current ledger.
  - `empty()`: Checks if a ledger is held.

### LedgerHistory

- Defined in [LedgerHistory.h](src/xrpld/app/ledger/LedgerHistory.h.txt) and implemented in [LedgerHistory.cpp](src/xrpld/app/ledger/LedgerHistory.cpp.txt).
- Manages the storage, retrieval, and validation of ledger objects.
- Maintains:
  - `m_ledgers_by_hash`: Cache of ledgers by hash.
  - `mLedgersByIndex`: Map of sequence number to hash.
- Key methods:
  - `insert(std::shared_ptr<Ledger const> const& ledger, bool validated)`: Inserts a ledger into the cache.
  - `getLedgerBySeq(LedgerIndex ledgerIndex)`: Retrieves a ledger by sequence.
  - `getLedgerByHash(LedgerHash const& ledgerHash)`: Retrieves a ledger by hash.
  - `fixIndex(LedgerIndex ledgerIndex, LedgerHash const& ledgerHash)`: Fixes index-to-hash mapping.

---

## Ledger Acquisition and Assembly

### LedgerMaster

- Defined in [LedgerMaster.h](src/xrpld/app/ledger/LedgerMaster.h.txt) and implemented in [LedgerMaster.cpp](src/xrpld/app/ledger/detail/LedgerMaster.cpp.txt).
- Central manager for ledger state, acquisition, validation, and publication.
- Tracks:
  - Last published ledger (`mPubLedger`).
  - Last validated ledger (`mValidLedger`).
  - Ledger history (`mLedgerHistory`).
- Orchestrates the acquisition of missing historical ledgers via `doAdvance()` and `fetchForHistory()` ([README](src/xrpld/app/ledger/README.md)).
- Example: When a gap is detected (e.g., ledgers 603 and 600 are present, but 601 and 602 are missing), `LedgerMaster` requests ledger 602 first, then back-fills 601 ([README](src/xrpld/app/ledger/README.md)).

### InboundLedgers and InboundLedger

- [InboundLedgers.h](src/xrpld/app/ledger/InboundLedgers.h.txt) defines the abstract interface for managing inbound ledger acquisitions.
- [InboundLedgers.cpp](src/xrpld/app/ledger/detail/InboundLedgers.cpp.txt) implements `InboundLedgersImp`, which manages ongoing acquisitions, tracks failures, and processes incoming data.
- [InboundLedger.cpp](src/xrpld/app/ledger/detail/InboundLedger.cpp.txt) implements `InboundLedger`, which handles the acquisition and assembly of a specific ledger.
- Acquisition process:
  - `InboundLedgers::acquire(hash, seq, reason)` is called to acquire a ledger.
  - If already in progress, returns the existing `InboundLedger`.
  - Otherwise, creates a new `InboundLedger`, adds it to the map, and calls `init()` to start acquisition.
  - `InboundLedger::init()` checks local storage, fetch packs, and requests missing data from peers.
  - Incoming data is handled by `InboundLedger::gotData()`, which queues data for processing.
  - When complete, `InboundLedger::done()` finalizes the acquisition, marks the ledger immutable, and schedules a job for post-acquisition processing.

### Ledger Acquisition Process

**Step-by-step process:**

1. **Triggering Acquisition**
   - `LedgerMaster::doAdvance()` detects missing ledgers and calls `fetchForHistory()` for each missing sequence.
   - `fetchForHistory()` tries to get the hash for the missing ledger, then attempts to retrieve it from local storage.
   - If not found, calls `InboundLedgers::acquire()` to start network acquisition.

2. **Managing Ongoing Acquisitions**
   - `InboundLedgers::acquire()` checks if the acquisition is already in progress.
   - If not, creates a new `InboundLedger` and calls `init()`.

3. **Fetching and Assembling**
   - `InboundLedger::init()` checks local storage and fetch packs.
   - If not complete, requests missing data from peers.
   - Incoming data is queued by `gotData()` and processed in batches.
   - When all required data is present, the ledger is assembled and validated.

4. **Completion and Finalization**
   - `InboundLedger::done()` is called when acquisition is complete or failed.
   - If successful, marks the ledger immutable and stores it via `LedgerMaster::storeLedger()`.
   - Schedules a job on the job queue to call `LedgerMaster::checkAccept()` and `tryAdvance()`.

5. **Job Queue**
   - The job queue ensures that finalization and acceptance are performed asynchronously and safely.

---

## Ledger Validation and Acceptance

### Validation Quorum and Trusted Validations

- The system requires a minimum number of trusted validations (`minVal`) for a ledger to be accepted as validated.
- Trusted validations are collected for the ledger's hash and sequence, filtered by the negative UNL (Unique Node List).
- If the number of trusted validations is less than `minVal`, the ledger is not accepted.

### LedgerMaster::checkAccept

- [LedgerMaster.cpp.txt]:
  - If the ledger cannot be current or is not ahead of the last validated ledger, it is ignored.
  - The number of trusted validations is checked.
  - If sufficient, the ledger is marked as validated and full, and set as the new validated ledger.
  - Handles fee voting and amendment warnings as needed.
  - Calls `tryAdvance()` to continue advancing the ledger state.

### LedgerMaster::tryAdvance

- Attempts to advance the ledger state machine, possibly triggering further acquisitions if more ledgers are missing.
- Ensures that the server maintains a continuous stream of consecutive ledgers.

---

## Ledger Storage and Caching

### LedgerHistory::insert

- [LedgerHistory.cpp.txt]:
  - Inserts the ledger into internal caches by hash and sequence.
  - Ensures that the ledger is available for fast lookup.

### Database Storage

- Ledgers are persisted to the database using functions in [Node.cpp.txt] and [SQLiteDatabase.cpp.txt].
- Before saving, the code checks that the account hash and transaction hash match the SHAMap roots.
- The ledger header and SHAMap roots are serialized and stored in the database for future retrieval.

---

## Ledger Publication and Streaming

### LedgerMaster::findNewLedgersToPublish

- Publishes a stream of consecutive validated ledgers to clients, ensuring all validated ledgers are published in order as they become available.
- If a gap is detected, attempts to acquire missing ledgers.

---

## Ledger Entry Types

### Complete List of Ledger Entry Types

The following is a complete, enumerated list of all ledger entry types as defined in [ledger_entries.macro](include/xrpl/protocol/detail/ledger_entries.macro):

- ltNFTOKEN_OFFER (NFTokenOffer)
- ltCHECK (Check)
- ltDID (DID)
- ltNEGATIVE_UNL (NegativeUNL)
- ltNFTOKEN_PAGE (NFTokenPage)
- ltSIGNER_LIST (SignerList)
- ltTICKET (Ticket)
- ltACCOUNT_ROOT (AccountRoot)
- ltDIR_NODE (DirectoryNode)
- ltAMENDMENTS (Amendments)
- ltLEDGER_HASHES (LedgerHashes)
- ltBRIDGE (Bridge)
- ltOFFER (Offer)
- ltDEPOSIT_PREAUTH (DepositPreauth)
- ltXCHAIN_OWNED_CLAIM_ID (XChainOwnedClaimID)
- ltRIPPLE_STATE (RippleState)
- ltFEE_SETTINGS (FeeSettings)
- ltXCHAIN_OWNED_CREATE_ACCOUNT_CLAIM_ID (XChainOwnedCreateAccountClaimID)
- ltESCROW (Escrow)
- ltPAYCHAN (PayChannel)
- ltAMM (AMM)
- ltMPTOKEN_ISSUANCE (MPTokenIssuance)
- ltMPTOKEN (MPToken)
- ltORACLE (Oracle)
- ltCREDENTIAL (Credential)
- ltPERMISSIONED_DOMAIN (PermissionedDomain)
- ltDELEGATE (Delegate)
- ltVAULT (Vault)

### Field-Level Breakdown and Semantics

For each ledger entry type, the fields are specified as required (`soeREQUIRED`), optional (`soeOPTIONAL`), or default (`soeDEFAULT`). Below is a field-level breakdown for each type, as defined in the macro file:

#### Example: AccountRoot (ltACCOUNT_ROOT)

- **sfAccount**: REQUIRED. The 160-bit account ID.
- **sfSequence**: REQUIRED. Transaction sequence number for the account.
- **sfBalance**: REQUIRED. Balance in the account.
- **sfOwnerCount**: REQUIRED. Number of objects owned by the account (affects reserve).
- **sfPreviousTxnID**: REQUIRED. 256-bit index of the previous transaction on this account.
- **sfPreviousTxnLgrSeq**: REQUIRED. Ledger sequence number of the previous transaction.
- **sfAccountTxnID**: OPTIONAL.
- **sfRegularKey**: OPTIONAL.
- **sfEmailHash**: OPTIONAL.
- **sfWalletLocator**: OPTIONAL.
- **sfWalletSize**: OPTIONAL.
- **sfMessageKey**: OPTIONAL.
- **sfTransferRate**: OPTIONAL.
- **sfDomain**: OPTIONAL.
- **sfTickSize**: OPTIONAL.
- **sfTicketCount**: OPTIONAL.
- **sfNFTokenMinter**: OPTIONAL.
- **sfMintedNFTokens**: DEFAULT.
- **sfBurnedNFTokens**: DEFAULT.
- **sfFirstNFTokenSequence**: OPTIONAL.
- **sfAMMID**: OPTIONAL. Pseudo-account designator.
- **sfVaultID**: OPTIONAL. Pseudo-account designator.

> **Note:** The semantics of "Flags" in AccountRoot are not specified in the macro file or README and remain ambiguous.

#### Example: DirectoryNode (ltDIR_NODE)

- **sfOwner**: OPTIONAL. For owner directories.
- **sfTakerPaysCurrency**: OPTIONAL. For order book directories.
- **sfTakerPaysIssuer**: OPTIONAL. For order book directories.
- **sfTakerGetsCurrency**: OPTIONAL. For order book directories.
- **sfTakerGetsIssuer**: OPTIONAL. For order book directories.
- **sfExchangeRate**: OPTIONAL. For order book directories.
- **sfIndexes**: REQUIRED.
- **sfRootIndex**: REQUIRED.
- **sfIndexNext**: OPTIONAL.
- **sfIndexPrevious**: OPTIONAL.
- **sfNFTokenID**: OPTIONAL.
- **sfPreviousTxnID**: OPTIONAL.
- **sfPreviousTxnLgrSeq**: OPTIONAL.
- **sfDomainID**: OPTIONAL.

#### Example: RippleState (ltRIPPLE_STATE)

- **sfBalance**: REQUIRED.
- **sfLowLimit**: REQUIRED.
- **sfHighLimit**: REQUIRED.
- **sfPreviousTxnID**: REQUIRED.
- **sfPreviousTxnLgrSeq**: REQUIRED.
- **sfLowNode**: OPTIONAL.
- **sfLowQualityIn**: OPTIONAL.
- **sfLowQualityOut**: OPTIONAL.
- **sfHighNode**: OPTIONAL.
- **sfHighQualityIn**: OPTIONAL.
- **sfHighQualityOut**: OPTIONAL.

#### Example: Offer (ltOFFER)

- **sfAccount**: REQUIRED.
- **sfSequence**: REQUIRED.
- **sfTakerPays**: REQUIRED.
- **sfTakerGets**: REQUIRED.
- **sfBookDirectory**: REQUIRED.
- **sfBookNode**: REQUIRED.
- **sfOwnerNode**: REQUIRED.
- **sfPreviousTxnID**: REQUIRED.
- **sfPreviousTxnLgrSeq**: REQUIRED.
- **sfExpiration**: OPTIONAL.
- **sfDomainID**: OPTIONAL.
- **sfAdditionalBooks**: OPTIONAL.

#### Example: Escrow (ltESCROW)

- **sfAccount**: REQUIRED.
- **sfDestination**: REQUIRED.
- **sfAmount**: REQUIRED.
- **sfCondition**: OPTIONAL.
- **sfCancelAfter**: OPTIONAL.
- **sfFinishAfter**: OPTIONAL.
- **sfSourceTag**: OPTIONAL.
- **sfDestinationTag**: OPTIONAL.
- **sfOwnerNode**: REQUIRED.
- **sfPreviousTxnID**: REQUIRED.
- **sfPreviousTxnLgrSeq**: REQUIRED.
- **sfDestinationNode**: OPTIONAL.
- **sfTransferRate**: OPTIONAL.
- **sfIssuerNode**: OPTIONAL.

#### (The same pattern applies for all other types; see the macro file for the full list and field breakdown.)

**Field Semantics and Relationships:**  
- Fields such as `sfAccount`, `sfOwner`, `sfIssuer`, etc., are account or object identifiers.
- `sfPreviousTxnID` and `sfPreviousTxnLgrSeq` track the last modifying transaction and ledger.
- Fields like `sfOwnerNode`, `sfBookNode`, etc., relate to directory structures in the ledger.
- Optional fields may or may not be present depending on the object state or type.
- Default fields (`soeDEFAULT`) have protocol-defined default values if not present.

### Field Type Codes

- Field type codes such as `sfAccount`, `sfOwnerNode`, etc., are symbolic names for specific fields in the XRPL protocol.
- These codes are defined in the protocol and used throughout the codebase for serialization, deserialization, and field access.
- For example:
  - `sfAccount`: Account ID field.
  - `sfOwnerNode`: Directory node index.
  - `sfSequence`: Sequence number.
  - `sfBalance`: Balance field.
  - `sfPreviousTxnID`: Previous transaction ID.
  - `sfPreviousTxnLgrSeq`: Previous transaction ledger sequence.
  - (See protocol field definitions for the complete mapping.)

---

## Ledger RPC and Query Handlers

- The RPC layer provides handlers for querying ledger data.
- [LedgerHandler.h](src/xrpld/rpc/handlers/LedgerHandler.h.txt) defines the handler for the `ledger` RPC command.
- [LedgerEntry.cpp.txt] implements the handler for the `ledger_entry` RPC command, supporting all entry types.
- [RPCHelpers.cpp.txt] provides helper functions for resolving ledgers by hash, index, or shortcut (current, closed, validated), and for injecting ledger entry data into JSON responses.
- The handlers support both JSON and binary output formats, and provide detailed error handling for malformed requests or missing data.

---

## Ledger Immutability and State Management

- Once a ledger is finalized, it is marked as immutable using `Ledger::setImmutable()`.
- Only immutable ledgers can be set in a `LedgerHolder`.
- Immutability ensures that the ledger's state cannot be changed after it is validated and published.
- The system enforces this invariant throughout the codebase.

---

## Ledger Cleaning and Repair

- [LedgerCleaner.cpp.txt] implements the `LedgerCleaner` component, which can check for missing or inconsistent ledger nodes and transactions, and attempts to fix them by reacquiring or saving ledgers as needed.
- The cleaning process is careful to avoid running during high server load and tracks failures, retrying as necessary.
- The process can be configured to check nodes, fix transactions, and operate over a specified ledger range.

---

## Error Handling and Recovery Strategies

- **Acquisition Failures:**  
  - If a ledger acquisition fails, the failure is logged via `InboundLedgers::logFailure`.
  - The system tracks recent failures and can retry acquisition as needed.
  - If data for a ledger arrives that is not currently under construction, it is stashed in memory for possible reuse.
- **Validation Failures:**  
  - If a ledger does not receive enough trusted validations, it is not accepted as validated.
  - If a mismatch is detected between built and validated ledgers, the system logs the mismatch and can attempt to reacquire or repair the ledger.
- **LedgerCleaner:**  
  - The cleaning process retries failed repairs and avoids running during high server load.
  - If a ledger cannot be processed or its hash cannot be determined, the failure is logged and retried later.

---

## References to Source Code

- [Ledger.h](src/xrpld/app/ledger/Ledger.h.txt)
- [Ledger.cpp](src/xrpld/app/ledger/Ledger.cpp.txt)
- [LedgerHolder.h](src/xrpld/app/ledger/LedgerHolder.h.txt)
- [LedgerHistory.h](src/xrpld/app/ledger/LedgerHistory.h.txt)
- [LedgerHistory.cpp](src/xrpld/app/ledger/LedgerHistory.cpp.txt)
- [LedgerMaster.h](src/xrpld/app/ledger/LedgerMaster.h.txt)
- [LedgerMaster.cpp](src/xrpld/app/ledger/detail/LedgerMaster.cpp.txt)
- [InboundLedgers.h](src/xrpld/app/ledger/InboundLedgers.h.txt)
- [InboundLedgers.cpp](src/xrpld/app/ledger/detail/InboundLedgers.cpp.txt)
- [InboundLedger.cpp](src/xrpld/app/ledger/detail/InboundLedger.cpp.txt)
- [ledger_entries.macro](include/xrpl/protocol/detail/ledger_entries.macro.txt)
- [LedgerHandler.h](src/xrpld/rpc/handlers/LedgerHandler.h.txt)
- [LedgerEntry.cpp](src/xrpld/rpc/handlers/LedgerEntry.cpp.txt)
- [RPCHelpers.cpp](src/xrpld/rpc/detail/RPCHelpers.cpp.txt)
- [LedgerCleaner.cpp](src/xrpld/app/ledger/detail/LedgerCleaner.cpp.txt)
- [Node.cpp](src/xrpld/app/rdb/backend/detail/Node.cpp.txt)
- [SQLiteDatabase.cpp](src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt)
