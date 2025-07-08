---

# Consensus_UNL and Negative UNL: Comprehensive Documentation

This document provides a detailed, code-based breakdown of the Consensus_UNL (Unique Node List and Negative UNL) functionality in the XRPL (XRP Ledger) source code. It covers every aspect of the Consensus_UNL mechanism, including its architecture, consensus state transitions, validator scoring, candidate selection, deterministic voting, transaction construction, ledger application, integration with other consensus features, edge cases, parameterization, and failure modes. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [Consensus_UNL Overview](#consensus_unl-overview)
- [Consensus State Transitions](#consensus-state-transitions)
- [Edge Cases and Recovery](#edge-cases-and-recovery)
- [Negative UNL Ledger Object: Structure and Lifecycle](#negative-unl-ledger-object-structure-and-lifecycle)
- [NegativeUNLVote Class and Responsibilities](#negativeunlvote-class-and-responsibilities)
- [Validator Scoring: buildScoreTable](#validator-scoring-buildscoretable)
- [Candidate Selection: findAllCandidates](#candidate-selection-findallcandidates)
- [Deterministic Candidate Choice: choose](#deterministic-candidate-choice-choose)
- [Negative UNL Transaction Construction: addTx](#negative-unl-transaction-construction-addtx)
- [Voting Process: doVoting](#voting-process-dovoting)
- [Ledger Application: applyUNLModify](#ledger-application-applyunlmodify)
- [Consensus Integration and State Management](#consensus-integration-and-state-management)
- [Interaction with Fee/Amendment Voting](#interaction-with-fee-amendment-voting)
- [Example Scenario: Negative UNL Voting and Application](#example-scenario-negative-unl-voting-and-application)
- [Failure Modes for Negative UNL Modification Transactions](#failure-modes-for-negative-unl-modification-transactions)
- [Consensus Parameterization and Rationale](#consensus-parameterization-and-rationale)
- [Supporting Classes and Utilities](#supporting-classes-and-utilities)
- [References to Source Code](#references-to-source-code)

---

## Consensus_UNL Overview

- The Consensus_UNL mechanism in XRPL manages the set of validators that participate in consensus, including the Negative UNL (N-UNL), which temporarily disables unreliable validators without removing them permanently.
- The Negative UNL is updated through a deterministic, protocol-driven voting process, ensuring network reliability and resilience.
- The process involves scoring validator reliability, selecting candidates for disabling or re-enabling, constructing and proposing special transactions, and applying these changes to the ledger.

---

## Consensus State Transitions

Consensus in XRPL is tracked using the following states (see `ConsensusTypes.h`):

- **No**: Consensus has not been reached.
- **Yes**: Consensus has been reached.
- **MovedOn**: The network has moved on to a new ledger, possibly without full consensus.
- **Expired**: The consensus process has expired due to time or other constraints.

**Triggers and Actions:**

- **No**:  
  - *Triggered by*: Insufficient agreement among validators on the proposed ledger.
  - *Action*: The network continues to collect validations and may attempt to reach consensus in subsequent rounds.

- **Yes**:  
  - *Triggered by*: Sufficient agreement (meeting the quorum) among validators on the proposed ledger.
  - *Action*: The ledger is accepted, and the network moves forward to the next ledger.

- **MovedOn**:  
  - *Triggered by*: The network progresses to a new ledger, possibly due to timeouts or lack of consensus.
  - *Action*: Validators may accept a new ledger even if full consensus was not achieved on the previous one.

- **Expired**:  
  - *Triggered by*: The consensus process times out or is otherwise terminated without reaching a decision.
  - *Action*: The process is abandoned for the current round, and the network may attempt to recover or resynchronize.

---

## Edge Cases and Recovery

- **Consensus Cannot Be Reached**:  
  If consensus cannot be reached (state remains **No** or transitions to **Expired**), the network may:
  - Continue to attempt consensus in subsequent rounds.
  - Move on to a new ledger (**MovedOn**), potentially leading to temporary divergence until consensus is restored.

- **Negative UNL is Full**:  
  The Negative UNL has a maximum size, defined as a fraction of the total UNL:
  ```cpp
  static constexpr float negativeUNLMaxListed = 0.25;
  ```
  If the N-UNL is full (i.e., 25% of the UNL is already listed as disabled), no additional validators can be added to the N-UNL until space becomes available (e.g., by re-enabling a validator).

- **No Eligible Candidates**:  
  If there are no eligible candidates for disabling (e.g., all validators are performing adequately or the N-UNL is full), the Negative UNL voting process will not propose any new modifications.

---

## Negative UNL Ledger Object: Structure and Lifecycle

- **Structure**:  
  - The Negative UNL ledger object stores:
    - A list of validator public keys currently disabled (`sfDisabledValidators`).
    - Pending disables (`sfValidatorToDisable`) and re-enables (`sfValidatorToReEnable`).

- **Lifecycle**:
  1. **Initialization**: The Negative UNL is empty or contains previously disabled validators.
  2. **Voting**: Each consensus round, the `NegativeUNLVote::doVoting` method evaluates validator performance and proposes modifications.
  3. **Modification**: If a validator is to be disabled or re-enabled, a `ttUNL_MODIFY` transaction is created and added to the ledger's transaction set.
  4. **Application**: Once the transaction is included in a validated ledger, the Negative UNL is updated accordingly.

- **Accessors**:  
  - `Ledger::negativeUNL()` returns the set of currently disabled validators.
  - `Ledger::validatorToDisable()` and `Ledger::validatorToReEnable()` return pending disables/re-enables.

---

## NegativeUNLVote Class and Responsibilities

**Location:** [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt), [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.h.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.h.txt)

- Manages the entire voting process for the Negative UNL.
- **Key responsibilities:**
  1. Collect and score validator performance over a configurable interval using validation history.
  2. Identify candidates for disabling (adding to Negative UNL) or re-enabling (removing from Negative UNL) based on reliability scores and protocol thresholds.
  3. Deterministically select candidates for action using a randomizing pad (e.g., previous ledger hash).
  4. Construct and add transactions to the ledger to modify the Negative UNL.
  5. Track and manage new validators to avoid disabling them prematurely.
  6. Log all relevant actions and errors for debugging and auditability.

---

## Validator Scoring: buildScoreTable

**Location:** [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt)

- **Purpose:** Constructs a score table mapping each validator NodeID in the current UNL to the number of trusted validations they have issued over a recent interval of ledgers.
- **Edge Cases:**  
  - If there is insufficient ledger history, or if the local node has too few or too many validations, the function returns `std::nullopt` and no voting occurs.

---

## Candidate Selection: findAllCandidates

**Location:** [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt)

- **Purpose:** Identifies which validators are candidates to be disabled (added to Negative UNL) or re-enabled (removed from Negative UNL).
- **Edge Cases:**  
  - If the Negative UNL is full, no disables are proposed.
  - If no candidates are found, no modification is proposed.

---

## Deterministic Candidate Choice: choose

**Location:** [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt)

- **Purpose:** Deterministically selects a single NodeID from a list of candidates using a randomizing pad (typically the previous ledger hash).

---

## Negative UNL Transaction Construction: addTx

**Location:** [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt)

- **Purpose:** Constructs and adds a Negative UNL modification transaction to the SHAMap of transactions for the next ledger.
- **Failure Mode:**  
  - If the transaction cannot be added to the SHAMap, a warning is logged and no change occurs.

---

## Voting Process: doVoting

**Location:** [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt)

- **Purpose:** Orchestrates the entire Negative UNL voting process for a consensus round.
- **Edge Cases:**  
  - If no score table can be built, or no candidates are found, no modification is proposed.

---

## Ledger Application: applyUNLModify

**Location:** [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Change.cpp.txt](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Change.cpp.txt)

- **Purpose:** Processes a UNL_MODIFY transaction to either disable or re-enable a validator in the Negative UNL.
- **Failure Modes:**  
  - Transaction is not applied if:
    - Not a flag ledger.
    - Transaction fields are missing or invalid.
    - Disabling a validator already disabled or pending disable.
    - Re-enabling a validator not in Negative UNL or already pending re-enable.
    - Ledger sequence does not match.

---

## Consensus Integration and State Management

- The Negative UNL voting and transaction process is integrated into the consensus round via the `doVoting` method, which is called during ledger closing and consensus finalization.
- The validator list and Negative UNL are updated in the application state, and the consensus engine ensures that only trusted, non-disabled validators are counted for quorum and proposal processing.
- The Negative UNL is exposed via RPC and internal APIs for monitoring and diagnostics.

---

## Interaction with Fee/Amendment Voting

- Negative UNL voting is performed alongside fee and amendment voting during the consensus process.
- During a voting ledger, if the `featureNegativeUNL` is enabled, Negative UNL voting is invoked in parallel with fee and amendment voting, ensuring all governance changes are considered in the same consensus round.

---

## Example Scenario: Negative UNL Voting and Application

**Scenario**:  
- The network detects that validator `A` is consistently missing validations.
- During the consensus round, `NegativeUNLVote::doVoting` is called.
- The system builds a score table of validator performance.
- Validator `A` is identified as a candidate for disabling.
- An `ttUNL_MODIFY` transaction is created to disable `A`:
  ```cpp
  addTx(seq, A, ToDisable, initialSet);
  ```
- The transaction is added to the ledger's transaction set.
- Once the ledger is validated, `A` is added to the Negative UNL and is excluded from consensus calculations until re-enabled.

---

## Failure Modes for Negative UNL Modification Transactions

- **Transaction Rejection**: If the `ttUNL_MODIFY` transaction cannot be added to the SHAMap (transaction set), a warning is logged and no change occurs.
- **Ledger Not Validated**: If the ledger containing the modification transaction is not validated, the change does not take effect.
- **No Eligible Candidates**: If no validators meet the criteria for disabling or re-enabling, no transaction is created.
- **Invalid Transaction**: If the transaction is malformed or fields are invalid, it is rejected during application.

---

## Consensus Parameterization and Rationale

Consensus parameters are defined as constants in the `NegativeUNLVote` class:

```cpp
static constexpr size_t negativeUNLLowWaterMark = FLAG_LEDGER_INTERVAL * 50 / 100;
static constexpr size_t negativeUNLHighWaterMark = FLAG_LEDGER_INTERVAL * 80 / 100;
static constexpr size_t negativeUNLMinLocalValsToVote = FLAG_LEDGER_INTERVAL * 90 / 100;
static constexpr size_t newValidatorDisableSkip = FLAG_LEDGER_INTERVAL * 2;
static constexpr float negativeUNLMaxListed = 0.25;
```

- **Watermarks**:  
  - **Low/High Watermark**: Control when the system considers disabling or re-enabling validators, based on the number of missed validations.
- **MinLocalValsToVote**: Minimum number of local validations required to participate in voting.
- **MaxListed**: Maximum fraction of the UNL that can be on the Negative UNL.
- **Configurability**: These are compile-time constants and not dynamically configurable at runtime in the provided code.

---

## Supporting Classes and Utilities

- **ValidatorList**: Manages the trusted validator set, Negative UNL, and quorum calculation.
- **Ledger**: Stores the Negative UNL state and provides accessors for current, pending disables, and re-enables.
- **RCLConsensus**: Integrates Negative UNL voting into the consensus process.
- **SHAMap**: Holds the set of transactions, including Negative UNL modification transactions, for each ledger.

---

## References to Source Code

- [NegativeUNLVote.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.cpp.txt)
- [NegativeUNLVote.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/NegativeUNLVote.h.txt)
- [Change.cpp (applyUNLModify)](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Change.cpp.txt)
- [ValidatorList.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/ValidatorList.cpp.txt)
- [Ledger.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/ledger/Ledger.cpp.txt)
- [RCLConsensus.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.cpp.txt)
- [Consensus.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.h.txt)
- [ConsensusTypes.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/ConsensusTypes.h.txt)