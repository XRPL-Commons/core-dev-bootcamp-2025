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
   hubs.xrpkuwait.com 51235
   hub.xrpl-commons.org 51235
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
   ./rippled --conf ./config/rippled.cfg
   ```

2. Let the node run for **at least 30 minutes** to observe initial sync behavior

3. Monitor the console output and note:
   - Connection attempts to peers
   - Ledger sync progress
   - Any error messages

### Task 4: Find Your Node on the Network
1. **Get your node ID:**
   ```bash
   ./rippled server_info
   ```
   Look for the `pubkey_node` field in the response - this is your node's public key identifier.

2. **View your node on the network:**
   - Visit [https://livenet.xrpl.org/network/nodes](https://livenet.xrpl.org/network/nodes)
   - Search for your node using the `pubkey_node` from the server_info response
   - Take a screenshot or note the information displayed about your node

3. **Document node visibility:**
   - Is your node visible on the network explorer?
   - What information is shown (uptime, version, location, etc.)?
   - How long did it take for your node to appear after starting?

### Task 5: Analyze Debug Logs
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

#### Node Visibility
- Screenshot or description of your node on the network explorer
- Your node's public key (pubkey_node)
- Time taken for your node to appear on the network after startup

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
- Use `./rippled server_info` command to check node status
- Review the peering information like peers, peer_disconnects, etc
- Document the lag between your node and the network

### Bonus 2: Node Monitoring
- Compare your node's stats with other nodes on the network explorer
- Monitor how your node's connectivity changes over time
- Document any patterns in peer connections

## 📚 Resources
- [Rippled Configuration Documentation](https://xrpl.org/docs/infrastructure/configuration/connect-your-rippled-to-the-xrp-test-net)
- [XRPL Mainnet Explorer](https://livenet.xrpl.org/)
- [XRPL Network Nodes](https://livenet.xrpl.org/network/nodes)