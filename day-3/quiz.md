# XRPL Storage Systems Quiz - Day 3
**Blockchain Knowledge: NodeStore, SHAMap, and SQL Database**

## Section A: NodeStore (25 points)

### Question 1 (5 points)
**Multiple Choice:** What are the four main NodeObjectType enum values used in XRPL NodeStore?

a) hotLEDGER, hotACCOUNT, hotTRANSACTION, hotDUMMY  
b) hotLEDGER, hotACCOUNT_NODE, hotTRANSACTION_NODE, hotDUMMY  
c) hotLEDGER, hotACCOUNT_NODE, hotTRANSACTION_NODE, hotUNKNOWN  
d) hotLEDGER, hotACCOUNT_NODE, hotTRANSACTION_NODE, hotVALID

### Question 2 (5 points)
**Short Answer:** Explain the difference between `DatabaseNodeImp` and `DatabaseRotatingImp`. When would you use each?

### Question 3 (5 points)
**Multiple Choice:** Which backend types are marked as "Preferred" in the NodeStore?

a) RocksDB and LevelDB  
b) NuDB and SQLite  
c) RocksDB and NuDB  
d) Memory and SQLite

### Question 4 (5 points)
**True/False:** The NodeStore cache uses a `hotDUMMY` object type to mark missing entries in the cache.

### Question 5 (5 points)
**Short Answer:** What are the batch write limits defined in the NodeStore, and why are these limits important?

---

## Section B: SHAMap (30 points)

### Question 6 (5 points)
**Multiple Choice:** What is the radix (branching factor) of the SHAMap tree structure?

a) 8  
b) 16  
c) 32  
d) 256

### Question 7 (10 points)
**Short Answer:** Explain the copy-on-write (COW) mechanism in SHAMap. How does the `cowid` field work, and why is this important for node sharing?

### Question 8 (5 points)
**Multiple Choice:** Which traversal method would you use to visit only the leaf nodes of a SHAMap?

a) visitNodes  
b) visitLeaves  
c) walkMap  
d) getMissingNodes

### Question 9 (5 points)
**True/False:** Immutable SHAMaps can be trimmed to remove unnecessary nodes from memory.

### Question 10 (5 points)
**Short Answer:** What is the purpose of the `getMissingNodes` function, and in what scenario would it be used during XRPL synchronization?

---

## Section C: SQL Database (25 points)

### Question 11 (5 points)
**Multiple Choice:** Which database backend is currently supported by XRPL's SQLDatabase?

a) PostgreSQL only  
b) MySQL only  
c) SQLite only  
d) Both PostgreSQL and SQLite

### Question 12 (5 points)
**Short Answer:** What are the two main database connections managed by `SQLiteDatabaseImp`, and what is each used for?

### Question 13 (5 points)
**Multiple Choice:** What happens when the `useTxTables` configuration option is set to false?

a) The database will not start  
b) Transaction-related tables are not created and transaction queries return early  
c) Only ledger data is stored, but transaction queries still work  
d) The system switches to a different database backend

### Question 14 (5 points)
**Short Answer:** Explain the purpose of WAL checkpointing in SQLite and how it's implemented in the XRPL database system.

### Question 15 (5 points)
**Multiple Choice:** Which safety levels are available for the SQLite configuration, and what do they control?

a) "safe", "normal", "fast" - controlling backup frequency  
b) "high", "medium", "low" - controlling journal_mode, synchronous, and temp_store settings  
c) "strict", "relaxed", "disabled" - controlling transaction isolation  
d) "full", "partial", "none" - controlling data validation

---

## Section D: Integration and Architecture (20 points)

### Question 16 (10 points)
**Short Answer:** Describe the relationship between NodeStore and SQL Database in XRPL. What type of data does each system store, and why are both needed?

### Question 17 (5 points)
**True/False:** The SHAMap's Merkle tree property allows O(1) comparison of entire trees by comparing root hashes.

### Question 18 (5 points)
**Short Answer:** How does the `TaggedCache` work in the NodeStore system, and what are its eviction policies?

---

## Bonus Questions (10 points)

### Bonus Question 1 (5 points)
**Challenge:** If you were designing a new storage backend for NodeStore, what key interface methods would you need to implement, and what performance considerations would be most important?

### Bonus Question 2 (5 points)
**Challenge:** Explain how the SHAMap proof system works. How would you verify that a specific piece of data exists in a SHAMap without having access to the entire map?