# XRPL NodeStore Timing & Performance Analysis Exercise

## Background: Understanding NodeStore Performance

The NodeStore is a critical component of rippled that manages the storage and retrieval of ledger data. It acts as a key-value store for ledger objects, providing both persistent storage and in-memory caching for optimal performance.

In this exercise, you'll explore how different NodeStore backends affect performance by comparing disk-based storage with memory-based storage, and learn to interpret key performance metrics.

## Step 1: Baseline Performance with Disk Backend

First, let's measure the baseline performance with the default disk-based NodeStore backend.

### Command to Run

```bash
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.NodeStore.Timing
```

### Understanding the Test Output

The timing test compares three different NodeStore backends:

1. **nudb**: A high-performance key-value database optimized for append-only workloads
2. **rocksdb**: A popular LSM-tree based storage engine with configurable parameters
3. **memory**: An in-memory backend for maximum performance (testing/development)

### Test Operations Explained

| Operation | Description | What It Measures |
|-----------|-------------|------------------|
| **Insert** | Adding new objects to the store | Write performance |
| **Fetch** | Retrieving existing objects | Read performance for cache hits |
| **Missing** | Looking up non-existent objects | Read performance for cache misses |
| **Mixed** | Combination of reads and writes | Real-world usage patterns |
| **Work** | Overall combined workload | Total operation time |

### Sample Output Analysis

```
1 Thread, 10000 Objects
Backend      Insert    Fetch  Missing    Mixed     Work
nudb         0.135s   0.135s   0.012s   0.110s   0.388s
rocksdb      0.277s   0.370s   0.041s   0.184s   0.605s
memory       0.058s   0.094s   0.010s   0.078s   0.251s
```

**Key Observations:**
- **Memory backend**: Fastest across all operations (no disk I/O)
- **nudb**: Excellent performance, especially for fetches and missing lookups
- **rocksdb**: Slower but configurable, good for complex workloads

## Step 2: Enable Memory Backend for Comparison

Now let's switch to the memory backend to see how it affects performance.

### Code Modification Required

Find this section in the rippled configuration or test setup:

```cpp
#if 0
            ";type=memory|path=NodeStore"
#endif
```

**Change it to:**

```cpp
#if 1
            ";type=memory"
#endif
```

### What This Change Does

- **Enables memory backend**: Switches from disk-based to RAM-based storage
- **Removes path dependency**: Memory backend doesn't need a file path
- **Increases performance**: Eliminates disk I/O bottlenecks

### Run the Same Command

```bash
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.NodeStore.Timing
```

### Analyzing the Results

With the memory backend enabled, you should now see **only** the memory backend results in the timing output:

```
1 Thread, 10000 Objects
Backend      Insert    Fetch  Missing    Mixed     Work
memory       0.058s   0.094s   0.010s   0.078s   0.251s

4 Threads, 10000 Objects  
Backend      Insert    Fetch  Missing    Mixed     Work
memory       0.037s   0.037s   0.022s   0.036s   0.125s

8 Threads, 10000 Objects
Backend      Insert    Fetch  Missing    Mixed     Work
memory       0.048s   0.040s   0.022s   0.041s   0.146s
```

### Performance Comparison Analysis

Comparing memory vs nudb (from the full test results):

| Threads | Backend | Insert Speedup | Fetch Speedup | Missing Speedup | Mixed Speedup | Work Speedup |
|---------|---------|----------------|---------------|-----------------|---------------|--------------|
| 1 | memory vs nudb | **2.3x faster** | 1.4x faster | 1.2x faster | **1.4x faster** | **1.5x faster** |
| 4 | memory vs nudb | **1.9x faster** | 1.1x faster | **2.9x faster** | **0.9x faster** | 1.1x faster |
| 8 | memory vs nudb | **1.7x faster** | **1.7x faster** | **2.2x faster** | **2.0x faster** | **0.9x faster** |

### Key Insights from Scaling

1. **Thread Scaling Benefits**: 
   - Memory backend shows excellent scaling from 1→4 threads
   - Performance plateaus or slightly degrades at 8 threads (contention effects)

2. **Operation-Specific Performance**:
   - **Insert operations**: Memory shows consistent 1.7-2.3x improvement
   - **Missing lookups**: Memory excels, especially with more threads
   - **Mixed workloads**: Highly variable depending on thread count

3. **Threading Sweet Spot**:
   - **4 threads** appears optimal for this workload size (10,000 objects)
   - Beyond 4 threads, contention starts affecting performance

### Key Insights Comparison

1. **Memory Backend**:
   - **Fastest overall** but shows contention at high thread counts
   - **Best for development** where persistence isn't required
   - **4 threads optimal** for this workload size

2. **nudb Backend**:
   - **Excellent threading scalability** with minimal contention
   - **Best production choice** for balanced performance
   - **Scales well** from 1→4→8 threads

3. **rocksdb Backend**:
   - **Configurable but slower** in default configuration
   - **Good threading behavior** with consistent scaling
   - **Requires tuning** for optimal performance

## Step 3: Detailed Performance Analysis

Now let's dive deep into the performance metrics to understand what's happening under the hood.

### Command to Run

```bash
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.rpc.GetCounts
```

## Understanding the Metrics

### Cache Performance Metrics

| Metric | Description | Good Values |
|--------|-------------|-------------|
| **AL_hit_rate** | Account cache hit rate | >90% |
| **SLE_hit_rate** | State Ledger Entry cache hit rate | >85% |
| **ledger_hit_rate** | Ledger cache hit rate | >80% |

**Higher hit rates = Better performance** (less disk access needed)

### Cache Size Metrics

| Metric | Description | Indicates |
|--------|-------------|-----------|
| **AL_size** | Account cache entries | Memory usage for accounts |
| **fullbelow_size** | Full-below cache entries | Historical ledger data caching |
| **treenode_cache_size** | Tree node cache entries | Merkle tree node caching |
| **treenode_track_size** | Tree node tracking entries | Tree traversal optimization |

### Storage Usage Metrics

| Metric | Description | Shows |
|--------|-------------|--------|
| **dbKBLedger** | Ledger data size (KB) | Storage used for ledger state |
| **dbKBTotal** | Total database size (KB) | Complete storage footprint |
| **dbKBTransaction** | Transaction data size (KB) | Storage for transaction history |

### Performance Metrics

| Metric | Description | Optimization Goal |
|--------|-------------|-------------------|
| **node_reads_total** | Total read operations | Track read load |
| **node_reads_hit** | Cache hit reads | Maximize this number |
| **node_read_bytes** | Bytes read from storage | Minimize for efficiency |
| **node_reads_duration_us** | Total read time (microseconds) | Minimize for speed |
| **node_writes** | Write operations count | Track write load |
| **node_written_bytes** | Bytes written to storage | Monitor write throughput |

### System Resource Metrics

| Metric | Description | Monitoring Purpose |
|--------|-------------|-------------------|
| **read_queue** | Pending read requests | Detect bottlenecks |
| **read_request_bundle** | Bundled read requests | Efficiency optimization |
| **read_threads_running** | Active read threads | Concurrency utilization |
| **read_threads_total** | Total read threads | Resource allocation |
| **write_load** | Current write pressure | System stress indicator |