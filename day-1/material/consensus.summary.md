## https://xrpl.org/docs/concepts/consensus-protocol/index

# XRPL Consensus Protocol Summary

## Overview
The XRP Ledger Consensus Protocol is a unique distributed agreement mechanism that enables decentralized transaction confirmation without requiring energy-intensive mining or a central authority. The protocol prioritizes correctness, agreement, and forward progress to maintain network integrity while processing transactions efficiently in blocks called "ledger versions."

## Key Concepts and Terminology
• **Consensus Protocol** - Set of rules all participants follow to agree on transaction order and outcomes
• **Ledger Versions/Ledgers** - Blocks containing current state, transactions, and metadata with sequential numbering
• **Validators** - Servers specifically configured to participate actively in consensus by proposing and validating transactions
• **Unique Node List (UNL)** - Each participant's chosen set of trusted validators
• **Trust-Based Validation** - Core principle where participants trust a selected group of validators rather than the entire network
• **Double-Spend Problem** - Challenge of preventing the same digital money from being spent twice

## Main Technical Details and Processes
The consensus process operates through multiple rounds where validators propose transaction sets and gradually align their proposals with other trusted validators. Each ledger version contains the complete current state, transaction set, and cryptographic metadata linking to the previous ledger. The protocol can tolerate up to 20% faulty validators while maintaining progress, requires over 80% validator collusion to confirm invalid transactions, and stops progress rather than diverging when 20-80% of validators are faulty. The network uses a gossip protocol for peer-to-peer communication and digital signatures for message authentication.

## Practical Applications and Use Cases
The protocol enables decentralized payments and asset transfers without central operators, supports real-time settlement typically completing in under 5 seconds, and provides a foundation for building financial applications requiring fast, reliable transaction processing. It allows for fee voting mechanisms where validators collectively determine network fees every 256 ledgers, and maintains complete transaction history while enabling new participants to sync using only the current state.

## Important Warnings, Limitations, and Considerations
The protocol is still evolving with ongoing research into its limits and failure cases. Network performance can degrade under high transaction volumes, potentially extending consensus duration from the normal sub-5 seconds to up to 20 seconds, which may indicate network problems. The system's security depends on the assumption that trusted validators won't collude, making validator selection critical. Historical ledgers 1-32569 were lost due to an early mishap, though this doesn't affect current operations since each ledger contains complete state information.

---

## https://xrpl.org/docs/concepts/consensus-protocol/consensus-structure

# XRPL Consensus Structure Documentation Summary

## Overview
This document provides a comprehensive overview of the XRP Ledger's consensus mechanism, explaining how the peer-to-peer network maintains a shared, authoritative ledger through validation processes. The XRP Ledger creates new ledger versions every few seconds, with each validated version becoming immutable and part of the permanent ledger history.

## Key Concepts and Terminology
• **Ledger Version** - A snapshot of the network state with two identifiers: ledger index (sequential number) and ledger hash (digital fingerprint)
• **Validation** - The process by which the network agrees on ledger contents, making them immutable
• **Consensus** - Distributed agreement protocol used to prevent double-spending
• **Validators** - Servers that contribute to advancing ledger history by sending proposals and validations
• **Tracking Servers** - Servers that distribute transactions and respond to queries but don't validate
• **Last Closed Ledger** - The most recent ledger a server believes achieved network consensus
• **Proposals** - Signed statements indicating which transactions should be included in the next ledger
• **Transaction Result Codes** - tesSUCCESS (successful), tec (failed but included), others (provisional failures)

## Main Technical Details
The ledger stores account settings, XRP and token balances, distributed exchange offers, network settings, and timestamps. Transactions are the only way to authorize changes, and each must be cryptographically signed by an account owner. The consensus process typically takes under 5 seconds under normal conditions, with an upper limit of roughly 20 seconds indicating potential network problems. Servers may create multiple candidate ledger versions with the same index but different hashes, though only one becomes validated while others are discarded.

## Practical Applications
Applications can query ledger state for account balances, transaction history, and network settings. The system enables secure peer-to-peer transactions, token trading through the distributed exchange, and programmable money features. Client applications include wallets, gateways to financial institutions, and trading platforms that submit transactions to XRP Ledger servers.

## Important Warnings and Limitations
**Critical**: Applications must never rely on provisional results from candidate transactions - only transactions in validated ledgers with tesSUCCESS codes are final. Transactions may appear successful initially but still fail during validation. All transactions destroy some XRP as a transaction cost regardless of success or failure. The LastLedgerSequence field creates a deadline - if this ledger is validated without including the transaction, that transaction can never succeed.

---

## https://xrpl.org/docs/concepts/consensus-protocol/consensus-protections

# XRPL Consensus Protections Summary

## Overview
The XRP Ledger Consensus Protocol is a byzantine fault tolerant system designed to maintain network integrity even when validators misbehave, network communications fail, or malicious actors attempt attacks. The protocol can continue operating as long as less than 20% of trusted validators are compromised, requiring 80% agreement to validate transactions and prevent invalid operations.

## Key Concepts and Terminology
• **Byzantine Fault Tolerance** - System continues functioning despite various failures and attacks
• **Validators** - Servers that actively participate in consensus by sending proposals and validations
• **Sybil Attack** - Attempt to control network using multiple fake validator identities
• **Validator Overlap Requirements** - Need for ~90% similarity in trusted validator sets across participants
• **Unique Node List (UNL)** - Recommended list of trusted validators provided by XRPL Foundation and Ripple
• **Consensus Ledger** - The most recent ledger the server believes the network agreed upon
• **Last Validated Ledger** - The authoritative ledger confirmed through validation process

## Main Technical Details
The protocol handles validator misbehavior through redundancy - consensus continues with up to 20% of validators being unavailable, malicious, or malfunctioning. Software vulnerabilities are addressed through open-source code, rigorous review processes, digital signatures, security audits, and bug bounty programs. The system prevents 51% attacks by not using mining, instead relying on configured trust relationships that require human intervention to establish.

## Practical Applications
• **Transaction Processing** - Maintains reliable transaction validation even during network stress
• **Network Governance** - Allows for validator set changes while maintaining consensus
• **Enterprise Integration** - Provides predictable consensus timing (typically under 5 seconds, maximum ~20 seconds)
• **Decentralized Finance** - Enables trustless financial operations across distributed participants

## Important Warnings and Limitations
Operators should not configure custom validator lists without careful consideration, as insufficient overlap with the network could cause divergence and potential financial losses. If more than 20% of validators fail simultaneously, the network cannot validate new ledgers, though transactions can still be tentatively processed. The system requires ongoing human oversight to maintain validator list integrity and respond to network health issues.

---

## https://xrpl.org/docs/concepts/consensus-protocol/unl

## XRPL Unique Node List (UNL) Documentation Summary

### Overview
The Unique Node List (UNL) is a server's curated list of validators that it trusts not to collude during the XRP Ledger consensus process. Each UNL entry represents an independent entity to ensure no single party has excessive control over network validation. The system requires high overlap (up to 90%) between different servers' UNLs to prevent network forks.

### Key Concepts and Terminology
• **UNL (Unique Node List)** - List of trusted validators for consensus
• **Validators** - Impartial nodes that process transactions and vote on ledger validation
• **UNL Overlap** - Percentage of shared validators between different servers' UNLs
• **Fork** - Network split where different sides cannot agree on transaction validity
• **Recommended Validator Lists** - Published lists of quality validators for easy UNL configuration
• **Default UNL (dUNL)** - Standard validator set published by XRP Ledger Foundation and Ripple
• **Publisher** - Entity that creates and maintains recommended validator lists
• **Supermajority** - >80% agreement threshold required for transaction confirmation

### Main Technical Details
The consensus mechanism requires validators to be online, operational, and impartial in processing transactions. Research determined that 90% UNL overlap is necessary to prevent forks in worst-case scenarios, significantly limiting customization flexibility. The system uses recommended validator lists with JSON format containing signed binary data, including sequence numbers, expiration times, and activation dates for coordinated updates. Publishers sign lists with public keys and distribute them via websites or peer-to-peer networks.

### Practical Applications
Server operators can configure UNLs using recommended lists from trusted publishers, with the default configuration using lists from XRP Ledger Foundation and Ripple. The system allows multiple publisher lists to be combined, creating a union of all validators across lists. This approach ensures network reliability while maintaining decentralization through diverse validator representation.

### Important Warnings and Limitations
Server operators must carefully select validator list publishers as their choices significantly impact network reliability. The 90% overlap requirement severely limits UNL customization options compared to the initially believed 60% threshold. Publishers wield considerable power in validator selection despite not participating in daily validation, making their trustworthiness crucial for network stability.

---

## https://xrpl.org/docs/concepts/consensus-protocol/invariant-checking

# XRPL Invariant Checking Documentation Summary

## Overview
Invariant checking is a critical safety feature of the XRP Ledger that acts as a second layer of validation, automatically examining every transaction's results before they're committed to the ledger. This system ensures that fundamental rules of the XRP Ledger are never violated, even if bugs exist in the main transaction processing code. If a transaction would break any invariant, it's rejected with a `tecINVARIANT_FAILED` result code and included in the ledger with no effects.

## Key Concepts and Terminology
• **Invariants** - Fundamental rules that must always hold true across all XRPL transactions
• **Real-time validation** - Invariant checks run automatically after each transaction before commitment
• **tecINVARIANT_FAILED** - Result code for transactions rejected due to invariant violations
• **tefINVARIANT_FAILED** - Result code for transactions that fail invariants during minimal processing
• **Safety layer** - Secondary validation system separate from normal transaction processing
• **Ledger integrity** - Protection against bugs that could corrupt the network or halt operations

## Main Technical Details and Processes
The invariant checker operates as an automated real-time validation system that examines transaction results before ledger commitment. The system includes 12+ active invariants covering:

**Core XRP Protection:**
- Transaction Fee Check: Validates fees are non-negative and within specified limits
- XRP Not Created: Ensures transactions only destroy XRP (via fees), never create it
- XRP Balance Checks: Enforces XRP balances stay between 0 and 100 billion XRP

**Account and Ledger Integrity:**
- Account Roots Not Deleted: Prevents account deletion except via AccountDelete transactions
- Ledger Entry Types Match: Ensures modified entries maintain correct types
- Valid New Account Root: Validates new accounts are created properly with correct sequences

**Asset and Trading Rules:**
- No XRP Trust Lines: Prevents creation of trust lines using XRP
- No Bad Offers: Ensures offers are for positive amounts and not XRP-to-XRP
- No Zero Escrow: Validates escrow entries hold appropriate XRP amounts

**NFT-Specific Validations:**
- ValidNFTokenPage: Ensures NFT minting/burning only occurs via proper transactions
- NFTokenCountTracking: Validates NFT page organization, sorting, and ownership

## Practical Applications and Use Cases
• **Network Protection**: Prevents bugs in transaction processing from corrupting the entire XRPL network
• **Data Integrity**: Ensures ledger data remains consistent and valid across all operations
• **Trust Maintenance**: Preserves confidence in the XRP Ledger by preventing impossible states
• **Development Safety**: Provides protection against future bugs in code updates or modifications
• **Automatic Validation**: Requires no manual intervention - operates transparently on every transaction
• **Debugging Aid**: Failed invariants help identify specific problems when transactions are rejected

## Important Warnings, Limitations, and Considerations
**Critical Limitations:**
- Invariant failures indicate serious problems that could potentially halt the entire network
- Transactions failing invariant checks are still included in the ledger (with tec codes) but have no effects
- The system is designed as a last resort - invariants should theoretically never trigger in normal operation

**Important Considerations:**
- Failed invariants suggest bugs in the main transaction processing code that need immediate attention
- The complexity of XRPL code makes invariant checking essential for maintaining network reliability
- Developers should understand these limits as they define hard boundaries for transaction processing
- Invariant violations are logged as fatal errors and require investigation to prevent network instability

---

## https://xrpl.org/docs/concepts/consensus-protocol/fee-voting

## Overview

Fee voting is XRPL's mechanism for validators to collectively adjust network fees, including transaction costs and reserve requirements. Validators express their preferences every 15 minutes, and the network automatically adopts the median of trusted validators' preferences to balance network accessibility with spam protection.

## Key Concepts and Terminology

• **Reference transaction cost** - Base fee in drops (1 XRP = 1 million drops) destroyed for cheapest transactions
• **Account reserve** - Minimum XRP required to maintain an account 
• **Owner reserve** - Additional XRP required for each ledger object owned
• **Flag ledger** - Every 256th ledger where fee voting occurs
• **SetFee pseudo-transaction** - Transaction type that implements fee changes
• **Drops** - Smallest unit of XRP (0.000001 XRP)

## Main Technical Details

The voting process follows a 4-ledger cycle: validators submit votes in the ledger before a flag ledger, tally votes in the flag ledger, insert SetFee pseudo-transactions in the next ledger, and implement changes in the following ledger. Validators configure preferences in their rippled.cfg file and the network adopts the median values. When there's a tie between two median values, the system chooses the option closer to current settings.

## Practical Applications

Fee voting allows the network to adapt to XRP price fluctuations and changing network conditions while maintaining decentralized governance. Validators can adjust fees to keep transaction costs reasonable for users while ensuring adequate spam protection and resource management.

## Important Warnings and Limitations

Insufficient fees adopted by >50% of trusted validators could expose the network to denial-of-service attacks. Conservative approaches are recommended, especially when lowering reserves, as increases are more disruptive than decreases. The XRPFees amendment removed previous maximum fee limitations, allowing more flexible fee setting.

---

## https://xrpl.org/docs/concepts/consensus-protocol/negative-unl

# Negative UNL - XRPL Documentation Summary

## Overview
The Negative UNL (Unique Node List) is a consensus protocol feature that improves the XRP Ledger's ability to maintain forward progress during partial network outages. It allows the network to temporarily exclude offline or malfunctioning validators from consensus requirements, enabling continued validation even when trusted validators are unavailable.

## Key Concepts and Terminology
• **Negative UNL** - A list of trusted validators believed to be offline or malfunctioning
• **Liveness** - The network's ability to make forward progress during outages
• **Quorum** - 80% of trusted validators needed for consensus (minimum 60% of total validators)
• **Reliability Score** - Percentage of last 256 ledgers where a validator's vote matched consensus
• **Flag Ledger** - Ledgers divisible by 256 where Negative UNL modifications occur
• **UNL (Unique Node List)** - List of validators a server trusts not to collude

## Main Technical Details
• Validators with reliability scores below 50% become candidates for Negative UNL inclusion
• Validators need reliability scores above 80% to be removed from Negative UNL
• Changes only occur on flag ledgers (approximately every 15 minutes)
• Maximum 25% of validators can be on Negative UNL simultaneously
• Consensus of remaining validators required to modify the Negative UNL
• No impact on transaction processing, only on validation finality

## Practical Applications
• Maintains network operation during validator maintenance or upgrades
• Handles temporary connectivity issues between validators
• Provides resilience against targeted attacks on specific validators
• Enables gradual adjustment to validator availability changes
• Supports network stability during hardware failures or natural disasters

## Important Warnings and Limitations
• Hard minimum of 60% of total validators required for any consensus
• If more than 20% of validators go offline simultaneously, network may halt validation
• Validators cannot propose adding themselves to Negative UNL
• Changes occur slowly to prevent time-based disagreements
• No effect in stand-alone server mode
• Network fragmentation risk if quorum thresholds aren't maintained
