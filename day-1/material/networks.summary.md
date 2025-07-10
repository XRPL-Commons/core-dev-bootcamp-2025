## https://xrpl.org/docs/concepts/networks-and-servers/peer-protocol

# XRPL Peer Protocol Documentation Summary

## Overview
The XRP Ledger peer protocol defines how rippled servers communicate with each other across the network. It serves as the primary communication method for all network operations, including transaction sharing, ledger data requests, and consensus proposals. Servers establish connections using HTTPS with an upgrade to the XRPL/2.0 protocol.

## Key Concepts and Terminology
• **Peer Protocol** - Communication language between XRPL servers
• **Gossip Protocol** - Method for peer discovery and network connection
• **Node Key Pair** - Cryptographic identity for each server in peer communications
• **Fixed Peers** - Permanently connected peers based on IP addresses
• **Peer Reservations** - Priority connections identified by node keys
• **Private Peers** - Servers with hidden IP addresses for security
• **Public Hubs** - Hardcoded fallback servers for initial connections
• **Overlay Network** - Peer-to-peer network layered over the internet

## Main Technical Details
The protocol uses port 2459 (IANA assigned) or 51235 (legacy default) for peer connections. Servers discover peers through a gossip protocol, starting with hardcoded public hubs and expanding through peer referrals. Each server generates a unique node key pair for message signing and identity verification. Connection establishment involves HTTPS upgrade requests to switch to the XRPL protocol. The system supports both incoming and outgoing connections with configurable peer limits and reservation systems.

## Practical Applications
• **Network Participation** - Enables servers to join and maintain connections in the XRPL network
• **Transaction Broadcasting** - Facilitates sharing of candidate transactions across the network
• **Consensus Operations** - Supports proposal and validation of transaction sets
• **Data Synchronization** - Allows historical ledger data requests and sharing
• **Server Clustering** - Enables grouping of related servers for improved reliability
• **Validator Protection** - Private peer configuration protects important validators from attacks

## Important Warnings and Considerations
Servers should configure firewall port forwarding for optimal peer connectivity. Private servers require at least one non-private connection to participate in the network. Deleting server databases creates a new node identity unless a node_seed is configured. All peers are treated as untrusted unless explicitly clustered, requiring cryptographic verification of all communications. Fixed peer configurations require server restarts to take effect, while peer reservations can be adjusted during operation.

---

## https://xrpl.org/docs/concepts/networks-and-servers/transaction-censorship-detection

# XRPL Transaction Censorship Detection - Comprehensive Summary

## Overview
The XRP Ledger includes an automated transaction censorship detector (introduced in rippled 1.2.0) that monitors all rippled servers to identify when transactions are potentially being censored by the network. This system tracks transactions that should have been included in validated ledgers and issues warnings when transactions remain unprocessed after multiple consensus rounds, supporting the XRP Ledger's censorship-resistant design.

## Key Concepts and Terminology
• **Transaction Censorship Detector** - Automated system that tracks potentially censored transactions
• **Tracker** - Component that monitors transactions from consensus proposals through validation
• **Consensus Rounds** - Cycles where transactions are proposed and validated into ledgers
• **Validated Ledger** - Final ledger state after consensus completion
• **False Positives** - Innocent scenarios that trigger censorship warnings
• **Warning/Error Messages** - Log alerts issued when transactions remain unprocessed

## Main Technical Details and Processes
The detector operates through a three-step process: (1) adds all transactions from the server's initial consensus proposal to the tracker, (2) removes transactions that get included in the resulting validated ledger after consensus, and (3) issues warning messages for transactions remaining in the tracker for 15 ledgers or more. The system escalates alerts by issuing warnings every 15 ledgers up to five times, then issues a final error message after 75 ledgers before stopping notifications. All messages include transaction IDs, starting ledger numbers, and current ledger positions for investigation purposes.

## Practical Applications and Use Cases
• **Network Monitoring** - Enables all network participants to detect potential censorship attempts
• **Server Diagnostics** - Helps identify server synchronization issues or bugs
• **Network Health Assessment** - Provides transparency into transaction processing across the network
• **Compliance Verification** - Supports the XRP Ledger's censorship-resistant design goals
• **Bug Detection** - Can reveal transaction relay issues or processing inconsistencies

## Important Warnings, Limitations, and Considerations
The detector frequently produces false positives that require investigation before assuming malicious censorship. Common innocent causes include running incompatible server builds, server synchronization issues, or bugs in transaction relay mechanisms. Users should investigate flagged transactions starting with the assumption that causes are more likely innocent bugs rather than malicious censorship. The system only functions when the rippled server is properly synced with the network, and running compatible versions of the core XRP Ledger server is crucial to avoid false positives.

---

## https://xrpl.org/docs/concepts/networks-and-servers/parallel-networks

# XRPL Parallel Networks Documentation Summary

## Overview
The XRP Ledger operates one production network (Mainnet) alongside several alternative test networks (altnets) that allow developers to experiment with XRPL technology without affecting real transactions or risking actual money. These parallel networks are determined by each server's configured UNL (Unique Node List) - the validators it trusts for consensus.

## Key Concepts and Terminology
• **Mainnet** - The production XRP Ledger network where all real business occurs
• **Altnets** - Alternative networks for testing and development
• **UNL (Unique Node List)** - List of validators a server trusts for consensus
• **Test XRP** - Free cryptocurrency with no real-world value used on test networks
• **Consensus groups** - Validators that trust each other and form parallel networks

## Main Technical Details
The primary technical mechanism separating networks is the UNL configuration - servers follow whichever network contains their trusted validators. Different consensus groups create parallel networks even if servers connect to multiple networks, as long as they don't trust validators from other networks beyond their quorum settings. Test networks are typically centralized and operated by Ripple, making them resettable but less stable than Mainnet.

## Available Networks and Applications
• **Testnet** - Stable testing environment mirroring Mainnet amendments
• **Devnet** - Beta testing for unstable core software changes  
• **Hooks V3 Testnet** - Smart contract functionality preview
• **Sidechain-Devnet** - Cross-chain bridge feature testing with library support

## Important Warnings and Limitations
Test networks are centralized with no guarantees of stability or availability, unlike the decentralized Mainnet. Test XRP has no real value and is lost when networks reset, and these networks are primarily used for testing server configurations and network performance rather than production use.

---

## https://xrpl.org/docs/concepts/networks-and-servers/amendments

# XRPL Amendments Documentation Summary

## Overview
Amendments are the XRP Ledger's formal mechanism for implementing new features or changes to transaction processing rules. The system uses a consensus-based voting process where validators must achieve over 80% support for two weeks before any amendment becomes permanently enabled on the network.

## Key Concepts and Terminology
• **Amendment** - New features or changes to transaction processing that require network consensus
• **Flag Ledger** - Every 256th ledger where the amendment voting process occurs (approximately every 15 minutes)
• **EnableAmendment pseudo-transaction** - Special transaction that tracks amendment status changes
• **Amendment Blocked** - Security state where outdated servers cannot participate in network operations
• **Vetoed Amendments** - Amendments whose source code was removed before activation
• **Retired Amendments** - Amendments integrated into core protocol after 2+ years of activation

## Main Technical Details
The amendment process follows a structured timeline around flag ledgers: validators submit votes at Flag Ledger -1, votes are interpreted at Flag Ledger, status changes are recorded via pseudo-transactions at Flag Ledger +1, and amendments take effect at Flag Ledger +2. Amendments require sustained 80% validator support for two weeks, and if support drops below this threshold, the two-week countdown resets. Amendment-blocked servers cannot validate ledgers, process transactions, or participate in consensus until upgraded to compatible software versions.

## Practical Applications
Amendments enable the XRP Ledger to evolve with new features like multi-signing, payment channels, and escrow functionality while maintaining network consensus. Validators can configure their voting preferences for each amendment, and network operators must stay current with software updates to avoid being blocked from network participation.

## Important Warnings and Considerations
Amendment blocking is a critical security feature that prevents outdated servers from misinterpreting ledger data, but it completely disables their network functionality until upgraded. All amendments are considered irreversible once enabled, with no mechanism to disable them except through new amendments. Servers connecting to networks with different amendment sets (like Devnet) may become blocked if they lack the required amendment code.