# 🚀 Ripple(d) Storage Systems: 1.5-Hour Dev Challenge Series

## 📅 Format
- **Time per challenge:** 1.5 hours
- **Team size:** 6 developers per team
- **Goal:** Locate initialization code, understand integration, and write functional tests

## 🌲 Team 1: SHAMap Deep Dive

### 🔍 Focus
Explore how the Ripple SHAMap stores and secures ledger state as a Merkle radix trie

### ✅ Tasks
- **Find SHAMap initialization code in the Ripple(d) codebase**
  - Locate where SHAMapInnerNode and SHAMapLeafNode are instantiated
  - Identify how the root node is created and managed
- **Write a test that demonstrates SHAMap functionality:**
  - Use existing SHAMap tests as examples
  - Test inserting a key-value pair and retrieving it via radix trie navigation
  - Verify Merkle tree hash calculation from leaf to root
- **Document the path from your test data through the trie structure**

## 🧩 Team 2: NodeStore Deep Dive

### 🔍 Focus
Explore how Ripple(d) NodeStore handles ledger data storage and retrieval

### ✅ Tasks
- **Find NodeStore initialization code in the Ripple(d) codebase**
  - Locate NodeStore backend setup (RocksDB, NuDB, etc.)
  - Identify where NodeStore connects to the ledger system
- **Write a test based on existing NodeStore test patterns:**
  - Test storing and retrieving a ledger object by hash key
  - Use the NodeStore.Timing test structure as reference
  - Verify data integrity after storage/retrieval cycle
- **Run the existing `NodeStore.Timing` unittest and document results**

## 🗃️ Team 3: SQL Deep Dive

### 🔍 Focus
SQL database in Ripple(d) for transaction history and ledger metadata

### ✅ Tasks
- **Find RelationalDatabase initialization code in the Ripple(d) codebase**
  - Locate database connection setup in `xrpld/app/rdb`
  - Identify where SQL schema is created and managed
- **Write a test that exercises SQL functionality:**
  - Use existing relational database tests as examples
  - Test inserting transaction data and querying it back
  - Verify the three SQL queries: last validated ledger, account transactions, transaction counts
- **Document how RelationalDatabase integrates with NodeStore and SHAMap**