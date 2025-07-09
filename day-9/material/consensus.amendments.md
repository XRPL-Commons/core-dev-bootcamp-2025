# Consensus_Amendments Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the Consensus_Amendments functionality in the XRPL (XRP Ledger) source code. It covers every aspect of Consensus_Amendments, including its architecture, amendment state management, voting, consensus integration, ledger application, persistence, interactions with the consensus engine and ledger, consensus phases and states, handling of obsolete/retired amendments, amendment registration, RPC/admin interfaces, operational consequences of unsupported amendments, edge cases, standalone mode, and interactions with Negative UNL. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [Consensus_Amendments Overview](#consensus_amendments-overview)
- [Consensus Process Phases and States](#consensus-process-phases-and-states)
- [AmendmentTable Architecture](#amendmenttable-architecture)
  - [AmendmentTable Interface](#amendmenttable-interface)
  - [AmendmentTableImpl Implementation](#amendmenttableimpl-implementation)
  - [AmendmentState Structure](#amendmentstate-structure)
- [Amendment Initialization and Registration](#amendment-initialization-and-registration)
  - [Supported, Obsolete, and Retired Amendments](#supported-obsolete-and-retired-amendments)
  - [Process for Registering New Amendments](#process-for-registering-new-amendments)
- [Amendment Voting Process](#amendment-voting-process)
  - [TrustedVotes and AmendmentSet](#trustedvotes-and-amendmentset)
  - [Vote Collection and Threshold Calculation](#vote-collection-and-threshold-calculation)
  - [AmendmentSet::passes](#amendmentsetpasses)
- [Consensus Integration](#consensus-integration)
  - [doVoting: Amendment Voting Logic](#dovoting-amendment-voting-logic)
  - [doValidation and getDesired](#dovalidation-and-getdesired)
- [Ledger Application and Amendment Activation](#ledger-application-and-amendment-activation)
  - [doValidatedLedger: Synchronizing State](#dovalidatedledger-synchronizing-state)
  - [Change::applyAmendment: Ledger Transaction Application](#changeapplyamendment-ledger-transaction-application)
- [Persistence and Database Interaction](#persistence-and-database-interaction)
  - [persistVote and voteAmendment](#persistvote-and-voteamendment)
  - [readAmendments](#readamendments)
- [Amendment State Query, RPC/Admin Interface, and JSON Representation](#amendment-state-query-rpcadmin-interface-and-json-representation)
- [Consensus Engine and Amendment Voting](#consensus-engine-and-amendment-voting)
  - [Consensus Class and RCLConsensus Adaptor](#consensus-class-and-rclconsensus-adaptor)
  - [Consensus Parameters and Thresholds](#consensus-parameters-and-thresholds)
- [Thread Safety and Synchronization](#thread-safety-and-synchronization)
- [Operational Consequences and Recovery for Unsupported Amendments](#operational-consequences-and-recovery-for-unsupported-amendments)
- [Edge Cases: Low Validator Count and Network Partitioning](#edge-cases-low-validator-count-and-network-partitioning)
- [Amendment Voting in Standalone Mode](#amendment-voting-in-standalone-mode)
- [Interactions with Negative UNL](#interactions-with-negative-unl)
- [References to Source Code](#references-to-source-code)

---

## Consensus_Amendments Overview

Consensus_Amendments is the subsystem responsible for managing protocol amendments (features/upgrades) in the XRPL. It tracks supported and enabled amendments, collects validator votes, determines amendment majorities, and coordinates the activation of amendments through the consensus process. Amendments are only enabled if they achieve at least 80% validator support for a two-week period, as enforced by the consensus and ledger logic.

- Amendments are proposed protocol changes that affect transaction processing and consensus ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/README.md)).
- Amendments must be accepted by a network majority through a consensus process before being utilized.
- An Amendment must receive at least an 80% approval rate from validating nodes for a period of two weeks before being accepted.
- Validators that support an amendment that is not yet enabled announce their support in their validations. If 80% support is achieved, they will introduce a pseudo-transaction to track the amendment's majority status in the ledger. If an amendment holds majority status for two weeks, validators will introduce a pseudo-transaction to enable the amendment ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/README.md)).

---

## Consensus Process Phases and States

The consensus process in XRPL is divided into phases and states, which directly impact amendment voting and activation.

### Consensus Phases

Defined in [ConsensusTypes.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/ConsensusTypes.h):

- **open**: The ledger is open for transaction proposals.
- **establish**: Validators exchange proposals and attempt to reach agreement.
- **accepted**: Consensus has been reached and the ledger is closed.

### Consensus States

Defined in [ConsensusTypes.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/ConsensusTypes.h):

- **ConsensusState::No**: Consensus has not been reached.
- **ConsensusState::Yes**: Consensus has been reached.
- **ConsensusState::MovedOn**: 80% of nodes have moved on, but consensus was not reached.
- **ConsensusState::Expired**: Consensus round expired due to timeouts.

Amendment voting occurs during the consensus process, specifically in the "establish" phase. If consensus is reached (ConsensusState::Yes), the results—including amendment votes—are applied to the ledger. If consensus is not reached (No, MovedOn, Expired), amendments are not enabled, and the process repeats in the next round.

---

## AmendmentTable Architecture

### AmendmentTable Interface

- Defined in [AmendmentTable.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/AmendmentTable.h).
- Provides methods for:
  - Finding, enabling, vetoing, and checking the status of amendments.
  - Handling voting and validation processes related to amendments.
  - Querying amendment information, tracking enabled and supported features.
  - Managing amendment voting based on network validations.
- Key methods:
  - `find`, `veto`, `unVeto`, `enable`, `isEnabled`, `isSupported`, `hasUnsupportedEnabled`, `firstUnsupportedExpected`, `getJson`, `doValidatedLedger`, `trustChanged`, `doVoting`, `doValidation`, `getDesired`.

### AmendmentTableImpl Implementation

- Implements the AmendmentTable interface ([AmendmentTable.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)).
- Manages:
  - Internal state of all known amendments (`amendmentMap_`).
  - Votes, support status, enabled status, and persistence to the database.
  - TrustedVotes and lastVote_ for tracking validator votes.
  - Thread safety via `mutex_`.
- Key members:
  - `hash_map<uint256, AmendmentState> amendmentMap_`
  - `TrustedVotes previousTrustedVotes_`
  - `std::unique_ptr<AmendmentSet> lastVote_`
  - `bool unsupportedEnabled_`
  - `std::optional<NetClock::time_point> firstUnsupportedExpected_`
  - `DatabaseCon& db_`

### AmendmentState Structure

- Represents the state of a single amendment ([AmendmentTable.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - `AmendmentVote vote` (up, down, obsolete)
  - `bool enabled`
  - `bool supported`
  - `std::string name`

---

## Amendment Initialization and Registration

### Supported, Obsolete, and Retired Amendments

- Amendments are registered at startup using the `FeatureInfo` struct ([AmendmentTable.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/AmendmentTable.h)):
  - `std::string const name`
  - `uint256 const feature`
  - `VoteBehavior const vote`
- The list of supported amendments is constructed from the protocol's feature registry ([Feature.cpp](https://github.com/XRPLF/rippled/tree/develop/src/libxrpl/protocol/Feature.cpp), [features.macro](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/detail/features.macro)).
- **Obsolete Amendments**: Marked with `VoteBehavior::Obsolete` in the code and macro files. These are features that are no longer relevant but must remain supported in case they are ever enabled ([features.macro](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/detail/features.macro)).
- **Retired Amendments**: Marked with `XRPL_RETIRE` in [features.macro](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/detail/features.macro). These are amendments that have been active for at least two years, their pre-amendment code has been removed, and their identifiers are deprecated.

### Process for Registering New Amendments

- To register a new amendment:
  1. Add the amendment to [features.macro](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/detail/features.macro) using `XRPL_FEATURE`, `XRPL_FIX`, or `XRPL_RETIRE` as appropriate.
  2. Increment `numFeatures` in [Feature.h](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/Feature.h).
  3. The amendment will be included in the feature registry and available for voting and tracking.

---

## Amendment Voting Process

### TrustedVotes and AmendmentSet

- `TrustedVotes` tracks votes from trusted validators and manages their timeouts ([AmendmentTable.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)).
- `AmendmentSet` aggregates votes for each amendment and computes which amendments have enough votes to pass ([AmendmentSet](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - `hash_map<uint256, int> votes_`
  - `int trustedValidations_`
  - `int threshold_`

### Vote Collection and Threshold Calculation

- Votes are collected from trusted validations in each consensus round ([AmendmentSet::AmendmentSet](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - Calls `trustedVotes.getVotes(rules, lock)` to get the number of trusted validations and votes per amendment.
  - Computes the threshold for passing using `computeThreshold`:
    - If `fixAmendmentMajorityCalc` is not enabled, uses `preFixAmendmentMajorityCalcThreshold` (typically 80%).
    - If enabled, uses `postFixAmendmentMajorityCalcThreshold`.
    - Always at least 1.

### AmendmentSet::passes

- Determines if an amendment has enough votes to pass ([AmendmentSet::passes](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - Looks up the amendment in `votes_`.
  - Returns true if the number of votes is greater than or equal to `threshold_`, false otherwise.

---

## Consensus Integration

### doVoting: Amendment Voting Logic

- `AmendmentTableImpl::doVoting` is called each consensus round to determine amendment actions ([AmendmentTableImpl::doVoting](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - Updates trusted votes from current validations.
  - Builds an `AmendmentSet` to aggregate votes.
  - For each amendment:
    - If already enabled, skip.
    - Determine if it has validator majority (`vote->passes`), ledger majority (recorded in the ledger), and the time it achieved majority.
    - Decide actions:
      - If it just achieved majority, signal `tfGotMajority`.
      - If it lost majority, signal `tfLostMajority`.
      - If it has held majority for the required period, signal enablement.
      - Otherwise, log status.
  - Returns a map of amendment hashes to action codes (e.g., `tfGotMajority`, `tfLostMajority`, 0 for enablement).

### doValidation and getDesired

- `doValidation` determines which amendments to advertise as supported in validation messages ([AmendmentTableImpl::doValidation](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - Returns a sorted vector of amendment hashes that are supported, upvoted, and not already enabled.
- `getDesired` calls `doValidation` with an empty set, returning all amendments the node desires to see enabled ([AmendmentTableImpl::getDesired](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)).

---

## Ledger Application and Amendment Activation

### doValidatedLedger: Synchronizing State

- `AmendmentTableImpl::doValidatedLedger` is called after a ledger is validated ([AmendmentTableImpl::doValidatedLedger](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - Enables all amendments marked as enabled in the ledger.
  - Updates internal state for amendments with majority but not yet enabled.
  - Tracks when unsupported amendments are expected to be enabled.
  - Records the last processed ledger sequence.

### Change::applyAmendment: Ledger Transaction Application

- The `Change::applyAmendment` function applies amendment pseudo-transactions to the ledger ([Change.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Change.cpp)):
  - Retrieves the amendment hash from the transaction.
  - Checks if the amendment is already enabled; if so, returns `tefALREADY`.
  - Handles flags for `tfGotMajority` and `tfLostMajority`:
    - Updates the `sfMajorities` field in the amendment object.
    - If `gotMajority`, adds a new majority entry with the amendment and close time.
    - If `lostMajority`, removes the majority entry.
  - If neither flag is set, enables the amendment:
    - Adds the amendment to the `sfAmendments` field.
    - Calls `activateTrustLinesToSelfFix` if the amendment is `fixTrustLinesToSelf`.
    - Calls `ctx_.app.getAmendmentTable().enable(amendment)`.
    - If the amendment is not supported, logs an error and blocks the server (`setAmendmentBlocked`).
  - Updates the amendment object in the ledger and returns `tesSUCCESS`.

---

## Persistence and Database Interaction

### persistVote and voteAmendment

- `AmendmentTableImpl::persistVote` records the current vote for an amendment in the database ([persistVote](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - Asserts the vote is not obsolete.
  - Obtains a database session and calls `voteAmendment`.
- `voteAmendment` inserts a row into the `FeatureVotes` table with the amendment hash, name, and vote ([voteAmendment](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/rdb/detail/Wallet.cpp)):
  - Begins a transaction.
  - Constructs and executes an SQL `INSERT` statement.
  - Commits the transaction.

### readAmendments

- `readAmendments` reads the latest votes for amendments from the `FeatureVotes` table ([readAmendments](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/rdb/detail/Wallet.cpp)):
  - Uses a SQL window function to select the most recent entry for each amendment.
  - For each row, invokes a callback with the amendment hash, name, and vote.
  - The caller validates the fields and updates internal state accordingly.

---

## Amendment State Query, RPC/Admin Interface, and JSON Representation

- The `getJson` method provides a JSON representation of the amendment state ([AmendmentTableImpl::getJson](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)):
  - For each amendment, includes name, support status, enabled status, vote, and (if not enabled) vote counts and thresholds.
  - Used for API responses and monitoring.
- The `doFeature` RPC handler ([Feature1.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/Feature1.cpp)):
  - Allows querying the status of all amendments or a specific amendment.
  - Admin users can veto or unveto amendments via RPC.
  - Returns detailed information about each feature, including majority status.

---

## Consensus Engine and Amendment Voting

### Consensus Class and RCLConsensus Adaptor

- The consensus process is managed by the generic `Consensus` class ([Consensus.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.h)), parameterized by an Adaptor.
- The XRPL-specific adaptor is `RCLConsensus` ([RCLConsensus.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.cpp), [RCLConsensus.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.h)):
  - Handles acquiring ledgers, sharing proposals, building new ledgers, and applying transactions.
  - Integrates with the amendment voting subsystem by calling `doVoting` and `doValidation` as part of the consensus round.

### Consensus Parameters and Thresholds

- Consensus timing and thresholds are controlled by `ConsensusParms` ([ConsensusParms.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/ConsensusParms.h)):
  - `minCONSENSUS_PCT` (typically 80%) is the minimum percentage of agreement required.
  - `ledgerMIN_CONSENSUS`, `ledgerMAX_CONSENSUS` control round durations.
  - The threshold for amendment passage is computed in `AmendmentSet::computeThreshold` based on the number of trusted validations and protocol rules.

---

## Thread Safety and Synchronization

- All amendment state changes are protected by a mutex (`mutex_`) in `AmendmentTableImpl` ([AmendmentTable.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)).
- Database operations are performed within transactions to ensure atomicity.
- The consensus engine uses its own synchronization mechanisms to manage peer proposals and round progression.

---

## Operational Consequences and Recovery for Unsupported Amendments

- If a server detects that an unsupported amendment has been enabled ([Change.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Change.cpp)):
  - The server logs an error and sets itself as "amendment blocked" (`setAmendmentBlocked`).
  - While blocked, the server cannot participate in consensus or process new ledgers.
  - There is no mechanism to disable or revoke an enabled amendment.
  - Recovery requires upgrading the server to a version that supports the amendment.

---

## Edge Cases: Low Validator Count and Network Partitioning

- The amendment threshold is always at least 1, but is typically 80% of trusted validations ([AmendmentSet::computeThreshold](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)).
- If the validator count is low, the threshold calculation ensures at least one vote is required.
- In the event of a network partition, amendments may not reach the required majority, and thus will not be enabled.
- The consensus process (see [Consensus.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.cpp)) handles cases where consensus cannot be reached (states: No, MovedOn, Expired).

---

## Amendment Voting in Standalone Mode

- In standalone mode ([RCLConsensus.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.cpp)), the node can still perform amendment voting logic, but there are no other validators to reach consensus with.
- The code path for voting and enabling amendments is still executed, but the node's actions are not propagated to a network.

---

## Interactions with Negative UNL

- The Negative UNL (Unique Node List) feature is a protocol amendment that allows the network to temporarily ignore malfunctioning validators.
- When the Negative UNL feature is enabled ([RCLConsensus.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.cpp)), amendment voting and Negative UNL voting can both occur in the same consensus round.
- The code integrates Negative UNL voting with amendment voting, ensuring both processes are coordinated when the feature is active.

---

## References to Source Code

- [AmendmentTable.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/AmendmentTable.h)
- [AmendmentTable.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/detail/AmendmentTable.cpp)
- [Feature.cpp](https://github.com/XRPLF/rippled/tree/develop/src/libxrpl/protocol/Feature.cpp)
- [features.macro](https://github.com/XRPLF/rippled/blob/develop/include/xrpl/protocol/detail/features.macro)
- [Wallet.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/rdb/detail/Wallet.cpp)
- [Wallet.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/rdb/Wallet.h)
- [Change.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/tx/detail/Change.cpp)
- [Consensus.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.h)
- [Consensus.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/Consensus.cpp)
- [ConsensusParms.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/ConsensusParms.h)
- [ConsensusTypes.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/ConsensusTypes.h)
- [RCLConsensus.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.cpp)
- [RCLConsensus.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/consensus/RCLConsensus.h)
- [README.md (Amendments)](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/README.md)
- [README.md (Consensus)](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/consensus/README.md)
- [Feature1.cpp (RPC handler)](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/Feature1.cpp)