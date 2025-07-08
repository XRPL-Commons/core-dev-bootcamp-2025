# Stop the Fork - Developer Workshop

## Overview
This hands-on workshop demonstrates how network forks occur in distributed systems and how to monitor them in real-time. Participants will work with a private 7-node network to trigger a controlled fork through an amendment activation process.

## Workshop Objectives
- Understand how network amendments can cause forks in distributed systems
- Experience real-time fork monitoring using network tools
- Analyze fork behavior through log examination
- Practice using playground scripts for network interaction

## Prerequisites
- Basic understanding of distributed systems
- Familiarity with TypeScript/Node.js
- Network monitoring concepts

## Workshop Setup

### Network Configuration
- **Network Type**: Private test network
- **Node Count**: 8 nodes with validators
- **Fork Trigger**: Amendment activation when 4/8 nodes are updated

#### Validator Endpoints
```
ws://79.110.60.99:6106
ws://79.110.60.100:6206
ws://79.110.60.101:6306
ws://79.110.60.102:6406
ws://79.110.60.103:6506
ws://79.110.60.104:6606
ws://79.110.60.105:6016
ws://79.110.60.106:6026
```

### Required Tools
- **Real-time Monitor**: [XRPL Win Monitor](https://xrplwin.com/monitor)
- **Ledger Explorer**: [XRPLF Explorer](https://explorer.xrplf.org/wss:batch.nerdnest.xyz/)
- **Feature Command Tool**: [Feature Command Interface](https://explorer.xrplf.org/wss:batch.nerdnest.xyz/command)
- **Playground Scripts**: Pre-configured TypeScript scripts

## Workshop Steps

### Phase 1: Network Preparation
1. **Initial State Verification**
   - Confirm all 8 nodes are running and synchronized
   - Verify network connectivity and validator status
   - Open monitoring tools in separate browser tabs

2. **Participant Assignments**
   - Assign 4 participants to the "updating" nodes
   - Assign 4 participants to the "non-updating" nodes
   - Each participant should note their assigned node endpoint

### Phase 2: Amendment Activation
1. **Validator Selection**
   - **Nodes to Update (4/8)**: 
     - Node 1: `ws://79.110.60.99:6106`
     - Node 2: `ws://79.110.60.100:6206`
     - Node 3: `ws://79.110.60.101:6306`
     - Node 4: `ws://79.110.60.102:6406`
   
   - **Nodes to Keep Original (4/8)**:
     - Node 5: `ws://79.110.60.103:6506`
     - Node 6: `wd://79.110.60.104:6606`
     - Node 7: `ws://79.110.60.105:6016`
     - Node 8: `ws://79.110.60.106:6026`

2. **Node Updates**
   - Selected participants will run the voting script for their assigned nodes
   - Monitor node status during updates
   - Ensure exactly 4 nodes are updated to reach the threshold

3. **Script Execution**
   ```bash
   # From playground root directory
   ts-node src/amendment/vote.ts
   ```</anizer>

### Phase 3: Fork Initiation
1. **Transaction Submission**
   - Instructor or designated participant executes the amendment submission
   - Run the pre-configured submission script
   
   ```bash
   # From playground root directory
   ts-node src/amendment/submit.ts
   ```

2. **Real-time Monitoring**
   - Watch the fork occur live through XRPL Win Monitor
   - Observe ledger progression stopping in the explorer
   - Note the flag ledger appearance
   - Document timestamp and ledger numbers

3. **Vote Tracking**
   - Monitor amendment votes using the Feature Command Tool
   - Navigate to [Feature Command Interface](https://explorer.xrplf.org/wss:batch.nerdnest.xyz/command)
   - Track which validators have voted for the amendment
   - Observe vote count progression toward the threshold

### Phase 4: Fork Analysis
1. **Log Collection**
   - Download network logs from all nodes
   - Focus on the fork event timeline
   - Identify divergence points

2. **Log Review Session**
   - Analyze fork behavior patterns
   - Discuss network partition effects
   - Review consensus mechanism responses

## Key Monitoring Points

### During Fork Event
- **Ledger Explorer**: Watch for ledger stream interruption
- **Network Monitor**: Observe node connectivity changes
- **Flag Ledger**: Identify the specific ledger where fork occurs
- **Feature Command Tool**: Monitor amendment vote status and progression

### Post-Fork Analysis
- **Node Behavior**: How did different nodes respond?
- **Consensus Impact**: What happened to transaction processing?
- **Recovery Patterns**: How did the network attempt to resolve the fork?