# Day 1 Homework - XRPL Mainnet Sync

## 🎯 Objective
Configure and run rippled to sync with the XRPL mainnet, then analyze the debug logs to understand the node's behavior during initial synchronization.

## 📋 Prerequisites
- Successfully completed Day 1 dev challenge (standalone node setup)
- Built rippled binary from source
- Basic understanding of rippled configuration files

## 🔧 Tasks

### Task 1: Create Configuration Structure
1. Create a `config` directory in your rippled project build dir:
   ```bash
   mkdir config
   cd config
   ```

2. Copy the example configuration files:
   ```bash
   # Copy example rippled.cfg
   cp ../cfg/rippled-example.cfg ./rippled.cfg
   
   # Copy example validator list
   cp ../cfg/validators-example.txt ./validators.txt
   ```

### Task 2: Configure for Mainnet
Edit your `rippled.cfg` file to connect to the XRPL mainnet:

1. **Remove standalone configuration:**
   - Comment out or remove the `[network_id]` section
   - Remove any standalone-specific settings

2. **Update peer port configuration:**
   ```ini
   [port_peer]
   port = 51235
   ip = 0.0.0.0
   protocol = peer
   ```

3. **Add mainnet peer IPs:**
   ```ini
   [ips]
   r.ripple.com 51235
   sahyadri.isrdc.in 51235
   s1.ripple.com 51235
   s2.ripple.com 51235
   ```

4. **Ensure proper database path:**
   ```ini
   [node_db]
   type=NuDB
   path=db/nudb
   ```

5. **Configure logging for analysis:**
   ```ini
   [rpc_startup]
   { "command": "log_level", "severity": "info" }
   ```

### Task 3: Run Mainnet Sync
1. Start rippled with your mainnet configuration:
   ```bash
   ./rippled --config=./config/rippled.cfg
   ```

2. Let the node run for **at least 30 minutes** to observe initial sync behavior

3. Monitor the console output and note:
   - Connection attempts to peers
   - Ledger sync progress
   - Any error messages

### Task 4: Analyze Debug Logs
1. Locate your debug log file (typically in `debug.log` or `logs/debug.log`)

2. **Examine the following sections:**
   - **Startup sequence:** How does the node initialize?
   - **Peer connections:** Which peers does it connect to first?
   - **Ledger acquisition:** How does it request and receive ledger data?
   - **Consensus participation:** Does it observe consensus rounds?

3. **Look for specific log patterns:**
   ```
   - "Connecting to peer"
   - "Ledger acquisition"
   - "Syncing ledger"
   - "Consensus timing"
   - Any WARNING or ERROR messages
   ```

## 📝 Deliverables

#### Connection Analysis
- How many peers did your node connect to initially?
- Which IPs were successfully contacted?
- Any connection failures and why they might have occurred?

#### Sync Behavior
- What was the starting ledger sequence when you began?
- How fast did the ledger sequence progress?
- Did you observe any gaps or issues in ledger acquisition?

#### Error Investigation
- List any ERROR or WARNING messages found in logs
- Research and explain what each error means
- Suggest potential solutions if applicable

#### Performance Observations
- CPU and memory usage patterns during sync
- Network bandwidth utilization
- Time taken to sync the first 1000 ledgers

## 🚀 Bonus Challenges

### Bonus 1: Network Exploration
- Use `rippled server_info` command to check node status
- Review the peering information like peers, peer_disconnects, etc
- Document the lag between your node and the network

## 📚 Resources
- [Rippled Configuration Documentation](https://xrpl.org/docs/infrastructure/configuration/connect-your-rippled-to-the-xrp-test-net)
- [XRPL Mainnet Explorer](https://livenet.xrpl.org/)