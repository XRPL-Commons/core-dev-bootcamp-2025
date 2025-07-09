```markdown
# XRPL NodeStore Functionality: Comprehensive Documentation

This document provides a detailed, code-driven breakdown of the XRPL NodeStore subsystem, focusing on every aspect of its functionality, architecture, configuration, and component interactions. All statements and explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [NodeStore Overview](#nodestore-overview)
- [NodeObject: Structure, Types, and Limits](#nodeobject-structure-types-and-limits)
- [Backend Types, Status, and Configuration](#backend-types-status-and-configuration)
- [Backend Interface and Implementations](#backend-interface-and-implementations)
- [Database Abstraction and Metrics](#database-abstraction-and-metrics)
- [DatabaseNodeImp: Standard NodeStore Database](#databasenodeimp-standard-nodestore-database)
- [DatabaseRotatingImp: Rotating NodeStore Database and Online Deletion](#databaserotatingimp-rotating-nodestore-database-and-online-deletion)
- [Manager and Factory: Backend/Database Creation](#manager-and-factory-backenddatabase-creation)
- [NodeObject Encoding/Decoding and Data Format](#nodeobject-encodingdecoding-and-data-format)
- [Cache Layer: TaggedCache Details](#cache-layer-taggedcache-details)
- [NodeStore in Application Lifecycle](#nodestore-in-application-lifecycle)
- [Limits: NodeObject and Batch Sizes](#limits-nodeobject-and-batch-sizes)
- [Error Handling and Status Codes](#error-handling-and-status-codes)
- [References](#references)

---

## NodeStore Overview

The NodeStore subsystem provides a persistent storage interface for `NodeObject`s, which are the primary representation of ledger entries in XRPL. All ledger entries are stored as `NodeObject`s, which must be persisted between launches. If a `NodeObject` is not in memory, it is retrieved from the database.

Source: [/https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/README.md]

---

## NodeObject: Structure, Types, and Limits

A `NodeObject` encapsulates:

- `mType`: An enumeration (`NodeObjectType`) indicating the object type.
- `mHash`: 256-bit hash of the blob (unique identifier).
- `mData`: Variable-length blob containing the serialized payload.

### NodeObjectType Enum

Explicit values and meanings (from [NodeObject.h]):

| Enum Name             | Numeric Value | Meaning                                 |
|-----------------------|--------------|-----------------------------------------|
| hotUNKNOWN            | 0            | Unknown type                            |
| hotLEDGER             | 1            | Ledger header                           |
| hotACCOUNT_NODE       | 3            | Node in the account state tree          |
| hotTRANSACTION_NODE   | 4            | Node in the transaction tree            |
| hotDUMMY              | 512          | Dummy marker (used for cache/missing)   |

> **Note:** The value `2` is not used; `hotTRANSACTION` is not present in the enum in the provided code.

Creation is controlled via a private constructor and a static factory method:

```cpp
static std::shared_ptr<NodeObject> createObject(
    NodeObjectType type,
    Blob&& data,
    uint256 const& hash);
```

All `NodeObject`s are heap-allocated and managed by `std::shared_ptr`.

---

## Backend Types, Status, and Configuration

The NodeStore supports multiple backend types, selectable at runtime via the `[node_db]` config section.

### Supported Backend Types

| Backend Type    | Status         | Description/Notes                       |
|-----------------|---------------|-----------------------------------------|
| RocksDB         | Preferred     | Facebook's RocksDB, builds on LevelDB   |
| NuDB            | Preferred     | High-performance, append-only           |
| LevelDB         | Deprecated    | Google's LevelDB                        |
| HyperLevelDB    | Deprecated    | Improved LevelDB                        |
| SQLite          | Supported     | Uses SQLite database                    |
| Memory          | For testing   | In-memory only, non-persistent          |
| none            | For testing   | No-op backend, disables storage         |

Source: [/https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/README.md], backend factory implementations

### Configuration Parameters

**Common required parameter:**  
- `path` (string): Filesystem path for backend data.

**Optional parameters (by backend):**

- `compression` (0/1): Enable compression (default: 1, if supported).
- `burstSize`: For NuDB, controls write burst size.
- Other backend-specific options may exist (see backend source for details).

**Example config:**
```
[node_db]
type=RocksDB
path=/var/lib/rippled/db
compression=1
```

---

## Backend Interface and Implementations

The `Backend` class is an abstract interface for all storage backends.

### Key Methods

- `void store(std::shared_ptr<NodeObject> const& object)`: Store a single `NodeObject`.
- `Status fetch(void const* key, std::shared_ptr<NodeObject>* pObject)`: Retrieve a `NodeObject` by key.
- `void storeBatch(Batch const& batch)`: Store a batch of objects.
- `std::pair<std::vector<std::shared_ptr<NodeObject>>, Status> fetchBatch(...)`: Batch fetch.
- `void open(bool createIfMissing = true)`: Open backend.
- `void close()`: Close backend.
- `int fdRequired() const`: Number of file descriptors required (see [Resource Usage](#resource-usage)).

### Implementations

- **RocksDBBackend**: Persistent, batch writing, supports compression.
- **NuDBBackend**: Persistent, append-only, supports compression.
- **MemoryBackend**: In-memory map, thread-safe, for testing.
- **NullBackend**: No-op, for testing or disabled storage.

Each backend implements the required interface and may have additional options.

---

## Database Abstraction and Metrics

The `Database` class is an abstract interface for managing storage and retrieval of `NodeObject`s, providing methods for:

- Storing/fetching objects (sync/async)
- Importing data from another database
- Iterating over all objects
- Managing statistics and metrics

### Background Threads

- The `Database` class manages a pool of background threads for asynchronous fetches (`asyncFetch`), improving concurrency and performance.

### Metrics and Statistics

- The `getCountsJson` method provides operational statistics, including:
  - `node_writes`: Number of objects written
  - `node_reads_total`: Total fetches
  - `node_reads_hit`: Cache hits
  - `node_written_bytes`: Bytes written
  - `node_read_bytes`: Bytes read
  - `node_reads_duration_us`: Total fetch duration (microseconds)
  - Thread and queue statistics

Source: [Database.h], [detail/Database.cpp], [include/xrpl/protocol/jss.h]

---

## DatabaseNodeImp: Standard NodeStore Database

`DatabaseNodeImp` is the standard implementation of `Database`, using a single backend and an optional cache.

- Stores and fetches objects, using the backend and a `TaggedCache` for fast access.
- Supports batch operations and async fetches.
- Tracks and reports metrics.

---

## DatabaseRotatingImp: Rotating NodeStore Database and Online Deletion

`DatabaseRotatingImp` manages two backends: a writable backend for current data and an archive backend for older data. It supports rotation and online deletion.

### Rotation Process

- **Trigger:** Rotation is triggered by application logic (e.g., after a configured number of ledgers or on demand).
- **Process:**
  1. The current writable backend is moved to archive.
  2. A new backend is created and becomes the writable backend.
  3. The previous archive backend is deleted from disk.
- **Thread Safety:** All operations are protected by mutexes.

### Online Deletion

- Old data is deleted from the archive backend as part of the rotation process, freeing disk space and enforcing retention policies.

Source: [detail/DatabaseRotatingImp.cpp], [SHAMapStoreImp.cpp], [README.md]

---

## Manager and Factory: Backend/Database Creation

- The `Manager` and `Factory` classes manage registration and creation of backends and databases.
- `ManagerImp` is a singleton that looks up backend types and creates instances based on config.
- `make_Backend` and `make_Database` are used to instantiate backends/databases as needed.

---

## NodeObject Encoding/Decoding and Data Format

### EncodedBlob

- Encodes a `NodeObject` for storage.
- Format:
  - Bytes 0-7: unused (set to zero)
  - Byte 8: type (`NodeObjectType`)
  - Bytes 9...end: data blob

### DecodedBlob

- Decodes a binary blob from storage into a `NodeObject`.
- Only recognized types (`hotLEDGER`, `hotACCOUNT_NODE`, `hotTRANSACTION_NODE`, `hotUNKNOWN`) are valid.

### Data Format Table

| Byte   | Field | Description                  |
|--------|-------|-----------------------------|
| 0...7  | unused|                             |
| 8      | type  | NodeObjectType enumeration  |
| 9...end| data  | body of the object data     |

The key (hash) is stored separately and used as the lookup key in the backend.

---

## Cache Layer: TaggedCache Details

- `TaggedCache` is used to cache recently accessed `NodeObject`s.
- **Eviction Policy:**  
  - Items are evicted based on `cache_size` (max number of items) and `cache_age` (max age in minutes).
  - When the cache exceeds `cache_size`, least-recently-used items are evicted.
  - Items older than `cache_age` are also evicted.
- **Configuration:**  
  - Set via `cache_size` and `cache_age` in the `[node_db]` config section.
- **Dummy Objects:**  
  - `hotDUMMY` objects are used to mark missing entries in the cache.

Source: [detail/DatabaseNodeImp.h], [SHAMapStoreImp.cpp]

---

## NodeStore in Application Lifecycle

- The `SHAMapStore` and `SHAMapStoreImp` classes manage the NodeStore lifecycle, including online deletion, rotation, and cache management.
- The `Application` class initializes the NodeStore and may import data from another database at startup.
- The `NodeFamily` class provides access to the NodeStore database and caches for SHAMap operations.

### Online Deletion

- When enabled, online deletion prunes old ledger data from both the NodeStore and associated SQL tables, based on ledger sequence.
- Without online deletion, storage usage grows without bounds and must be pruned manually.

Source: [SHAMapStore.h], [SHAMapStoreImp.h/.cpp], [README.md], [app/misc/README.md]

---

## Limits: NodeObject and Batch Sizes

- **Batch Write Preallocation Size:**  
  - `batchWritePreallocationSize = 256`
- **Batch Write Limit Size:**  
  - `batchWriteLimitSize = 65536`
- **NodeObject Size:**  
  - No explicit hard limit in the provided code, but practical limits may be imposed by backend/database or system resources.

Source: [Types.h]

---

## Error Handling and Status Codes

- **Status Codes (from [Types.h]):**
  - `ok`: Operation succeeded
  - `notFound`: Object not found
  - `dataCorrupt`: Data is corrupt
  - `unknown`: Unknown error
  - `backendError`: Backend-specific error
  - `customCode = 100`: Custom error code base

- **Behavior:**
  - If a fetch fails or data is corrupt, the backend returns the appropriate status code.
  - Corrupt data triggers fatal logging (see [DatabaseNodeImp::fetchNodeObject], [RocksDBBackend], [NuDBBackend]).
  - Missing objects are marked with `hotDUMMY` in the cache.
  - All errors are logged with appropriate severity (trace, warn, fatal) as per the code.

---

## Resource Usage

- The `fdRequired()` method (on both `Database` and `Backend`) returns the number of file descriptors required by the backend/database.
- Used for resource planning and ensuring the system has sufficient file handles.

---

## References

- [NodeObject.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/NodeObject.h)
- [NodeObject.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/NodeObject.cpp)
- [Backend.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/Backend.h)
- [Database.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/Database.h)
- [DatabaseNodeImp.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/DatabaseNodeImp.h)
- [DatabaseNodeImp.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/DatabaseNodeImp.cpp)
- [DatabaseRotatingImp.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/DatabaseRotatingImp.h)
- [DatabaseRotatingImp.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/DatabaseRotatingImp.cpp)
- [Manager.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/Manager.h)
- [Factory.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/Factory.h)
- [EncodedBlob.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/EncodedBlob.h)
- [DecodedBlob.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/DecodedBlob.h)
- [DecodedBlob.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/detail/DecodedBlob.cpp)
- [Types.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/Types.h)
- [README.md](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/nodestore/README.md)
- [SHAMapStore.h/.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/SHAMapStore.h, https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/SHAMapStoreImp.cpp)
- [Application.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/main/Application.cpp)
- [NodeFamily.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/NodeFamily.h)
