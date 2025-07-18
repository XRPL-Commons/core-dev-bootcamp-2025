## SHAMap Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the SHAMap data structure in the XRPL (XRP Ledger) source code. It covers every aspect of SHAMap, including its architecture, node types, traversal (including parallel and iterator-based traversal), synchronization, proof generation, state management, serialization formats, thread safety, and interactions with caches and storage. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [SHAMap Overview](#shamap-overview)
- [Hashing in SHAMap](#hashing-in-shamap)
- [Node Types and Structure](#node-types-and-structure)
  - [SHAMapTreeNode (Base Class)](#shamaptreenode-base-class)
  - [SHAMapInnerNode](#shamapinnernode)
  - [SHAMapLeafNode and Subclasses](#shamapleafnode-and-subclasses)
  - [SHAMapItem](#shamapitem)
- [SHAMap Construction, Mutability, and Snapshots](#shamap-construction-mutability-and-snapshots)
- [Copy-on-Write and Node Sharing](#copy-on-write-and-node-sharing)
- [Node Identification and Navigation](#node-identification-and-navigation)
- [Traversal and Iteration](#traversal-and-iteration)
  - [visitLeaves](#visitleaves)
  - [visitNodes](#visitnodes)
  - [walkMap and walkMapParallel](#walkmap-and-walkmapparallel)
  - [const_iterator](#const_iterator)
- [Synchronization and Missing Node Detection](#synchronization-and-missing-node-detection)
  - [getMissingNodes](#getmissingnodes)
  - [gmn_ProcessNodes](#gmn_processnodes)
  - [gmn_ProcessDeferredReads](#gmn_processdeferredreads)
- [Node Addition and Canonicalization](#node-addition-and-canonicalization)
  - [addRootNode](#addrootnode)
  - [addKnownNode](#addknownnode)
- [Serialization and Proofs](#serialization-and-proofs)
  - [serializeRoot](#serializeroot)
  - [getNodeFat](#getnodefat)
  - [getProofPath](#getproofpath)
  - [verifyProofPath](#verifyproofpath)
  - [Inner Node Serialization: Compressed vs. Full Formats](#inner-node-serialization-compressed-vs-full-formats)
- [State Management](#state-management)
  - [setImmutable](#setimmutable)
  - [isSynching, setSynching, clearSynching, isValid](#issynching-setsynching-clearsynching-isvalid)
- [Caching and Storage](#caching-and-storage)
- [Thread Safety](#thread-safety)
- [Supporting Classes and Utilities](#supporting-classes-and-utilities)
- [References to Source Code](#references-to-source-code)

---

## SHAMap Overview

- SHAMap is a Merkle tree and a radix trie of radix 16 ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/README.md)).
- It enables O(1) comparison of subtrees or entire trees by comparing hashes.
- Used for storing transactions (with or without metadata) or account state; all leaves in a SHAMap are of a uniform type.
- The root node is always a SHAMapInnerNode.

---

## Hashing in SHAMap

Hashing is a fundamental aspect of the `SHAMap` data structure. Each node in a `SHAMap`—whether an inner node (`SHAMapInnerNode`) or a leaf node (`SHAMapLeafNode`)—stores a hash value. These hashes are used to efficiently compare, prove, and serialize the contents of the map.

### Where Hashes Are Stored

- **Inner Nodes:** Each `SHAMapInnerNode` contains a hash field that represents the hash of all its children. The inner nodes themselves do not carry any data other than the hash of the nodes beneath them.
- **Leaf Nodes:** Each `SHAMapLeafNode` contains a hash of the data it stores (such as a transaction or account state).

### How Hashes Are Updated

- When walking the `SHAMap`, for each leaf node encountered, the hash of the data in the leaf node is computed at that time.
- After processing all of an inner node's children, the hash of the inner node is updated to reflect the hashes of its children. This is typically done using an `updateHash` method or similar mechanism.
- The updated hash is then written to the database, and the node is reassigned back into its parent node in case a copy-on-write (COW) operation created a new pointer to it.

### Role of Hashes

- **Comparison:** The Merkle tree property of the `SHAMap` allows subtrees and even the entire tree to be compared with other trees in O(1) time by simply comparing the hashes. This makes it very efficient to determine if two `SHAMap`s contain the same set of transactions or account state modifications.
- **Proof:** The hash structure enables cryptographic proofs of inclusion or exclusion of data within the map, as is standard in Merkle trees.
- **Serialization:** When nodes are written to the database, their hashes are computed and stored, ensuring the integrity and consistency of the serialized data.

### Relevant Classes and Methods

- **SHAMapTreeNode:** The base class for both `SHAMapInnerNode` and `SHAMapLeafNode`, holding data common to both, including the hash field.
- **SHAMapInnerNode:** Stores the hash of its children and updates it after processing all children.
- **SHAMapLeafNode:** Computes and stores the hash of its own data.
- **SHAMapHash:** The type used for storing hash values in nodes.
- **updateHash:** The method used to update the hash of a node after its contents or its children's hashes have changed.
- **hash_ fields:** The member variables in node classes that store the computed hash values.

In summary, hashing in `SHAMap` is central to its efficiency and security, enabling fast comparison, proof, and reliable serialization of the map's contents.

---

## Node Types and Structure

### SHAMapTreeNode (Base Class)

- Abstract base class for all SHAMap nodes ([SHAMapTreeNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapTreeNode.h)).
- Holds:
  - `SHAMapHash hash_`: the node's hash.
  - `std::uint32_t cowid_`: copy-on-write identifier.
- Pure virtual methods for:
  - Cloning (`clone`)
  - Hash updating (`updateHash`)
  - Serialization (`serializeForWire`, `serializeWithPrefix`)
  - Type identification (`getType`, `isLeaf`, `isInner`)
  - Invariant checking (`invariants`)
- Static factory methods for deserialization (`makeFromWire`, etc.).

### SHAMapInnerNode

- Inherits from SHAMapTreeNode ([SHAMapInnerNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapInnerNode.h)).
- Holds:
  - Up to 16 child nodes (shared_ptrs).
  - Hash for each child.
  - Bitset indicating which children exist.
  - `fullBelowGen_`: generation marker for "full below" optimization.
- Methods for:
  - Child management (`setChild`, `shareChild`, `getChildPointer`, `getChild`, `canonicalizeChild`)
  - Branch state (`isEmpty`, `isEmptyBranch`, `getBranchCount`)
  - Hashing (`updateHash`, `updateHashDeep`)
  - Serialization (compressed and full formats; see [Inner Node Serialization](#inner-node-serialization-compressed-vs-full-formats))
  - Invariant checking

### SHAMapLeafNode and Subclasses

- Abstract class for leaves ([SHAMapLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapLeafNode.h)).
- Holds:
  - `boost::intrusive_ptr<SHAMapItem const> item_`: the data item.
- Subclasses:
  - **SHAMapAccountStateLeafNode** ([SHAMapAccountStateLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapAccountStateLeafNode.h)): for account state entries.
  - **SHAMapTxLeafNode** ([SHAMapTxLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapTxLeafNode.h)): for transactions.
  - **SHAMapTxPlusMetaLeafNode** ([SHAMapTxPlusMetaLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapTxPlusMetaLeafNode.h)): for transactions with metadata.
- Each subclass implements:
  - Hash calculation (using appropriate prefix and data)
  - Serialization for wire and with prefix

### SHAMapItem

- Represents the data stored in a leaf ([SHAMapItem.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapItem.h)).
- Holds:
  - `uint256 tag_`: unique key.
  - `std::uint32_t size_`: data size.
  - Data payload (transactions, account info).
- Uses intrusive reference counting and custom slab allocator.

---

## SHAMap Construction, Mutability, and Snapshots

- SHAMap can be constructed as mutable or immutable ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/README.md), [SHAMap.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)).
- **Mutable SHAMap**: Nodes can be modified; all nodes have the same non-zero cowid as the map.
- **Immutable SHAMap**: Nodes are immutable and persist for the map's lifetime; cowid is 0.
- Snapshots are created with `snapShot(bool isMutable)`, which returns a new SHAMap sharing nodes if possible.
- **Important:** Immutable SHAMaps cannot be trimmed. Once a node has been brought into an immutable SHAMap, it remains in memory for the life of the SHAMap. There is no mechanism to remove unnecessary nodes from an immutable SHAMap ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/README.md)).

---

## Copy-on-Write and Node Sharing

- Nodes are shared between SHAMaps using shared_ptrs.
- When a mutable SHAMap needs to modify a node, it clones the node and sets its cowid to the map's cowid ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/README.md)).
- When a node is safe to share, its cowid is set to 0.
- The `unshareNode` utility automates this process.

---

## Node Identification and Navigation

- **SHAMapNodeID** ([SHAMapNodeID.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapNodeID.h), [SHAMapNodeID.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapNodeID.cpp)):
  - Identifies a node by its path from the root and depth.
  - Path is a sequence of 4-bit branch indices packed into a uint256.
  - Methods:
    - `getChildNodeID(int m)`: computes child node ID.
    - `selectBranch(SHAMapNodeID, key)`: selects branch for a key at a given depth.
    - `createID(int depth, uint256 key)`: creates a node ID at a specific depth.

---

## Traversal and Iteration

### visitLeaves

- Traverses all leaf nodes and applies a user function ([SHAMap::visitLeaves](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Implementation:
  - Calls `visitNodes` with a lambda that filters for leaf nodes and calls the user function with the leaf's item.
  - Only leaf nodes are processed; inner nodes are ignored.

### visitNodes

- Depth-first traversal of all nodes (inner and leaf) ([SHAMap::visitNodes](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Uses a stack to manage traversal state.
- For each node:
  - Applies the user function.
  - If the node is an inner node, iterates over all 16 branches, descending into non-empty children.

### walkMap and walkMapParallel

- **walkMap**: Traverses the SHAMap to find missing nodes, storing them in a list ([SHAMap::walkMap](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapDelta.cpp)).
- **walkMapParallel**: Performs a parallelized version of walkMap using multiple threads for efficiency ([SHAMap::walkMapParallel](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapDelta.cpp)). This allows for concurrent traversal of the SHAMap to identify missing nodes, improving performance in multi-threaded environments.

### const_iterator

- SHAMap provides a `const_iterator` class for traversing SHAMap items ([SHAMap.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)).
- Iteration is performed in key order, and supports `begin()`, `end()`, `upper_bound()`, and `lower_bound()` methods.
- Example usage:
  for (auto it = map.begin(); it != map.end(); ++it) {
      // Access *it
  }

---

## Synchronization and Missing Node Detection

### getMissingNodes

- Finds up to `max` missing nodes required for a complete map ([SHAMap::getMissingNodes](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Uses a `MissingNodes` helper to track state.
- Traverses the tree, using a stack and deferred reads for async fetching.
- For each inner node:
  - Checks each child branch.
  - If a child is missing or not in the "full below" cache, attempts to fetch or records as missing.
  - Deferred reads are processed as they complete.
- Returns a vector of missing node IDs and hashes.

### gmn_ProcessNodes

- Helper for `getMissingNodes` ([SHAMap::gmn_ProcessNodes](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Iterates over all 16 branches of an inner node.
- For each child:
  - If missing, records as missing.
  - If fetch is pending, increments deferred count.
  - If child is an inner node and not "full below", descends into it.
- Marks node as "full below" if all children are present.

### gmn_ProcessDeferredReads

- Processes all deferred async reads ([SHAMap::gmn_ProcessDeferredReads](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- For each completed read:
  - If node found, canonicalizes and records for resumption.
  - If not found, records as missing.
- Resets deferred state.

---

## Node Addition and Canonicalization

### addRootNode

- Adds or sets the root node from serialized data ([SHAMap::addRootNode](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- If root already exists and matches hash, returns "duplicate".
- If input is invalid, returns "invalid".
- Otherwise:
  - Deserializes node.
  - Canonicalizes if backed.
  - Sets as root.
  - Notifies filter if provided.
  - Returns "useful".

### addKnownNode

- Adds a known (non-root) node during sync ([SHAMap::addKnownNode](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Traverses tree toward target node.
- If branch is empty or hash mismatch, returns "invalid".
- If node is added, canonicalizes and notifies filter.
- Returns "useful" or "duplicate" as appropriate.

---

## Serialization and Proofs

### serializeRoot

- Serializes the root node into a Serializer ([SHAMap::serializeRoot](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Calls `serializeForWire` on the root node.
- For inner nodes, uses compressed or full format depending on branch count (see below).

### getNodeFat

- Retrieves a node and optionally its sub-nodes, serializing them for transmission ([SHAMap::getNodeFat](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Descends to requested node.
- Serializes node and, depending on `depth` and `fatLeaves`, may serialize children.
- Returns true if successful.

### getProofPath

- Generates a proof path (Merkle proof) for a key ([SHAMap::getProofPath](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Walks from root to leaf for the key, pushing nodes onto a stack.
- Serializes each node along the path into a vector of Blobs.
- Returns the path as an optional vector.

### verifyProofPath

- Verifies a proof path for a key and root hash ([SHAMap::verifyProofPath](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)).
- Walks the path from leaf to root, deserializing each node and checking hashes.
- For inner nodes, updates expected hash using the key.
- For leaf, checks position in path.
- Returns true if valid, false otherwise.

### Inner Node Serialization: Compressed vs. Full Formats

- **Full Format:** Serializes all 16 branches of an inner node, including empty branches. Used when the node is "full" or has many children.
- **Compressed Format:** Serializes only the non-empty branches of an inner node, omitting empty branches to save space. Used when the node has few children.
- The choice of format is determined by the branch count and is handled automatically in `serializeForWire` ([SHAMapInnerNode.h/cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapInnerNode.h), [detail/SHAMapInnerNode.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapInnerNode.cpp)).

---

## State Management

### setImmutable

- Sets the SHAMap state to Immutable ([SHAMap::setImmutable](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)).
- Asserts current state is not Invalid.
- After this, nodes are considered unchangeable for the map's lifetime.

### isSynching, setSynching, clearSynching, isValid

- **isSynching**: Returns true if state is Synching ([SHAMap::isSynching](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)).
- **setSynching**: Sets state to Synching ([SHAMap::setSynching](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)).
- **clearSynching**: Sets state to Modifying ([SHAMap::clearSynching](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)).
- **isValid**: Returns true if state is not Invalid ([SHAMap::isValid](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)).

---

## Caching and Storage

- **TreeNodeCache**: Shared cache of immutable SHAMapTreeNodes, keyed by hash ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/README.md), [TreeNodeCache.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/TreeNodeCache.h)).
- **FullBelowCache**: Tracks which subtrees are fully synchronized.
- **Family**: Abstract interface for managing SHAMap-related resources, including caches and database ([Family.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/Family.h)).
- **NodeFamily**: Concrete implementation for managing node resources ([NodeFamily.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/NodeFamily.h)).
- **SHAMapStoreImp**: Manages storage, rotation, and deletion of SHAMap data ([SHAMapStoreImp.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/SHAMapStoreImp.cpp), [SHAMapStoreImp.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/SHAMapStoreImp.h)).

---

## Thread Safety

- SHAMap and its supporting classes employ several mechanisms for thread safety:
  - **canonicalize**: Ensures that only one instance of a node with a given hash is inserted into the cache, preventing races between threads ([README](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/README.md), [SHAMap.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMap.cpp)).
  - **SHAMapInnerNode**: Uses atomic operations and locking (e.g., `std::atomic<std::uint16_t> lock_`) to protect concurrent access to child pointers and hashes ([SHAMapInnerNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapInnerNode.h)).
  - **Caches**: TreeNodeCache and FullBelowCache are designed for concurrent access and use appropriate synchronization primitives.
- These mechanisms ensure that SHAMap can be safely used in multi-threaded environments, especially during synchronization, traversal, and node insertion.

---

## Supporting Classes and Utilities

- **SHAMapAddNode**: Tracks results of adding nodes (good, bad, duplicate) ([SHAMapAddNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapAddNode.h)).
- **SHAMapMissingNode**: Exception for missing nodes ([SHAMapMissingNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapMissingNode.h)).
- **TaggedPointer**: Efficient storage for child pointers and hashes in inner nodes ([TaggedPointer.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/TaggedPointer.h), [TaggedPointer.ipp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/TaggedPointer.ipp)).
- **Serializer**: Utility for serializing nodes ([Serializer.h], used throughout node serialization code).

---

## References to Source Code

- [SHAMap.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMap.h)
- [SHAMapTreeNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapTreeNode.h)
- [SHAMapInnerNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapInnerNode.h)
- [SHAMapLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapLeafNode.h)
- [SHAMapAccountStateLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapAccountStateLeafNode.h)
- [SHAMapTxLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapTxLeafNode.h)
- [SHAMapTxPlusMetaLeafNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapTxPlusMetaLeafNode.h)
- [SHAMapItem.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapItem.h)
- [SHAMapNodeID.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapNodeID.h)
- [SHAMapAddNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapAddNode.h)
- [SHAMapMissingNode.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/SHAMapMissingNode.h)
- [TreeNodeCache.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/TreeNodeCache.h)
- [Family.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/Family.h)
- [NodeFamily.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/NodeFamily.h)
- [SHAMapStoreImp.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/SHAMapStoreImp.cpp)
- [SHAMapStoreImp.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/misc/SHAMapStoreImp.h)
- [detail/SHAMap.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMap.cpp)
- [detail/SHAMapSync.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapSync.cpp)
- [detail/SHAMapDelta.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapDelta.cpp)
- [detail/SHAMapInnerNode.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapInnerNode.cpp)
- [detail/SHAMapLeafNode.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapLeafNode.cpp)
- [detail/SHAMapTreeNode.cpp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/SHAMapTreeNode.cpp)
- [detail/TaggedPointer.h](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/TaggedPointer.h)
- [detail/TaggedPointer.ipp](https://github.com/XRPLF/rippled/blob/develop/src/xrpld/shamap/detail/TaggedPointer.ipp)