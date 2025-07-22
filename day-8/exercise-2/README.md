# 🧪 Consensus Engineering Challenge: Creating a 50% Dispute

## Overview
In this hands-on exercise, you'll create a consensus scenario where validators are evenly split on whether to include a transaction, triggering the dispute resolution mechanisms in Ripple's consensus algorithm.

## Background: Dispute Mechanics

Disputes occur when validators disagree on transaction inclusion. The `DisputedTx` class tracks votes and adjusts thresholds over time:

- **Initial threshold**: 50% (simple majority)
- **Later rounds**: 65%, then 70%, finally 95%
- **Vote switching**: Validators can change positions based on peer consensus

## Exercise Setup

### Step 1: Navigate to the Test File

```bash
cd rippled/src/test/consensus/
```

Open `Consensus_test.cpp` in your preferred editor.

### Step 2: Locate the Target Area

Find the `testDisputes()` function around line 1000+ to see existing dispute handling patterns.

## Phase 1: Create Your Test Function (10 minutes)

### Add the Test Function

After the existing `testDisputes()` function, add:

```cpp
void
testCustomDispute()
{
    using namespace csf;
    using namespace std::chrono;
    testcase("custom 50% dispute");

    ConsensusParms const parms{};
    Sim sim;
    
    // Create two equal groups of validators
    PeerGroup groupA = sim.createGroup(3);  // 3 validators
    PeerGroup groupB = sim.createGroup(3);  // 3 validators  
    PeerGroup network = groupA + groupB;    // Total: 6 validators
    
    // Set up trust - all validators trust each other
    network.trust(network);
    
    // Connect with realistic network delays
    SimDuration delay = round<milliseconds>(0.2 * parms.ledgerGRANULARITY);
    network.connect(network, delay);
    
    std::cout << "=== 50% Dispute Test Setup ===" << std::endl;
    std::cout << "Group A: " << groupA.size() << " validators" << std::endl;
    std::cout << "Group B: " << groupB.size() << " validators" << std::endl;
    
    // Continue with the rest of the implementation...
}
```

### Register Your Test

In the `run()` function at the bottom of the class, add:

```cpp
void
run() override
{
    // testShouldCloseLedger();
    // testCheckConsensus();
    // testStandalone();
    // testPeersAgree();
    // testSlowPeers();
    // testCloseTimeDisagree();
    // testWrongLCL();
    // testConsensusCloseTimeRounding();
    // testFork();
    // testHubNetwork();
    // testPreferredByBranch();
    // testPauseForLaggards();
    // testDisputes();
    testCustomDispute();  // Add this line
}
```

**❓ Question**: Why use 6 validators total? What happens with an odd number?

## Phase 2: Engineer the Dispute

### Add Dispute Setup

Inside your `testCustomDispute()` function, after the setup code:

```cpp
// Initial consensus round to establish baseline
sim.run(1);
BEAST_EXPECT(sim.synchronized());
std::cout << "Initial round complete - network synchronized" << std::endl;

// Create conflicting transaction scenarios
// Group A will see and propose transaction 100
for (Peer* peer : groupA)
{
    peer->openTxs.insert(Tx{100});
    std::cout << "Peer " << peer->id << " (Group A) has transaction 100" << std::endl;
}

// Group B will see and propose transaction 200  
for (Peer* peer : groupB)
{
    peer->openTxs.insert(Tx{200});
    std::cout << "Peer " << peer->id << " (Group B) has transaction 200" << std::endl;
}

// Both groups see a common transaction that everyone agrees on
for (Peer* peer : network)
{
    peer->openTxs.insert(Tx{999}); // Everyone agrees on this one
}

std::cout << "=== Dispute Setup Complete ===" << std::endl;
std::cout << "Group A wants: Tx{100} + Tx{999}" << std::endl;
std::cout << "Group B wants: Tx{200} + Tx{999}" << std::endl;
```

**❓ Question**: Why add Tx{999} to everyone? What role does it play in consensus?

## Phase 3: Monitor the Dispute

### Create Dispute Monitor

Add this monitoring code before running consensus:

```cpp
// Dispute monitoring collector
struct DisputeMonitor
{
    int positionChanges = 0;
    std::map<csf::PeerID, int> peerChanges;
    
    template <class E>
    void on(csf::PeerID, csf::SimTime, E const&) {}
    
    void on(csf::PeerID who, csf::SimTime when)
    {
        positionChanges++;
        peerChanges[who]++;
        std::cout << "🔄 Peer " << who << " changed position (change #" 
                  << peerChanges[who] << ")" << std::endl;
    }
    
    void on(csf::PeerID who, csf::SimTime when, csf::AcceptLedger const& e)
    {
        std::cout << "✅ Peer " << who << " accepted ledger " << e.ledger.seq() 
                  << " with " << e.ledger.txs().size() << " transactions" << std::endl;
    }
};

DisputeMonitor monitor;
sim.collectors.add(monitor);
```

### Run Consensus with Monitoring

```cpp
std::cout << "\n=== Starting Consensus Round ===" << std::endl;

// Run one round and check for disputes
sim.run(1);

std::cout << "\n=== After First Consensus Round ===" << std::endl;
std::cout << "Network synchronized: " << (sim.synchronized() ? "YES" : "NO") << std::endl;
std::cout << "Position changes observed: " << monitor.positionChanges << std::endl;

// If not synchronized, run more rounds
if (!sim.synchronized()) 
{
    std::cout << "\n=== Running Additional Rounds for Resolution ===" << std::endl;
    sim.run(2);
    std::cout << "Final synchronization: " << (sim.synchronized() ? "YES" : "NO") << std::endl;
    std::cout << "Total position changes: " << monitor.positionChanges << std::endl;
}
```

**❓ Question**: What does `sim.synchronized()` returning false indicate?

## Phase 4: Analyze Results

### Add Result Analysis

```cpp
// Analyze the final state
std::cout << "\n=== FINAL ANALYSIS ===" << std::endl;

if (BEAST_EXPECT(sim.synchronized()))
{
    // Look at what everyone agreed on
    Peer* samplePeer = network[0];
    auto const& finalLedger = samplePeer->lastClosedLedger;
    
    std::cout << "Final ledger sequence: " << finalLedger.seq() << std::endl;
    std::cout << "Final transaction count: " << finalLedger.txs().size() << std::endl;
    
    // Check which disputed transactions made it
    bool hasTx100 = finalLedger.txs().find(Tx{100}) != finalLedger.txs().end();
    bool hasTx200 = finalLedger.txs().find(Tx{200}) != finalLedger.txs().end();
    bool hasTx999 = finalLedger.txs().find(Tx{999}) != finalLedger.txs().end();
    
    std::cout << "Transaction 100 (Group A): " << (hasTx100 ? "INCLUDED" : "EXCLUDED") << std::endl;
    std::cout << "Transaction 200 (Group B): " << (hasTx200 ? "INCLUDED" : "EXCLUDED") << std::endl;
    std::cout << "Transaction 999 (Common):  " << (hasTx999 ? "INCLUDED" : "EXCLUDED") << std::endl;
    
    // Analyze validator behavior
    std::cout << "\n--- Validator Final States ---" << std::endl;
    for (Peer* peer : network)
    {
        std::cout << "Peer " << peer->id << " saw " << peer->prevProposers 
                  << " other proposers" << std::endl;
    }
    
    // Test expectations
    BEAST_EXPECT(hasTx999);  // Common transaction should always be included
    
    // At least one disputed transaction should be excluded
    BEAST_EXPECT(!(hasTx100 && hasTx200));  // Both can't be included due to conflict
}
```

## Advanced Challenges

### Challenge 1: Uneven Splits
Modify to create a 60/40 split:
```cpp
PeerGroup groupA = sim.createGroup(6);
PeerGroup groupB = sim.createGroup(4);
```

### Challenge 2: Network Partitions
Add delays between groups:
```cpp
groupA.connect(groupB, round<milliseconds>(2.0 * parms.ledgerGRANULARITY));
```

### Challenge 3: Transaction Priority
Create scenarios where transaction fees affect dispute resolution.

## Verification Questions

1. **How many consensus rounds were needed?**
2. **Which validators changed positions first?**
3. **What determined the final transaction set?**
4. **How did the 50/50 split resolve?**