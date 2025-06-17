# SQLDatabase Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the SQLDatabase (specifically, the SQLite-based relational database) functionality in the XRPL (XRP Ledger) source code. It covers every aspect of the SQLDatabase, including its architecture, initialization, configuration, schema, connection management, checkpointing, query and mutation operations, space usage, and integration with the rest of the XRPL node. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [SQLDatabase Overview](#sqldatabase-overview)
- [Backend Support and Limitations](#backend-support-and-limitations)
- [RelationalDatabase Interface and Initialization](#relationaldatabase-interface-and-initialization)
  - [RelationalDatabase::init](#relationaldatabaseinit)
  - [Backend Selection and Configuration](#backend-selection-and-configuration)
- [SQLiteDatabase and SQLiteDatabaseImp](#sqlitedatabase-and-sqlitedatabaseimp)
  - [Class Structure](#class-structure)
  - [Constructor and Database Setup](#constructor-and-database-setup)
  - [Database Connections: DatabaseCon](#database-connections-databasecon)
- [Database Schema and Initialization](#database-schema-and-initialization)
  - [Ledger Database Schema (LgrDBInit)](#ledger-database-schema-lgrdbinit)
  - [Transaction Database Schema (TxDBInit)](#transaction-database-schema-txdbinit)
  - [Secondary Databases: Wallet, Manifest, PeerFinder, State](#secondary-databases-wallet-manifest-peerfinder-state)
- [Database Connection Setup and Pragmas](#database-connection-setup-and-pragmas)
  - [setup_DatabaseCon](#setup_databasecon)
  - [Configuration Options Table](#configuration-options-table)
  - [Pragma Settings](#pragma-settings)
- [Checkpointing and Durability](#checkpointing-and-durability)
- [Database Operations and Methods](#database-operations-and-methods)
  - [Ledger Sequence Queries](#ledger-sequence-queries)
  - [Deletion and Cleanup](#deletion-and-cleanup)
  - [Counting and Space Usage](#counting-and-space-usage)
  - [Ledger and Transaction Info Retrieval](#ledger-and-transaction-info-retrieval)
  - [Account Transaction Queries and Pagination](#account-transaction-queries-and-pagination)
  - [Transaction Retrieval by ID](#transaction-retrieval-by-id)
  - [Database Space Checking](#database-space-checking)
  - [Database Closing](#database-closing)
- [Free Functions and File Coverage](#free-functions-and-file-coverage)
- [NodeStore/Non-Relational Database](#nodestore-non-relational-database)
- [Error Handling and Edge Cases](#error-handling-and-edge-cases)
- [Optional Features (useTxTables)](#optional-features-usetxtables)
- [Checkpointing Details](#checkpointing-details)
- [Schema Evolution/Migrations](#schema-evolutionmigrations)
- [References to Source Code](#references-to-source-code)

---

## SQLDatabase Overview

- The SQLDatabase in XRPL is responsible for storing and managing ledger and transaction data using a relational database backend.
- The primary implementation is SQLite, managed through the SOCI C++ database access library.
- The database is used for:
  - Storing validated ledgers and their metadata.
  - Storing transactions and their metadata.
  - Supporting queries for ledger and transaction history, account transaction pagination, and space usage.
  - Enabling online deletion and rotation of old ledger data.
- The SQLDatabase is initialized and managed via the `RelationalDatabase` interface, with concrete implementations for SQLite (`SQLiteDatabaseImp`).

---

## Backend Support and Limitations

- **Only SQLite is supported.** Although the interface and some comments mention `PostgresDatabase`, there is no implementation or support for Postgres in the codebase. Any attempt to configure a backend other than SQLite will result in a runtime error.
- **Configuration:** The `[relational_db]` section with `backend=sqlite` is required for SQLite. If the section is missing, SQLite is used by default.
- **Reference:** [src/xrpld/app/rdb/detail/RelationalDatabase.cpp.txt], [src/xrpld/app/rdb/README.md]

---

## RelationalDatabase Interface and Initialization

### RelationalDatabase::init

- The entry point for initializing the SQLDatabase is the static method `RelationalDatabase::init` ([src/xrpld/app/rdb/detail/RelationalDatabase.cpp.txt]):
  - Checks the configuration for a `[relational_db]` section and a `backend` key.
  - If the backend is `"sqlite"` or the section is missing, it creates and returns a SQLite-based `RelationalDatabase`.
  - If the backend is set to any other value, it throws a runtime error.
  - No other database types are supported in this function.

### Backend Selection and Configuration

- The configuration section `[relational_db]` with `backend=sqlite` is required for SQLite.
- If the section is missing, SQLite is used by default.
- The function `getSQLiteDatabase` is called to create the actual database instance.

---

## SQLiteDatabase and SQLiteDatabaseImp

### Class Structure

- `SQLiteDatabase` is an abstract interface derived from `RelationalDatabase` ([src/xrpld/app/rdb/backend/SQLiteDatabase.h.txt]).
- `SQLiteDatabaseImp` is the concrete implementation ([src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt]).
- The class manages two main database connections:
  - `lgrdb_`: for the ledger database.
  - `txdb_`: for the transaction database (optional, depending on config).

### Constructor and Database Setup

- The constructor of `SQLiteDatabaseImp` ([src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt]):
  - Initializes member variables with the application, configuration, and logging.
  - Prepares a database connection setup struct using `setup_DatabaseCon`.
  - Calls `makeLedgerDBs` to create and initialize the main ledger and transaction databases, including setting up checkpointing and applying all required SQLite settings.
  - If any part of the database creation fails, logs a fatal error and throws an exception, preventing the object from being constructed.

### Database Connections: DatabaseCon

- `DatabaseCon` ([src/xrpld/core/DatabaseCon.h.txt]) encapsulates a thread-safe connection to a SQLite database using SOCI.
- It supports initialization with custom SQLite pragmas and SQL, and optional checkpointing for durability.
- The constructor applies PRAGMA settings, executes schema initialization SQL, and sets up checkpointing if requested.
- The class provides methods for session access, thread safety, and performance logging.

---

## Database Schema and Initialization

### Ledger Database Schema (LgrDBInit)

- The ledger database schema is defined in `LgrDBInit` ([src/xrpld/app/main/DBInit.h.txt]) as an array of SQL statements:

1. BEGIN TRANSACTION;
2. CREATE TABLE IF NOT EXISTS Ledgers (...);
3. CREATE INDEX IF NOT EXISTS SeqLedger ON Ledgers(LedgerSeq);
4. DROP TABLE IF EXISTS Validations;
5. END TRANSACTION;

### Transaction Database Schema (TxDBInit)

- The transaction database schema is defined in `TxDBInit` ([src/xrpld/app/main/DBInit.h.txt]) as an array of SQL statements:

1. BEGIN TRANSACTION;
2. CREATE TABLE IF NOT EXISTS Transactions (...);
3. CREATE INDEX IF NOT EXISTS TxLgrIndex ON Transactions(LedgerSeq);
4. CREATE TABLE IF NOT EXISTS AccountTransactions (...);
5. CREATE INDEX IF NOT EXISTS AcctTxIDIndex ON AccountTransactions(TransID);
6. CREATE INDEX IF NOT EXISTS AcctTxIndex ON AccountTransactions(Account, LedgerSeq, TxnSeq, TransID);
7. CREATE INDEX IF NOT EXISTS AcctLgrIndex ON AccountTransactions(LedgerSeq, Account, TransID);
8. END TRANSACTION;

### Secondary Databases: Wallet, Manifest, PeerFinder, State

- **Wallet Database:** Schema in `WalletDBInit` ([src/xrpld/app/main/DBInit.h.txt]) includes tables for node identity, peer reservations, validator manifests, and publisher manifests.
- **Manifest Database:** Managed via `ManifestCache` ([src/xrpld/app/misc/Manifest.h.txt]), supports loading and saving manifests to a database.
- **PeerFinder Database:** Used for peer discovery, schema and versioning managed in [src/xrpld/app/rdb/detail/PeerFinder.cpp.txt].
- **State Database:** Used for ledger deletion and rotation, schema includes `DbState` and `CanDelete` tables ([src/xrpld/app/rdb/detail/State.cpp.txt]).

---

## Database Connection Setup and Pragmas

### setup_DatabaseCon

- The function `setup_DatabaseCon` ([src/xrpld/core/DatabaseCon.h.txt], [src/xrpld/core/detail/DatabaseCon.cpp.txt]) constructs a `DatabaseCon::Setup` struct with all configuration parameters for database connection.
- It sets:
  - Startup type, standalone mode, data directory.
  - Global and table-specific PRAGMA settings for SQLite.
  - Validates configuration values (e.g., page size must be a power of 2 and within a valid range).
  - Sets up global PRAGMAs for journal mode, synchronous, and temp store, based on config and safety level.
  - Table-specific PRAGMAs for page size, journal size limit, max page count, and mmap size.

### Configuration Options Table

| Option              | Location         | Valid Range/Values         | Effect/Notes                                                                 |
|---------------------|-----------------|----------------------------|------------------------------------------------------------------------------|
| backend             | [relational_db] | "sqlite"                   | Only valid value; others cause runtime error                                 |
| page_size           | [sqlite]        | 512–65536, power of 2      | SQLite page size (default: 4096)                                             |
| journal_size_limit  | [sqlite]        | integer >= 0               | SQLite journal size limit (default: 1582080)                                 |
| safety_level        | [sqlite]        | "high", "medium", "low"    | Adjusts journal_mode, synchronous, temp_store; lower values reduce durability|
| max_page_count      | [sqlite]        | integer                    | Max SQLite page count (default: 4294967294)                                  |
| mmap_size           | [sqlite]        | integer                    | SQLite mmap size (default: 17179869184)                                      |
| temp_store          | [sqlite]        | "file", "memory"           | SQLite temp store location                                                   |

- **Reference:** [src/xrpld/core/detail/DatabaseCon.cpp.txt], [src/xrpld/app/main/DBInit.h.txt]

### Pragma Settings

- PRAGMA settings are applied to control SQLite performance and durability:
  - `journal_mode`, `synchronous`, `temp_store` (global).
  - `page_size`, `journal_size_limit`, `max_page_count`, `mmap_size` (table-specific).
- These are set via SQL statements executed on the database session during initialization.

---

## Checkpointing and Durability

- Checkpointing is set up via the `setupCheckpointing` method in `DatabaseCon` ([src/xrpld/core/DatabaseCon.h.txt], [src/xrpld/core/detail/DatabaseCon.cpp.txt]).
- A checkpointer object is created for the database session, enabling periodic or event-driven checkpoints to be scheduled via the job queue and logged.
- If the job queue is not provided, a logic error is thrown.
- **Operational Details:** The WALCheckpointer ([src/xrpld/core/detail/SociDB.cpp.txt]) schedules checkpoints when the WAL file grows beyond a threshold, using the job queue for asynchronous execution.

---

## Database Operations and Methods

### Ledger Sequence Queries

- `getMinLedgerSeq`, `getMaxLedgerSeq` ([src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt]):
  - Return the minimum/maximum ledger sequence in the database.
  - Use helper functions in the `detail` namespace to execute SQL queries.

### Deletion and Cleanup

- `deleteTransactionByLedgerSeq`, `deleteBeforeLedgerSeq`, `deleteTransactionsBeforeLedgerSeq`, `deleteAccountTransactionsBeforeLedgerSeq`:
  - Delete transactions or ledgers before a given sequence or for a specific sequence.
  - Use helper functions in the `detail` namespace to construct and execute SQL `DELETE` statements.

### Counting and Space Usage

- `getTransactionCount`, `getAccountTransactionCount`, `getLedgerCountMinMax`:
  - Return the number of transactions, account transactions, or ledgers.
  - Use SQL `COUNT(*)` queries and min/max queries.

- `getKBUsedAll`, `getKBUsedLedger`, `getKBUsedTransaction` ([src/xrpld/core/SociDB.h.txt], [src/xrpld/core/detail/SociDB.cpp.txt]):
  - `getKBUsedAll`: Returns the total memory usage (in kilobytes) of the SQLite library for the entire process, using `sqlite3_memory_used()`.
  - `getKBUsedDB`: Returns the current memory usage (in kilobytes) of the page cache for the specific SQLite database connection, using `sqlite3_db_status(..., SQLITE_DBSTATUS_CACHE_USED, ...)`.

### Ledger and Transaction Info Retrieval

- `saveValidatedLedger`:
  - Saves a validated ledger to the database.
  - Begins a transaction, inserts or replaces the ledger info, and, if transaction tables are enabled, saves transactions and account transaction mappings.

- `getLedgerInfoByIndex`, `getNewestLedgerInfo`, `getLimitedOldestLedgerInfo`, `getLimitedNewestLedgerInfo`, `getLedgerInfoByHash`:
  - Retrieve ledger information by index, hash, or get the newest/oldest ledger info, possibly with a limit.

- `getHashByIndex`, `getHashesByIndex`:
  - Retrieve the hash (and parent hash) for a given ledger index or a range of indices.

### Account Transaction Queries and Pagination

- `getTxHistory`:
  - Retrieve a list of transactions starting from a given ledger index, up to a specified limit.

- `getOldestAccountTxs`, `getNewestAccountTxs`, `getOldestAccountTxsB`, `getNewestAccountTxsB`:
  - Retrieve account transaction history, either in normal or binary format.

- `oldestAccountTxPage`, `newestAccountTxPage`, `oldestAccountTxPageB`, `newestAccountTxPageB`:
  - Paginate account transactions, supporting both normal and binary formats.

### Transaction Retrieval by ID

- `getTransaction`:
  - Retrieve a transaction by its ID, optionally within a ledger range.
  - Returns the transaction and metadata, or an error code if not found or deserialization fails.

### Database Space Checking

- `ledgerDbHasSpace`, `transactionDbHasSpace`:
  - Check if the database has sufficient free disk space.
  - Use Boost filesystem to check available space in the database directory.
  - Logs a fatal error if less than 512MB is available.

### Database Closing

- `closeLedgerDB`, `closeTransactionDB` ([src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt]):
  - Close the respective database connection by resetting the unique pointer, releasing all associated resources.

---

## Free Functions and File Coverage

- **PeerFinder.[h|cpp]:** Defines/Implements methods for interacting with the PeerFinder SQLite database (e.g., `initPeerFinderDB`, `updatePeerFinderDB`, `readPeerFinderDB`, `savePeerFinderDB`). These are used internally by the PeerFinder component.
- **State.[h|cpp]:** Defines/Implements methods for interacting with the State SQLite database, which concerns ledger deletion and database rotation (e.g., `initStateDB`, `getCanDelete`, `setCanDelete`, `getSavedState`, `setSavedState`, `setLastRotated`). Used internally by SHAMapStore and related components.
- **Vacuum.[h|cpp]:** Defines/Implements a method for performing the `VACUUM` operation on SQLite databases (`doVacuumDB`). Used for database maintenance.
- **Wallet.[h|cpp]:** Defines/Implements methods for interacting with Wallet SQLite databases, including node identity, peer reservations, and manifest storage.
- **Node.[h|cpp]:** Free functions used exclusively by `SQLiteDatabaseImp` for interacting with SQLite databases owned by the node store. These are not intended to be invoked directly by clients, but are used by derived instances of `RelationalDatabase`.

**Audience:**  
- Most free functions in these files are intended for internal use by their respective subsystems (PeerFinder, SHAMapStore, etc.), not for external or client use.

---

## NodeStore/Non-Relational Database

- The **SQLDatabase** (relational database) is used for storing ledger and transaction history, account transaction pagination, and related metadata.
- The **NodeStore** is a separate, non-relational database system used for storing the main ledger state (SHAMap nodes, account state, etc.). It is managed by the `NodeStore::Database` interface ([src/xrpld/nodestore/Database.h.txt]) and its implementations (e.g., NuDB, RocksDB).
- **Distinction:** SQLDatabase is for history and metadata; NodeStore is for the main ledger state and SHAMap data.

---

## Error Handling and Edge Cases

- **Initialization Errors:** If database creation or setup fails (e.g., invalid configuration, missing files, schema errors), a fatal error is logged and a runtime exception is thrown, preventing the database from being constructed ([src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt]).
- **Runtime SQL/Database Failures:** If SQL queries fail (e.g., deserialization errors, missing data), error codes are returned and warnings are logged ([src/xrpld/app/rdb/backend/detail/Node.cpp.txt]).
- **Low Disk Space:** If available disk space is less than 512MB, a fatal error is logged and the operation fails ([src/xrpld/app/rdb/backend/detail/Node.cpp.txt]).
- **Checkpointing Errors:** If checkpointing cannot be set up due to a missing job queue, a logic error is thrown ([src/xrpld/core/detail/DatabaseCon.cpp.txt]).

---

## Optional Features (useTxTables)

- The use of transaction tables is **optional** and controlled by the `useTxTables` configuration option (checked via `config.useTxTables()`).
- If `useTxTables` is false, transaction-related tables and queries are not created or used. All transaction-related methods in `SQLiteDatabaseImp` check this flag and return early or zero if disabled.
- **Implications:** Disabling transaction tables means transaction history and account transaction queries are unavailable.
- **Reference:** [src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt], [src/xrpld/app/rdb/backend/detail/Node.cpp.txt]

---

## Checkpointing Details

- **Setup:** Checkpointing is set up during database initialization via `setupCheckpointing`, requiring a valid job queue and logging facility.
- **Trigger:** The WALCheckpointer schedules checkpoints when the SQLite Write-Ahead Log (WAL) file grows beyond a threshold ([src/xrpld/core/detail/SociDB.cpp.txt]).
- **Frequency:** The exact frequency is determined by WAL file growth and job queue scheduling.
- **Operational Impact:** Checkpointing ensures durability and prevents unbounded WAL file growth, but may impact write performance during checkpoint operations.

---

## Schema Evolution/Migrations

- **Schema Evolution:** There is no explicit support for schema migrations or upgrades in the provided code. The schema is initialized with `CREATE TABLE IF NOT EXISTS` statements, but there is no mechanism for applying migrations or handling out-of-date schemas.
- **If the schema is out of date:** The system does not automatically migrate or update schemas; manual intervention may be required.
- **Reference:** [src/xrpld/app/main/DBInit.h.txt], [src/xrpld/app/rdb/detail/PeerFinder.cpp.txt] (PeerFinder does have schema versioning and migration logic).

---

## References to Source Code

- [RelationalDatabase.h](src/xrpld/app/rdb/RelationalDatabase.h.txt)
- [RelationalDatabase.cpp](src/xrpld/app/rdb/detail/RelationalDatabase.cpp.txt)
- [SQLiteDatabase.h](src/xrpld/app/rdb/backend/SQLiteDatabase.h.txt)
- [SQLiteDatabase.cpp](src/xrpld/app/rdb/backend/detail/SQLiteDatabase.cpp.txt)
- [Node.h](src/xrpld/app/rdb/backend/detail/Node.h.txt)
- [Node.cpp](src/xrpld/app/rdb/backend/detail/Node.cpp.txt)
- [DBInit.h](src/xrpld/app/main/DBInit.h.txt)
- [DatabaseCon.h](src/xrpld/core/DatabaseCon.h.txt)
- [DatabaseCon.cpp](src/xrpld/core/detail/DatabaseCon.cpp.txt)
- [SociDB.h](src/xrpld/core/SociDB.h.txt)
- [SociDB.cpp](src/xrpld/core/detail/SociDB.cpp.txt)
- [State.cpp](src/xrpld/app/rdb/detail/State.cpp.txt)
- [Vacuum.cpp](src/xrpld/app/rdb/detail/Vacuum.cpp.txt)
- [PeerFinder.cpp](src/xrpld/app/rdb/detail/PeerFinder.cpp.txt)
- [Wallet.cpp](src/xrpld/app/rdb/detail/Wallet.cpp.txt)
- [Manifest.h](src/xrpld/app/misc/Manifest.h.txt)
- [SHAMapStoreImp.cpp](src/xrpld/app/misc/SHAMapStoreImp.cpp.txt)
- [SHAMapStoreImp.h](src/xrpld/app/misc/SHAMapStoreImp.h.txt)
- [NodeStore/Database.h](src/xrpld/nodestore/Database.h.txt)
- [NodeStore/DatabaseNodeImp.h](src/xrpld/nodestore/detail/DatabaseNodeImp.h.txt)
- [NodeStore/DatabaseRotatingImp.h](src/xrpld/nodestore/detail/DatabaseRotatingImp.h.txt)

---