## https://xrpl.org/docs/concepts/ledgers/index

# XRPL Ledgers Documentation Summary

## Overview
The XRP Ledger is a shared, global ledger that maintains data integrity through a distributed network where each server keeps a full copy of the ledger database. Ledgers are organized as a series of blocks (ledger versions) that record transaction history and state changes through a consensus process.

## Key Concepts and Terminology
• **Ledger versions/ledgers** - Individual blocks in the blockchain sequence
• **Ledger Index** - Identifies the correct order of ledgers
• **Open ledger** - Current in-progress ledger accepting new transactions
• **Closed ledgers** - Pending ledgers awaiting validation
• **Validated ledgers** - Immutable, finalized ledgers
• **Consensus** - Distributed agreement protocol preventing double-spending
• **Validation** - Signed statement confirming ledger built through consensus
• **Proposal** - Signed statement of transactions for next consensus ledger

## Main Technical Details
Each ledger consists of three components: a header (containing Ledger Index, hashes, and metadata), a transaction tree (transactions applied from previous ledger), and a state tree (all current ledger data including balances and settings). The system maintains ledger continuity through a publication stream that delivers fully-validated ledgers to clients, with servers attempting to maintain continuous streams unless they fall behind.

## Practical Applications
• Maintaining transaction history and account states across the network
• Enabling trustless verification without relying on single institutions
• Supporting real-time ledger streaming for client applications
• Facilitating consensus-based transaction validation

## Important Considerations
Byzantine failures can cause servers to reach different conclusions about the last closed ledger, requiring validation processes to resolve differences. Servers may become desynced during consensus rounds and must switch strategies to acquire the consensus ledger when supermajority agreement exists.

---

## https://xrpl.org/docs/concepts/ledgers/ledger-structure

# XRPL Ledger Structure Documentation Summary

## Overview
The XRP Ledger is a blockchain where each block is called a "ledger version" that contains state data, a transaction set, and a header with metadata. The consensus protocol builds new validated ledger versions by having validators agree on transactions to apply to the previous ledger, creating an immutable chain of transaction history.

## Key Concepts and Terminology
• **Ledger Version/Ledger** - Individual blocks in the XRPL blockchain
• **State Data** - Snapshot of all accounts, balances, and settings stored as ledger entries in a tree format
• **Transaction Set** - Group of transactions applied in canonical order to create state changes
• **Ledger Header** - Fixed-size summary containing metadata about the ledger version
• **Ledger Index** - Sequential position number identifying ledger's place in the chain
• **Ledger Hash** - Unique 256-bit identifier reflecting the ledger's exact contents
• **Validated Ledger** - Ledger version confirmed by consensus of validators as immutable

## Main Technical Details
The ledger structure consists of three main components: state data (stored as a tree of ledger entries with unique 256-bit IDs), transaction sets (containing both transaction instructions and metadata), and headers (containing ledger index, hash, parent hash, close time, and checksums). Each ledger entry can be looked up individually, and the entire state data represents a complete snapshot that any server can download to process transactions and answer queries.

## Practical Applications
Servers use ledger structure to maintain synchronized copies of all network data, process new transactions, and answer queries about current account states. The structure enables efficient verification of data integrity through hashing and supports the consensus mechanism that validates new ledger versions.

## Important Considerations
Ledger versions are only considered immutable after validation by consensus - unvalidated ledgers may have the same index but different contents. Two ledgers with identical hashes are always completely identical, while ledgers with the same index from different chains can have different hashes. The close time is rounded (usually by 10 seconds) and the ledger header maintains a fixed size regardless of transaction set or state data size.

---

## https://xrpl.org/docs/concepts/ledgers/open-closed-validated-ledgers

# XRPL Open, Closed, and Validated Ledgers - Documentation Summary

## Overview
The XRP Ledger operates with three distinct ledger states: open (temporary workspace), closed (proposed next state), and validated (confirmed previous state). Each server maintains one open ledger, zero or more closed ledgers, and an immutable history of validated ledgers that form the permanent blockchain record.

## Key Concepts and Terminology
• **Open Ledger** - Temporary workspace where new transactions are applied as received
• **Closed Ledger** - Proposed next state with transactions in canonical order, eligible for validation
• **Validated Ledger** - Immutable, consensus-confirmed ledger that becomes part of permanent history
• **Canonical Order** - Deterministic transaction ordering designed to prevent front-running
• **Consensus Process** - Distributed agreement protocol that resolves double-spending
• **Validation** - Signed statement confirming a ledger was built through consensus
• **Byzantine Failures** - Network disagreements resolved through supermajority consensus

## Main Technical Details
The ledger progression process is counterintuitive: servers don't convert open ledgers to closed ledgers directly. Instead, they discard the open ledger, create a new closed ledger by applying transactions in canonical order to a previous closed ledger, then build a new open ledger from the latest closed state. This process ensures deterministic results across the distributed network while handling the challenge that different servers may receive transactions in different orders.

## Practical Applications
• **Transaction Processing** - Open ledgers provide immediate tentative results for user transactions
• **Consensus Participation** - Closed ledgers serve as proposals during the consensus process
• **Historical Record** - Validated ledgers create the permanent, auditable transaction history
• **Decentralized Exchange** - Canonical ordering prevents manipulation of trading order execution

## Important Warnings and Limitations
Transactions in open ledgers show only tentative results that may differ from final outcomes since the open ledger may be discarded during consensus. The canonical ordering system, while preventing front-running, means transaction order in the final ledger may differ from submission order. Network participants must understand that only validated ledgers represent confirmed, irreversible states.

---

## https://xrpl.org/docs/concepts/ledgers/ledger-close-times

# XRPL Ledger Close Times Summary

## Overview
The XRP Ledger records when each ledger version closes using a `close_time` field that is rounded to 10-second intervals to facilitate network consensus. This rounding system ensures that ledger close times are strictly increasing, with child ledgers always having close times at least 1 second later than their parent ledgers.

## Key Concepts and Terminology
• **Close Time Resolution** - Currently set to 10 seconds for rounding consensus
• **Ledger Header** - Contains the close_time field and other ledger metadata
• **Parent/Child Ledger Relationship** - Sequential ledgers where child must have later close time
• **Consensus Round** - Process where validators agree on close time
• **Time-based Measurements** - Limited by the 10-second resolution for precision

## Main Technical Details
The close time calculation follows a specific process: validators first record their observed close time, reach consensus on the actual time, round to the nearest 10-second interval, and adjust if necessary to ensure the time is greater than the parent ledger's close time. Since ledgers typically close every 3-5 seconds, this creates patterns where close times commonly end in :00, :01, :02, :10, :11, :20, :21, etc. The system guarantees strictly increasing close times by adding 1 second to any rounded time that would equal or precede the parent ledger's close time.

## Practical Applications
This timing system is crucial for time-sensitive operations like Escrow transactions, where expiration dates are checked against the parent ledger's close time. The close time serves as the network's authoritative timestamp for all time-based smart contract functionality and transaction ordering.

## Important Limitations
The 10-second resolution means the ledger cannot make time-based measurements more precise than this interval, potentially causing time-sensitive operations to execute up to 10 seconds later than their specified real-world expiration times. Additionally, expiration checks use the parent ledger's close time rather than the current ledger's close time, since the current close time isn't known during transaction execution.
