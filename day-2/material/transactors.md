---

# XRPL Transactors Functionality and Architecture: Comprehensive Lesson Plan (Revised)

This document provides a detailed, code-based breakdown of the Transactor system in the XRPL (XRP Ledger) source code. It covers every aspect of Transactors, including their architecture, transaction lifecycle, validation, application, fee and sequence management, signature and permission checks, extensibility for transaction types, and now also includes batch transaction handling, transaction queueing/blocker transactions, the consequences factory, the preflight validation pipeline, and a comprehensive list of transaction types. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [Transactor Overview](#transactor-overview)
- [Transactor Class Architecture](#transactor-class-architecture)
  - [Core Members and Construction](#core-members-and-construction)
  - [Lifecycle Methods](#lifecycle-methods)
- [Transaction Lifecycle: Orchestration](#transaction-lifecycle-orchestration)
  - [Preflight and Preclaim](#preflight-and-preclaim)
  - [Preflight Validation Pipeline](#preflight-validation-pipeline)
  - [Transactor::operator()()](#transactoroperator)
  - [Invariant Checks and Metadata](#invariant-checks-and-metadata)
- [Transaction Application: apply() and doApply()](#transaction-application-apply-and-doapply)
  - [Transactor::apply](#transactorapply)
  - [Transactor::doApply](#transactordoapply)
- [Pre-Application Checks](#pre-application-checks)
  - [Sequence and Ticket Checks](#sequence-and-ticket-checks)
    - [Transactor::checkSeqProxy](#transactorcheckseqproxy)
    - [Transactor::consumeSeqProxy](#transactorconsumeseqproxy)
  - [Prior Transaction and Last Ledger Checks](#prior-transaction-and-last-ledger-checks)
    - [Transactor::checkPriorTxAndLastLedger](#transactorcheckpriortxandlastledger)
  - [Fee Calculation and Validation](#fee-calculation-and-validation)
    - [Transactor::calculateBaseFee](#transactorcalculatebasefee)
    - [Transactor::minimumFee](#transactorminimumfee)
    - [Transactor::checkFee](#transactorcheckfee)
    - [Transactor::payFee](#transactorpayfee)
- [Signature and Permission Checks](#signature-and-permission-checks)
  - [Transactor::checkSign](#transactorchecksign)
  - [Transactor::checkBatchSign](#transactorcheckbatchsign)
  - [Transactor::checkSingleSign](#transactorchecksinglesign)
  - [Transactor::checkMultiSign](#transactorcheckmultisign)
  - [Transactor::checkPermission](#transactorcheckpermission)
- [Fee Deduction and Account State Reset](#fee-deduction-and-account-state-reset)
  - [Transactor::reset](#transactorreset)
- [Ticket Deletion](#ticket-deletion)
  - [Transactor::ticketDelete](#transactorticketdelete)
- [Batch Transaction Handling](#batch-transaction-handling)
- [Transaction Queueing and Blocker Transactions](#transaction-queueing-and-blocker-transactions)
- [Consequences Factory and makeTxConsequences](#consequences-factory-and-maketxconsequences)
- [trapTransaction Method](#traptransaction-method)
- [Extensibility: Derived Transaction Types](#extensibility-derived-transaction-types)
- [Comprehensive List of Transaction Types](#comprehensive-list-of-transaction-types)
- [References to Source Code](#references-to-source-code)

---

## Transactor Overview

- The `Transactor` class is the base class for all transaction types in the XRPL server ([Transactor.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.h)).
- It encapsulates the logic for applying a transaction to the ledger, including validation, fee deduction, sequence/ticket management, signature and permission checks, and the orchestration of transaction-specific logic via the `doApply()` method.
- All transaction types (e.g., Payment, OfferCreate, EscrowCreate, etc.) inherit from `Transactor` and implement their own `doApply()`.

---

## Transactor Class Architecture

### Core Members and Construction

- **Members** ([Transactor.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.h)):
  - `ApplyContext& ctx_`: The context for transaction application, including the transaction, ledger view, flags, etc.
  - `beast::Journal const j_`: Logging facility.
  - `AccountID const account_`: The account submitting the transaction.
  - `XRPAmount mPriorBalance`: The account's balance before the transaction.
  - `XRPAmount mSourceBalance`: The account's balance after fee deduction.

- **Construction**:
  - The constructor is protected and takes an `ApplyContext&`.
  - Copy and assignment are deleted to enforce correct usage.

### Lifecycle Methods

- **operator()()**: Orchestrates the full transaction lifecycle ([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp)).
- **apply()**: Applies the transaction to the ledger, handling generic steps before delegating to `doApply()`.
- **doApply()**: Pure virtual; implemented by derived classes for transaction-specific logic.
- **preCompute()**: Virtual; can be overridden for pre-application computation.
- **reset()**: Handles fee deduction and state reset in error cases.

---

## Transaction Lifecycle: Orchestration

### Preflight and Preclaim

- **Preflight** and **Preclaim** are two distinct validation steps performed before a transaction is applied to the ledger. They are implemented as static methods on each transaction type and orchestrated in the transaction processing pipeline.

#### Preflight

- **Purpose**: Performs stateless and context-free checks on the transaction, such as field presence, type correctness, and basic invariants.
- **Where Called**: The preflight step is invoked before any ledger state is accessed, typically as the first step in transaction processing.
- **How Called**: The function `invoke_preflight(PreflightContext const& ctx)` in [applySteps.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/applySteps.cpp) dispatches to the static `preflight` method of the transaction type using the transaction's type field.
- **Steps**:
  - The transaction type is determined.
  - The corresponding transaction class's static `preflight` method is called with the `PreflightContext`.
  - The result is a `NotTEC` code indicating success or the specific error.
  - If successful, transaction consequences are calculated.

#### Preclaim

- **Purpose**: Performs contextual checks that require access to the current ledger state, such as account existence, balance, and reserve requirements.
- **Where Called**: The preclaim step is invoked after preflight, but before the transaction is actually applied to the ledger.
- **How Called**: The function `invoke_preclaim(PreclaimContext const& ctx)` in [applySteps.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/applySteps.cpp) dispatches to the static `preclaim` method of the transaction type.
- **Steps**:
  - The transaction type is determined.
  - The corresponding transaction class's static `preclaim` method is called with the `PreclaimContext`.
  - The result is a `TER` code indicating success or the specific error.
  - Preclaim may check for account existence, sufficient balance, reserve, and other ledger-dependent conditions.

#### Orchestration

- The transaction processing pipeline first calls preflight, then preclaim, and only if both succeed does it proceed to the main application logic (`Transactor::operator()()` and `apply()`).
- These steps are orchestrated in [applySteps.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/applySteps.cpp) and are required for all transaction types.

### Preflight Validation Pipeline

- The preflight process is further divided into three stages: `preflight0`, `preflight1`, and `preflight2` ([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp)):
  - **preflight0**: Initial stateless checks (e.g., transaction size, field presence).
  - **preflight1**: Additional stateless checks (e.g., flags, network ID).
  - **preflight2**: Signature and local validity checks.
- These functions are called in sequence as part of the preflight pipeline to ensure the transaction is well-formed and valid before any ledger state is accessed.

### Transactor::operator()()

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Logs the transaction application and sets up protocol rule guards.
- (Debug builds) Serializes and deserializes the transaction to check for equivalence.
- If the application is configured to "trap" a specific transaction ID and the current transaction matches, it calls `trapTransaction()`.
- Initializes the result code from the preclaim phase.
- If the transaction is a batch transaction and the batch feature is enabled, it performs special batch transaction checks.
- If the preclaim result is `tesSUCCESS`, it calls `apply()`, which:
  - Prepares the transaction (`preCompute`).
  - Looks up the account's ledger entry.
  - Records prior and source balances.
  - Consumes the sequence number or ticket.
  - Deducts the transaction fee.
  - Updates the account's transaction ID if present.
  - Calls the virtual `doApply()` for transaction-specific logic.
- After application, it checks protocol invariants. If an invariant fails, it attempts to reset and re-check.
- If the transaction was applied, it destroys the fee from the ledger (if not open) and generates transaction metadata.
- If the transaction was a dry run, it marks it as not applied.
- Logs the final result and returns an `ApplyResult` struct with the result code, applied flag, and metadata.

### Invariant Checks and Metadata

- After `apply()`, invariants are checked via `ctx_.checkInvariants(result, fee)`.
- If an invariant fails, `reset(fee)` is called to revert state and re-check invariants.
- If the transaction was applied, `ctx_.destroyXRP(fee)` is called (if not open) and metadata is generated via `ctx_.apply(result)`.

---

## Transaction Application: apply() and doApply()

### Transactor::apply

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Calls `preCompute()` to perform any necessary pre-computation.
- Retrieves the account's ledger entry (`SLE`) via `view().peek(keylet::account(account_))`.
- Asserts that the SLE is not null, unless the account is zero.
- If the account exists:
  - Sets `mPriorBalance` and `mSourceBalance` from the account's balance.
  - Calls `consumeSeqProxy(sle)` to consume the sequence number or ticket.
  - Calls `payFee()` to deduct the transaction fee.
  - If the account has the `sfAccountTxnID` field, updates it with the current transaction's ID.
  - Updates the SLE in the view.
- Calls `doApply()` to perform transaction-specific logic.

### Transactor::doApply

([Transactor.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.h))

- Pure virtual function: `virtual TER doApply() = 0;`
- Implemented by each derived transaction class (e.g., Payment, OfferCreate, EscrowCreate, etc.).
- Responsible for applying the transaction's specific effects to the ledger (e.g., moving funds, creating/modifying ledger objects, updating account state).
- Returns a `TER` code indicating success or the specific reason for failure.

---

## Pre-Application Checks

### Sequence and Ticket Checks

#### Transactor::checkSeqProxy

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Retrieves the account ID from the transaction's `sfAccount` field.
- Looks up the account's ledger entry in the provided ledger view.
- If the account does not exist, logs a message and returns `terNO_ACCOUNT`.
- Retrieves the transaction's sequence proxy (which can be a sequence number or a ticket) and the account's current sequence number (wrapped as a SeqProxy).
- (The rest of the function, not shown, would compare the transaction's sequence/ticket to the account's state and return a NotTEC code indicating whether the transaction's sequence proxy is valid.)

#### Transactor::consumeSeqProxy

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Asserts that the provided account SLE is not null.
- Retrieves the sequence proxy from the transaction context.
- If the sequence proxy is a sequence number:
  - Sets the account's `sfSequence` field to one greater than the current value.
  - Returns `tesSUCCESS`.
- If the sequence proxy is a ticket:
  - Calls `ticketDelete` to remove the ticket from the ledger.
  - Returns the result of `ticketDelete`.

### Prior Transaction and Last Ledger Checks

#### Transactor::checkPriorTxAndLastLedger

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Extracts the AccountID from the transaction's `sfAccount` field.
- Reads the account's ledger entry from the current ledger view.
- If the account does not exist, logs a trace message and returns `terNO_ACCOUNT`.
- If the transaction includes `sfAccountTxnID`, compares it to the account's current `sfAccountTxnID` in the ledger; if they do not match, returns `tefWRONG_PRIOR`.
- If the transaction includes `sfLastLedgerSequence`, checks if the current ledger sequence exceeds it; if so, returns `tefMAX_LEDGER`.
- If all checks pass, returns `tesSUCCESS`.

### Fee Calculation and Validation

#### Transactor::calculateBaseFee

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Retrieves the base fee from the ledger view: `view.fees().base`.
- Counts the number of signers in the transaction (`sfSigners` field).
- Returns `baseFee + (signerCount * baseFee)`.

#### Transactor::minimumFee

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Calls `scaleFeeLoad(baseFee, app.getFeeTrack(), fees, flags & tapUNLIMITED)`.
- Returns the minimum fee required for the transaction, after applying scaling for network load and privilege.

#### Transactor::checkFee

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Checks if the fee is native XRP; if not, returns `temBAD_FEE`.
- Retrieves the fee paid from the transaction.
- For batch transactions, the fee must be zero; otherwise, returns `temBAD_FEE`.
- Checks for legal fee amount (non-negative, legal value).
- If the ledger is open, calculates the minimum required fee and compares; if insufficient, returns `telINSUF_FEE_P`.
- If the fee paid is zero, returns `tesSUCCESS`.
- Determines the paying account (delegate or main account), and checks that it exists.
- Checks the account's balance is sufficient for the fee; if not, returns `tecINSUFF_FEE` or `terINSUF_FEE_B` as appropriate.
- Returns `tesSUCCESS` if all checks pass.

#### Transactor::payFee

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Retrieves the fee paid from the transaction.
- If the ledger is open, calculates the minimum required fee and compares; if insufficient, returns `telINSUF_FEE_P`.
- If the fee paid is zero, returns `tesSUCCESS`.
- Determines the paying account (delegate or main account), and checks that it exists.
- Retrieves the account's balance.
- If the balance is less than the fee, returns `tecINSUFF_FEE` or `terINSUF_FEE_B` as appropriate.
- Returns `tesSUCCESS` if all checks pass.

---

## Signature and Permission Checks

### Transactor::checkSign

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Retrieves the signing public key from the transaction.
- For batch inner transactions, ensures no signatures or signers are present; if present, returns `temINVALID_FLAG`.
- For dry run, if no signature or signers, returns `tesSUCCESS`.
- Determines the account to check (delegate or main account).
- If the transaction contains a `sfSigners` field (multi-signature), calls `checkMultiSign`.
- For single-signature, checks that the signing public key is valid and not empty, and calls `checkSingleSign`.

### Transactor::checkBatchSign

([Transactor.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.h), [Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Static method: `static NotTEC checkBatchSign(PreclaimContext const& ctx);`
- Used to validate batch signatures in the context of batch transactions.
- Ensures that the batch signers are valid and conform to protocol requirements.
- Returns a `NotTEC` code indicating success or the specific error encountered.

### Transactor::checkSingleSign

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Static method.
- Verifies the validity of a single-signature on a transaction.
- Checks that the signer is authorized, the signature matches the public key in the ledger entry, and protocol rules are followed.
- Returns a `NotTEC` code indicating success or the specific error encountered.

### Transactor::checkMultiSign

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Static method.
- Verifies the validity of a multi-signature on a transaction.
- Retrieves the account's signer list from the ledger.
- Deserializes the signer list.
- For each signer in the transaction, matches to the account's signer list, validates the signature, and accumulates weights.
- Ensures no duplicates and correct order.
- Checks if the total weight meets or exceeds the required quorum.
- Returns `tesSUCCESS` if all checks pass, or an appropriate error code otherwise.

### Transactor::checkPermission

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Checks if the transaction is permitted, especially for delegated transactions.
- If no delegate, returns `tesSUCCESS`.
- If a delegate is specified, constructs a delegate key and attempts to read the corresponding ledger entry.
- If the delegate ledger entry does not exist, returns `tecNO_DELEGATE_PERMISSION`.
- If the delegate ledger entry exists, calls `checkTxPermission(sle, tx)` to determine if the delegate has the necessary permission.

---

## Fee Deduction and Account State Reset

### Transactor::reset

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Discards any uncommitted changes in the transaction context.
- Fetches the transaction account's ledger entry; if not found, returns `tefINTERNAL`.
- Determines the payer account (delegate or transaction account); if not found, returns `tefINTERNAL`.
- Retrieves the payer's XRP balance.
- Asserts that the balance is valid.
- If the fee exceeds the balance, reduces the fee to the available balance.
- Deducts the fee from the payer's balance.
- Consumes the sequence proxy for the transaction account.
- Updates the ledger state for the affected accounts.
- Returns a pair of the result code and the actual fee charged.

---

## Ticket Deletion

### Transactor::ticketDelete

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Retrieves the Ticket ledger entry using its index.
- If not found, logs a fatal error and returns `tefBAD_LEDGER`.
- Removes the ticket from the owner's directory.
- **Issue in provided code:** Attempts to update `sfTicketCount` on the ticket SLE, but this field is on the account root SLE.
- **Correct logic:** Should retrieve the account root SLE, update `sfTicketCount`, decrement the owner count, update the account root SLE, and erase the ticket SLE.
- Erases the ticket SLE from the ledger.
- Returns `tesSUCCESS` if successful.

---

## Batch Transaction Handling

### ttBATCH Transaction Type

([transactions.macro](include/xrpl/protocol/detail/transactions.macro))

- **Type Code:** `ttBATCH` (71)
- **Fields:**
  - `sfRawTransactions` (required): The array of transactions to be batched.
  - `sfBatchSigners` (optional): Signers for the batch.

#### tapBATCH Flag

- The `tapBATCH` flag is referenced in the code as an `ApplyFlags` value indicating batch mode, but no explicit definition is present in the provided context.

#### Batch Application and Validation Logic

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp), [apply.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/apply.cpp))

- Batch transactions cannot contain more than 8 transactions.
- Duplicate transactions within a batch are not allowed.
- Nested batch transactions are not allowed.
- Batch transactions are validated and applied using special logic, including signature checks (`checkBatchSign`) and fee rules (batch fee must be zero).
- Batch application supports different modes (all-or-nothing, until-failure, only-one), as referenced in [apply.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/apply.cpp).

---

## Transaction Queueing and Blocker Transactions

### Transaction Queue (TxQ)

([TxQ.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/TxQ.cpp))

- The transaction queue (TxQ) manages transactions that cannot be immediately applied to the open ledger.
- TxQ handles queuing, prioritization, and eventual application or removal of transactions.
- The queue enforces per-account and global limits, supports transaction replacement with higher fees, and penalizes accounts for repeated failures.

### Blocker Transactions

([XChainBridge.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/XChainBridge.h), [applySteps.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/applySteps.cpp))

- The `ConsequencesFactoryType::Blocker` enum value is used to mark certain transaction types as "blocker" transactions.
- Blocker transactions interact with the queue by preventing other transactions from being queued for the same account until the blocker is processed.
- Example: `XChainClaim` and `SetSignerList` transactions are marked as blockers.

---

## Consequences Factory and makeTxConsequences

### ConsequencesFactoryType Enum

([Transactor.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.h))

- Enum: `enum ConsequencesFactoryType { Normal, Blocker, Custom };`
  - **Normal**: Standard consequence calculation.
  - **Blocker**: Transaction blocks other transactions in the queue.
  - **Custom**: Transaction provides its own consequence calculation.

### makeTxConsequences Static Method

([CreateOffer.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/CreateOffer.h), [XChainBridge.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/XChainBridge.h), [applySteps.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/applySteps.cpp))

- Some transaction types implement a static `makeTxConsequences(PreflightContext const& ctx)` method to provide custom consequence calculation.
- The transaction processing pipeline uses the `ConsequencesFactoryType` to determine how to calculate consequences:
  - If `Normal`, uses default.
  - If `Blocker`, marks as blocker.
  - If `Custom`, calls `makeTxConsequences`.

---

## trapTransaction Method

([Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp))

- Method: `void Transactor::trapTransaction(uint256 txHash) const`
- Used for debugging/trapping specific transactions.
- If the application is configured to "trap" a specific transaction ID and the current transaction matches, `trapTransaction()` is called during `operator()()`.

---

## Extensibility: Derived Transaction Types

- All transaction types inherit from `Transactor` and implement their own `doApply()` ([e.g., CreateOffer.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/CreateOffer.h), [Escrow.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Escrow.h), [PayChan.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/PayChan.h), [AMMCreate.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/AMMCreate.h), [XChainBridge.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/XChainBridge.h), [SetSignerList.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/SetSignerList.h), [DID.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/DID.h), [Credentials.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Credentials.h)).
- Each derived class provides static methods for preflight and preclaim checks, and implements `doApply()` for transaction-specific logic.
- The transaction type is mapped to its handler class via macros in [transactions.macro](include/xrpl/protocol/detail/transactions.macro).

---

## Comprehensive List of Transaction Types

The following table lists transaction types as defined in [transactions.macro](include/xrpl/protocol/detail/transactions.macro):

| Type Code | Name                        | Handler Class              | Description (if present)                                 |
|-----------|-----------------------------|---------------------------|----------------------------------------------------------|
| 0         | ttPAYMENT                   | Payment                   | Executes a payment                                       |
| 1         | ttESCROW_CREATE             | EscrowCreate              | Creates an escrow object                                 |
| 2         | ttESCROW_FINISH             | EscrowFinish              | Completes an existing escrow                             |
| 3         | ttACCOUNT_SET               | AccountSet                | Adjusts account settings                                 |
| 4         | ttESCROW_CANCEL             | EscrowCancel              | Cancels an existing escrow                               |
| 5         | ttREGULAR_KEY_SET           | SetRegularKey             | Sets or clears a regular key                             |
| 7         | ttOFFER_CREATE              | OfferCreate               | Creates an offer to trade assets                         |
| 8         | ttOFFER_CANCEL              | OfferCancel               | Cancels existing offers                                  |
| 10        | ttTICKET_CREATE             | TicketCreate              | Creates a new set of tickets                             |
| 12        | ttSIGNER_LIST_SET           | SignerListSet             | Modifies the signer list                                 |
| 13        | ttPAYCHAN_CREATE            | PaymentChannelCreate      | Creates a payment channel                                |
| 14        | ttPAYCHAN_FUND              | PaymentChannelFund        | Funds a payment channel                                  |
| 15        | ttPAYCHAN_CLAIM             | PaymentChannelClaim       | Submits a claim against a payment channel                |
| 16        | ttCHECK_CREATE              | CheckCreate               | Creates a new check                                      |
| 17        | ttCHECK_CASH                | CheckCash                 | Cashes an existing check                                 |
| 18        | ttCHECK_CANCEL              | CheckCancel               | Cancels an existing check                                |
| 19        | ttDEPOSIT_PREAUTH           | DepositPreauth            | Grants/revokes preauthorization                          |
| 20        | ttTRUST_SET                 | TrustSet                  | Modifies a trustline                                     |
| 21        | ttACCOUNT_DELETE            | AccountDelete             | Deletes an account                                       |
| 25        | ttNFTOKEN_MINT              | NFTokenMint               | Mints a new NFT                                          |
| 26        | ttNFTOKEN_BURN              | NFTokenBurn               | Burns an NFT                                             |
| 27        | ttNFTOKEN_CREATE_OFFER      | NFTokenCreateOffer        | Creates an NFT offer                                     |
| 28        | ttNFTOKEN_CANCEL_OFFER      | NFTokenCancelOffer        | Cancels an NFT offer                                     |
| 29        | ttNFTOKEN_ACCEPT_OFFER      | NFTokenAcceptOffer        | Accepts an NFT offer                                     |
| 30        | ttCLAWBACK                  | Clawback                  | Claws back issued tokens                                 |
| 31        | ttAMM_CLAWBACK              | AMMClawback               | Claws back tokens from an AMM pool                       |
| 35        | ttAMM_CREATE                | AMMCreate                 | Creates an AMM instance                                  |
| 36        | ttAMM_DEPOSIT               | AMMDeposit                | Deposits into an AMM instance                            |
| 37        | ttAMM_WITHDRAW              | AMMWithdraw               | Withdraws from an AMM instance                           |
| 38        | ttAMM_VOTE                  | AMMVote                   | Votes for the trading fee                                |
| 39        | ttAMM_BID                   | AMMBid                    | Bids for the auction slot                                |
| 40        | ttAMM_DELETE                | AMMDelete                 | Deletes AMM in the empty state                           |
| 41        | ttXCHAIN_CREATE_CLAIM_ID    | XChainCreateClaimID       | Creates a crosschain claim ID                            |
| 42        | ttXCHAIN_COMMIT             | XChainCommit              | Initiates a crosschain transaction                       |
| 43        | ttXCHAIN_CLAIM              | XChainClaim               | Completes a crosschain transaction                       |
| 44        | ttXCHAIN_ACCOUNT_CREATE_COMMIT | XChainAccountCreateCommit | Initiates a crosschain account create transaction        |
| 51        | ttORACLE_SET                | OracleSet                 | Creates an Oracle instance                               |
| 52        | ttORACLE_DELETE             | OracleDelete              | Deletes an Oracle instance                               |
| 53        | ttLEDGER_STATE_FIX          | LedgerStateFix            | Fixes a problem in the ledger state                      |
| 54        | ttMPTOKEN_ISSUANCE_CREATE   | MPTokenIssuanceCreate     | Creates a MPTokensIssuance instance                      |
| 55        | ttMPTOKEN_ISSUANCE_DESTROY  | MPTokenIssuanceDestroy    | Destroys a MPTokensIssuance instance                     |
| 56        | ttMPTOKEN_ISSUANCE_SET      | MPTokenIssuanceSet        | Sets flags on a MPTokensIssuance or MPToken instance     |
| 57        | ttMPTOKEN_AUTHORIZE         | MPTokenAuthorize          | Authorizes a MPToken instance                            |
| 58        | ttCREDENTIAL_CREATE         | CredentialCreate          | Creates a Credential instance                            |
| 59        | ttCREDENTIAL_ACCEPT         | CredentialAccept          | Accepts a Credential object                              |
| 60        | ttCREDENTIAL_DELETE         | CredentialDelete          | Deletes a Credential object                              |
| 61        | ttNFTOKEN_MODIFY            | NFTokenModify             | Modifies a NFToken                                       |
| 62        | ttPERMISSIONED_DOMAIN_SET   | PermissionedDomainSet     | Creates or modifies a Permissioned Domain                |
| 70        | ttVAULT_CLAWBACK            | VaultClawback             | Claws back tokens from a vault                           |
| 71        | ttBATCH                     | Batch                     | Batches together transactions                            |
| 100       | ttAMENDMENT                 | EnableAmendment           | System-generated, updates amendment status               |

*This list is strictly based on the provided macro definitions in [transactions.macro](include/xrpl/protocol/detail/transactions.macro).*

---

## References to Source Code

- [Transactor.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.h)
- [Transactor.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Transactor.cpp)
- [CreateOffer.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/CreateOffer.h)
- [CreateOffer.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/CreateOffer.cpp)
- [Escrow.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Escrow.h)
- [PayChan.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/PayChan.h)
- [AMMCreate.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/AMMCreate.h)
- [XChainBridge.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/XChainBridge.h)
- [SetSignerList.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/SetSignerList.h)
- [DID.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/DID.h)
- [Credentials.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Credentials.h)
- [transactions.macro](include/xrpl/protocol/detail/transactions.macro)
- [applySteps.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/applySteps.cpp)
- [InvariantCheck.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/InvariantCheck.h)
- [TxQ.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/TxQ.cpp)
- [apply.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/apply.cpp)