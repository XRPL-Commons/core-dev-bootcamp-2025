# XRPL Storage Systems Quiz - Day 3
**Blockchain Knowledge: NodeStore, SHAMap, and SQL Database**

## Section A: NodeStore

### Question 1
**Multiple Choice:** What are the four main NodeObjectType enum values used in XRPL NodeStore?

a) hotLEDGER, hotACCOUNT, hotTRANSACTION, hotDUMMY  
b) hotLEDGER, hotACCOUNT_NODE, hotTRANSACTION_NODE, hotDUMMY  
c) hotLEDGER, hotACCOUNT_NODE, hotTRANSACTION_NODE, hotUNKNOWN  
d) hotLEDGER, hotACCOUNT_NODE, hotTRANSACTION_NODE, hotVALID

### Question 2
**Short Answer:** Explain the difference between `DatabaseNodeImp` and `DatabaseRotatingImp`. When would you use each?

### Question 3
**Multiple Choice:** Which backend types are marked as "Preferred" in the NodeStore?

a) RocksDB and LevelDB  
b) NuDB and SQLite  
c) RocksDB and NuDB  
d) Memory and SQLite

### Question 4
**True/False:** The NodeStore cache uses a `hotDUMMY` object type to mark missing entries in the cache.

### Question 5
**Short Answer:** What are the batch write limits defined in the NodeStore, and why are these limits important?

---

## Section B: SHAMap

### Question 6
**Multiple Choice:** What is the radix (branching factor) of the SHAMap tree structure?

a) 8  
b) 16  
c) 32  
d) 256

### Question 7
**Short Answer:** Explain the copy-on-write (COW) mechanism in SHAMap. How does the `cowid` field work, and why is this important for node sharing?

### Question 8
**Multiple Choice:** Which traversal method would you use to visit only the leaf nodes of a SHAMap?

a) visitNodes  
b) visitLeaves  
c) walkMap  
d) getMissingNodes

### Question 9
**True/False:** Immutable SHAMaps can be trimmed to remove unnecessary nodes from memory.

### Question 10
**Short Answer:** What is the purpose of the `getMissingNodes` function, and in what scenario would it be used during XRPL synchronization?

---

## Section C: SQL Database

### Question 11
**Multiple Choice:** Which database backend is currently supported by XRPL's SQLDatabase?

a) PostgreSQL only  
b) MySQL only  
c) SQLite only  
d) Both PostgreSQL and SQLite

### Question 12
**Short Answer:** What are the two main database connections managed by `SQLiteDatabaseImp`, and what is each used for?

### Question 13
**Multiple Choice:** What happens when the `useTxTables` configuration option is set to false?

a) The database will not start  
b) Transaction-related tables are not created and transaction queries return early  
c) Only ledger data is stored, but transaction queries still work  
d) The system switches to a different database backend

### Question 14
**Short Answer:** Explain the purpose of WAL checkpointing in SQLite and how it's implemented in the XRPL database system.

### Question 15
**Multiple Choice:** Which safety levels are available for the SQLite configuration, and what do they control?

a) "safe", "normal", "fast" - controlling backup frequency  
b) "high", "medium", "low" - controlling journal_mode, synchronous, and temp_store settings  
c) "strict", "relaxed", "disabled" - controlling transaction isolation  
d) "full", "partial", "none" - controlling data validation

---

## Section D: Integration and Architecture

### Question 16
**Short Answer:** Describe the relationship between NodeStore and SQL Database in XRPL. What type of data does each system store, and why are both needed?

### Question 17
**True/False:** The SHAMap's Merkle tree property allows O(1) comparison of entire trees by comparing root hashes.

### Question 18
**Short Answer:** How does the `TaggedCache` work in the NodeStore system, and what are its eviction policies?
