## https://xrpl.org/docs/concepts/accounts/index

## XRPL Accounts Documentation Summary

**Overview:**
An Account in the XRP Ledger represents a holder of XRP and sender of transactions, consisting of an address, XRP balance, sequence number, and transaction history. Accounts are created automatically when receiving sufficient XRP funding, with no dedicated "create account" transaction required.

**Key Concepts and Terminology:**
• **Address** - Unique identifier (e.g., rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn)
• **Sequence Number** - Ensures transactions are applied in correct order and only once
• **Reserve** - Portion of XRP balance set aside and locked
• **AccountRoot** - Ledger entry storing account's core data
• **Trust Lines** - Accounting relationships for non-XRP assets
• **Multi-signing** - Multiple cryptographic signatures for authorization
• **Black Hole** - Address with no known secret key where XRP is lost forever

**Main Technical Details:**
Accounts store core data in AccountRoot ledger entries including address, XRP balance, sequence number, and transaction history. Authorization methods include master key pairs (intrinsic but can be disabled), regular key pairs (rotatable), and signer lists for multi-signing. Account creation occurs through Payment transactions that fund mathematically-valid addresses with sufficient XRP.

**Practical Applications:**
Primary use cases include sending/receiving XRP payments, holding XRP balances, and serving as connection points for Trust Lines that enable trading of other currencies and assets on the XRPL.

**Important Warnings and Limitations:**
Funding an account requires paying the account reserve (currently locks up XRP indefinitely), and funding does not grant control over the account - only possession of the secret key provides account access. Users should consider whether direct XRPL account ownership justifies the reserve cost compared to exchange-held accounts.

---

## https://xrpl.org/docs/concepts/accounts/addresses

# XRPL Addresses Documentation Summary

## Overview
XRPL addresses are unique identifiers for XRP Ledger accounts using base58 encoding format. Addresses are mathematically derived from cryptographic key pairs and can be generated entirely offline without communicating with the XRP Ledger network.

## Key Concepts and Terminology
• **Address** - Unique identifier for XRPL accounts in base58 format
• **Account ID** - RIPEMD160 hash of SHA-256 hash of public key (20 bytes)
• **Black hole addresses** - Addresses not derived from known secret keys, making funds permanently inaccessible
• **Type prefix** - One-byte prefix (0x00 for addresses) to distinguish different encoded data types
• **Base58 encoding** - Encoding method using custom dictionary starting with 'r'
• **Checksum** - First 4 bytes of double SHA-256 hash for error detection

## Main Technical Details
The address generation process involves:
1. Starting with 33-byte ECDSA secp256k1 or 32-byte Ed25519 public key
2. Computing RIPEMD160(SHA-256(public_key)) to get Account ID
3. Adding type prefix (0x00) and calculating checksum via double SHA-256
4. Concatenating payload and checksum, then base58 encoding the result

Special encoding considerations include prefixing Ed25519 keys with 0xED byte and using the custom base58 dictionary "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz".

## Practical Applications
• **Account creation** - Any valid address becomes an account when funded with XRP
• **Transaction signing** - Addresses identify transaction senders (must be funded accounts)
• **Key management** - Addresses can represent regular keys or signer list members
• **Offline generation** - Addresses can be created without network connectivity
• **Trust lines** - Used in RippleState entries for token relationships

## Important Warnings and Limitations
**Critical:** Funds sent to black hole addresses are permanently lost since no one controls the private keys. The one-way hash function makes it impossible to derive public keys from addresses alone, which is why transactions must include both the public key and address. Several special addresses exist with historical significance, including ACCOUNT_ZERO and ACCOUNT_ONE used for internal protocol functions, and various black hole addresses that have consumed XRP permanently.

---

## https://xrpl.org/docs/concepts/accounts/reserves

# XRPL Reserves Documentation Summary

## Overview
The XRP Ledger implements reserve requirements to prevent spam and maintain ledger efficiency by requiring accounts to hold minimum amounts of XRP. These reserves consist of a base reserve for account existence and owner reserves for each ledger object owned, with requirements adjustable through validator consensus.

## Key Concepts and Terminology
• **Base Reserve** - Minimum XRP required for any address to exist in the ledger
• **Owner Reserve** - Additional XRP required for each object owned by an account
• **Owner Count** - Number of objects an account owns that count toward reserves
• **Fee Voting** - Consensus process for adjusting reserve requirements
• **Incremental Reserve** - Per-item cost for owned objects

## Main Technical Details
The current mainnet requirements are a base reserve plus owner reserve per item owned. Objects counting toward reserves include Checks, Escrows, NFT Offers, Payment Channels, Trust Lines, and others. Special cases exist for NFTs (grouped in pages of up to 32), Trust Lines (shared between accounts), and Oracles (1-2 items based on PriceData objects). Reserve calculations use the formula: (OwnerCount × incremental_reserve) + base_reserve.

## Practical Applications
Reserves prevent ledger bloat while allowing normal operations - reserved XRP can pay transaction fees and be recovered by deleting accounts or objects. Applications can query current reserves using server_info or server_state methods, and calculate account requirements using the account_info method's OwnerCount field.

## Important Warnings and Limitations
Accounts below reserve requirements cannot send XRP or create new objects but can still receive transactions and use OfferCreate to acquire XRP. Transaction fees can reduce balances below reserves, potentially consuming all XRP. The first two trust lines have special reserve exemptions if funded with exactly the base reserve amount.

---

## https://xrpl.org/docs/concepts/accounts/cryptographic-keys

## XRPL Cryptographic Keys Documentation Summary

**Overview:**
The XRP Ledger uses cryptographic key pairs to authorize transactions through digital signatures, which are the only method for transaction authorization with no administrative override capabilities. Key pairs can function as master keys, regular keys, or signer list members regardless of the cryptographic algorithm used to generate them.

**Key Concepts and Terminology:**
• **Digital Signature** - Authorizes transactions for execution on the XRP Ledger
• **Key Pair** - Mathematical connection between private key (secret) and public key (public)
• **Seed** - Compact value used to derive private and public keys
• **Account ID** - Core 20-byte identifier derived from public key
• **Classic Address** - Base58 representation of Account ID with checksum
• **X-Address** - Combined Account ID and Destination Tag in base58 format
• **Master Key Pair** - Primary cryptographic keys for an account
• **Regular Key Pair** - Alternative signing keys that can be changed
• **Passphrase** - Optional input for generating seeds (less secure than random generation)

**Main Technical Details:**
The key derivation process flows from passphrase → seed → private key → public key → Account ID ↔ address. The system supports multiple cryptographic signing algorithms (Ed25519 and secp256k1), with different tools having different defaults. Private keys, seeds, and passphrases are secret information requiring careful protection, while public keys, Account IDs, and addresses are safe to share publicly. Account IDs don't necessarily represent funded accounts until they receive XRP to meet reserve requirements.

**Practical Applications:**
Key pairs enable transaction signing and account control, support multi-signing configurations, and allow for regular key rotation without changing the account address. The system accommodates both technical users who manage keys directly and applications that handle key management automatically.

**Important Warnings and Limitations:**
Critical security warning: compromised secret information (private key, seed, or passphrase) grants full account control with no recovery mechanism. Users must only generate keys with trusted devices and software, as compromised applications can expose secrets to malicious actors. Different tools may generate different addresses from the same seed unless the cryptographic algorithm is explicitly specified.