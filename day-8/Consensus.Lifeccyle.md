## Full Consensus Process Summary

**Consensus in the system begins in `Application.cpp`:**

```cpp
// start first consensus round
if (!m_networkOPs->beginConsensus(
        m_ledgerMaster->getClosedLedger()->info().hash, {}))
{
    JLOG(m_journal.fatal()) << "Unable to start consensus";
    return false;
}
```

- Here, the application starts the first consensus round by calling `beginConsensus` on the `NetworkOPs` object, passing the hash of the last closed ledger.
- If consensus cannot be started, a fatal log is written and the process returns false.

[NetworkOPsImp::beginConsensus](#325-networkopsimpbeginconsensus)

---

### 1. RCLConsensus::Adaptor::preStartRound: PreStart

**Summary:**  
This preparatory phase ensures the node is fully ready to participate in a new consensus round. The system checks that it is synchronized with the network, verifies the integrity and state of the previous ledger, and resets or initializes all internal data structures required for consensus. This may include cleaning up any lingering state from the previous round, ensuring the node is not lagging behind, and preparing to receive proposals from peers. If the node is not ready (e.g., missing the previous ledger or out of sync), it may delay or abort the start of consensus to avoid propagating errors.

**Details:**  
- Verifies node synchronization and ledger integrity.
- Cleans up or resets state from the previous round.
- Prepares data structures for proposal collection.
- Ensures readiness to receive and process peer proposals.
- [RCLConsensus::Adaptor::preStartRound (RCLConsensus.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/consensus/RCLConsensus.h#LXX) (replace `LXX` with actual line number).

---

### 2. Consensus<Adaptor>::startRound: Start New Consensus Round

**Summary:**  
This function initiates a new consensus round by establishing the round's parameters, such as the ledger to be closed, the set of candidate transactions, and the initial consensus state. It sets up timers and state machines that will drive the round's progress, and notifies other system components that a new round has begun. This is a critical transition point, as it marks the start of active consensus operations for the next ledger.

**Details:**  
- Initializes round parameters (ledger hash, transaction set, etc.).
- Sets up timers and state machines for consensus progression.
- Notifies subsystems (e.g., transaction queue, ledger master) of round start.
- Ensures all nodes begin the round with a consistent view.
- [Consensus::startRound (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

### 3. Consensus<Adaptor>::startRoundInternal: ConsensusPhase::open

**Summary:**  
Enters the "open" phase of consensus, during which the ledger remains open for new transactions and the node begins collecting proposals from peers. This phase is essential for gathering the full set of candidate transactions and proposals that will be considered for inclusion in the next ledger. The system also prepares to replay proposals to ensure all nodes are considering the same transaction set.

**Details:**  
- Ledger is open; new transactions can be submitted.
- Collects proposals from peers regarding transaction inclusion.
- Prepares for proposal playback and validation.
- Ensures all valid proposals are considered for consensus.
- [Consensus::startRoundInternal (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

#### 3.1 playbackProposals: Start Playing Back Peer Proposals

**Summary:**  
Processes and replays proposals received from peers to ensure all nodes are considering the same set of transactions. This step is crucial for maintaining consistency across the network, as it deduplicates, validates, and integrates peer proposals into the local candidate set.

**Details:**  
- Replays all received proposals for the current round.
- Deduplicates and validates proposals.
- Integrates valid proposals into the local transaction set.
- Ensures all nodes are aligned on candidate transactions.
- [Consensus::playbackProposals (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

#### 3.2 Consensus<Adaptor>::timerEntry

**Summary:**  
Handles periodic timer events that drive the consensus process forward. On each timer tick, the system checks the current state, evaluates whether to transition to the next phase, and performs maintenance tasks such as checking ledger status or updating proposals. This mechanism ensures timely progress and responsiveness to network conditions.

**Details:**  
- Invoked at regular intervals during consensus.
- Checks consensus state and triggers phase transitions.
- Performs maintenance (e.g., ledger checks, proposal updates).
- Ensures consensus process remains timely and robust.
- [Consensus::timerEntry (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

##### 3.2.1 Consensus<Adaptor>::checkLedger: get previous ledger, handle wrong ledger

**Summary:**  
Verifies the state and integrity of the previous ledger. If the previous ledger is missing or does not match expectations, the system invokes error handling routines (such as `handleWrongLedger`) to resolve discrepancies. This step is vital for ensuring the node is synchronized with the network and not operating on a divergent ledger chain.

**Details:**  
- Fetches the previous ledger using `adaptor_.getPrevLedger`.
- Compares the previous ledger to expected state.
- If mismatched, calls `handleWrongLedger` to resolve.
- May trigger ledger acquisition or resynchronization.
- [Consensus::checkLedger (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

##### 3.2.2 Consensus<Adaptor>::phaseOpen: Determines if we should close the ledger based on last ledger time

**Summary:**  
Evaluates whether the current ledger should be closed, based on elapsed time, transaction activity, and network conditions. This decision is critical for balancing ledger closure frequency with transaction throughput and network stability.

**Details:**  
- Uses `shouldCloseLedger` to assess closure conditions.
- Considers time since last ledger, transaction volume, and peer signals.
- If closure conditions are met, transitions to the next consensus phase.
- [Consensus::phaseOpen (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

###### 3.2.2.1 shouldCloseLedger: Should we close the consensus round?

**Summary:**  
Determines if the consensus round should be closed, based on a combination of elapsed time, transaction volume, and peer agreement. This function ensures that ledgers are closed neither too quickly (which could fragment transactions) nor too slowly (which could delay settlement).

**Details:**  
- Evaluates closure criteria (time, volume, peer agreement).
- Returns true if closure is warranted, false otherwise.
- [Consensus::shouldCloseLedger (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

####### 3.2.2.1.1 Consensus<Adaptor>::closeLedger: Closes the ledger

**Summary:**  
Finalizes the current ledger, preventing further transactions from being added. This step locks in the set of transactions to be considered for consensus and notifies peers that the ledger is closed, transitioning the process to the next phase.

**Details:**  
- Finalizes transaction set for the ledger.
- Notifies peers of ledger closure.
- Prepares for consensus on the closed set.
- [Consensus::closeLedger (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

##### 3.2.3 Consensus<Adaptor>::phaseEstablish

**Summary:**  
Enters the "establish" phase, where nodes exchange positions and proposals to reach agreement on the set of transactions to include in the closed ledger. Disputed transactions are identified and resolved through iterative voting and proposal updates.

**Details:**  
- Nodes broadcast and receive updated positions/proposals.
- Disputed transactions are detected and votes are adjusted.
- The system iteratively refines the consensus set.
- [Consensus::phaseEstablish (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

###### 3.2.3.1 Consensus<Adaptor>::updateOurPositions

**Summary:**  
Updates the node's own position in the consensus process based on received peer proposals and local state. This may involve changing votes on disputed transactions or adjusting the set of supported transactions to align with the network.

**Details:**  
- Processes peer proposals and local state.
- Adjusts votes on disputed transactions.
- Updates the node's candidate transaction set.
- [Consensus::updateOurPositions (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

###### Consensus<Adaptor>::shouldPause: Should the node pause consensus?

**Summary:**  
Evaluates whether the node should temporarily pause the consensus process, typically due to network issues such as too many lagging peers or insufficient participation. Pausing helps prevent premature advancement and allows the network to catch up.

**Details:**  
- Checks for lagging or non-participating peers.
- Pauses consensus if network health is insufficient.
- Resumes when conditions improve.
- [Consensus::shouldPause (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

---

###### Consensus<Adaptor>::haveConsensus: Has consensus been reached?

**Summary:**  
Determines whether sufficient agreement has been reached among participating nodes to finalize the consensus round. This involves evaluating peer proposals, agreement thresholds, and timing constraints to ensure robust consensus.

**Details:**  
- Evaluates peer proposals and agreement percentages.
- Checks if minimum consensus time has elapsed.
- Calls `checkConsensus` and `checkConsensusReached` to assess agreement.
- Advances to ledger acceptance if consensus is achieved.
- [Consensus::haveConsensus (Consensus.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/consensus/Consensus.cpp#LXX)

**Elaboration on checkConsensus and checkConsensusReached:**

- During the "establish" phase, the system repeatedly checks if consensus has been reached by calling haveConsensus (or similar logic).
- This function calls checkConsensus, passing in the number of proposers, number of agreements, timing information, and other relevant parameters.
- checkConsensus performs several checks, such as:
    - Has the minimum consensus time elapsed?
    - Are there enough proposers?
    - Has the maximum allowed time elapsed?
    - Are enough nodes in agreement?
- As part of these checks, checkConsensus calls checkConsensusReached, which evaluates if the percentage of agreeing nodes meets the required threshold (e.g., 80%).
- If checkConsensusReached returns true, consensus is considered reached and the process advances to the next phase (accepting and building the ledger).
- If not, the process continues gathering proposals and re-evaluates on the next timer tick.

---

#### 3.2.3.2 RCLConsensus::Adaptor::onAccept

**Summary:**  
Handles the acceptance of the consensus result, building the new ledger and applying any remaining transactions. This step constructs the Last Closed Ledger (LCL) from the agreed-upon transaction set, notifies the ledger management subsystem, and attempts to apply any disputed transactions that were not included in the consensus set.

**Details:**  
- Calls `buildLCL` to construct the LCL from agreed transactions.
- Notifies `LedgerMaster` that consensus is built.
- Attempts to apply disputed or deferred transactions.
- Ensures ledger consistency and completeness.
- [RCLConsensus::Adaptor::onAccept (RCLConsensus.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/consensus/RCLConsensus.h#LXX)

---

####### 3.2.3.2.1 RCLConsensus::Adaptor::buildLCL

**Summary:**  
Builds the Last Closed Ledger (LCL) from the agreed-upon set of transactions, applying them in canonical order and ensuring the resulting ledger is consistent and valid.

**Details:**  
- Applies transactions in agreed order to previous ledger.
- Ensures all state changes are correctly recorded.
- Produces a new, validated ledger object.
- [RCLConsensus::Adaptor::buildLCL (RCLConsensus.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/consensus/RCLConsensus.h#LXX)

---

####### 3.2.3.2.2 LedgerMaster::consensusBuilt

**Summary:**  
Notifies the ledger management component that a new consensus ledger has been built, updating the system's view of the current ledger and potentially triggering further processing or notifications.

**Details:**  
- Updates internal state to reference the new LCL.
- May trigger downstream processing or alerts.
- [LedgerMaster::consensusBuilt (LedgerMaster.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/ledger/LedgerMaster.h#LXX)

---

####### 3.2.3.2.3 Apply disputed transactions that didn't get in

**Summary:**  
Attempts to apply transactions that were disputed and not included in the consensus set, if possible. This ensures that no valid transaction is lost and that deferred transactions are queued for future rounds.

**Details:**  
- Applies valid but previously disputed transactions.
- Queues transactions for next round if not applicable.
- [RCLConsensus::Adaptor::onAccept (RCLConsensus.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/consensus/RCLConsensus.h#LXX)

---

###### 3.2.3.3 RCLConsensus::Adaptor::doAccept

**Summary:**  
Finalizes acceptance of the consensus result by building the ledger and processing the transaction queue. This step ensures the ledger is fully constructed and all pending transactions are handled appropriately.

**Details:**  
- Calls `buildLCL` for redundancy or finalization.
- Calls `BuildLedger::buildLedger` to construct the ledger object.
- Processes the closed ledger's transaction queue via `app_.getTxQ().processClosedLedger`.
- [RCLConsensus::Adaptor::doAccept (RCLConsensus.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/consensus/RCLConsensus.h#LXX)

---

####### 3.2.3.3.1 BuildLedger::buildLedger

**Summary:**  
Constructs the ledger object from the agreed set of transactions, applying them to the ledger state and ensuring all changes are recorded.

**Details:**  
- Applies transactions to ledger state.
- Ensures all state changes are persisted.
- [BuildLedger::buildLedger (BuildLedger.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/ledger/BuildLedger.h#LXX)

---

####### 3.2.3.3.2 app_.getTxQ().processClosedLedger

**Summary:**  
Processes the transaction queue for the closed ledger, handling any remaining or deferred transactions. This step updates fee metrics, removes included transactions, and manages retries or deferrals.

**Details:**  
- Updates fee metrics and transaction status.
- Removes transactions now included in the ledger.
- Queues deferred transactions for future rounds.
- [TxQ::processClosedLedger (TxQ.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/misc/TxQ.h#LXX)

---

####### 3.2.3.3.3 app_.openLedger().accept

**Summary:**  
Finalizes the open ledger by:
- Applying any local transactions that were not included in the closed ledger.
- Processing retries and pending transactions.
- Ensuring the open ledger is ready for the next consensus round.
- Updating the ledger state to reflect all valid local activity.

---

##### 3.2.4 NetworkOPsImp::endConsensus

**Summary:**  
Marks the end of the consensus process for the current round and transitions the system to the next state.  
After consensus is reached and the new ledger is built, `endConsensus` performs several important steps to ensure the node is synchronized and ready for the next round:

- **checkLastClosedLedger:**  
  This function determines if the node's last closed ledger (LCL) matches the preferred LCL as seen by the network. It compares the local LCL with those reported by peers and validations. If the local LCL is not the preferred one, it may trigger a ledger switch to synchronize with the network.

- **switchLastClosedLedger:**  
  If a switch is needed, this function updates the node's last closed ledger to the new preferred ledger. It logs the change, clears any flags indicating the need for a network ledger, and performs several key actions to update the node's state:
    - **clearNeedNetworkLedger:**  
      Clears any internal flags or state indicating that the node needs to acquire a new ledger from the network. This signals that the node is now in sync.
    - **app_.getTxQ().processClosedLedger:**  
      Processes the transaction queue in the context of the new closed ledger. This updates fee metrics, removes transactions that are now included in the ledger, and manages any transactions that need to be retried or deferred.
    - **app_.openLedger().accept:**  
      Accepts the new open ledger, applying any local transactions that were not included in the closed ledger. This ensures the open ledger is up-to-date and ready to accept new transactions for the next consensus round.

- **m_ledgerMaster.switchLCL:**  
  Updates the ledger master to point to the new last closed ledger, ensuring all components reference the correct ledger.

- **setMode:**  
  Sets the operational mode of the node based on the outcome of consensus and the ledger switch. The node may enter modes such as tracking, proposing, or observing, depending on its synchronization state.

- **Prepares for the next round:**  
  After these steps, the system is ready to begin the next consensus round, ensuring all state is consistent and up-to-date.

[NetworkOPsImp::endConsensus (NetworkOPs.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/misc/NetworkOPs.cpp#LXX)

---

###### 3.2.4.1 setMode

**Summary:**  
Sets the operational mode of the node based on the outcome of consensus. The node may switch between modes such as tracking, proposing, or observing, depending on its synchronization state and network conditions.

**Details:**  
- Evaluates node state and network health.
- Sets operational mode accordingly.
- [NetworkOPsImp::setMode (NetworkOPs.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/misc/NetworkOPs.cpp#LXX)

---

##### 3.2.5 NetworkOPsImp::beginConsensus

**Summary:**  
Begins the next consensus round by resetting state and preparing for new proposals. This function notifies the system that a new round is starting, resets timers and state machines, and ensures all components are ready for the next round of consensus.

**Details:**  
- Notifies system of new consensus round.
- Resets timers and state machines.
- Prepares internal state for new proposals.
- [NetworkOPsImp::beginConsensus (NetworkOPs.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/misc/NetworkOPs.cpp#LXX)

---

###### 3.2.5.1 NetworkOPsImp::reportConsensusStateChange

**Summary:**  
Reports changes in the consensus state to monitoring or logging systems. This provides visibility into consensus progress and may trigger alerts or logs for operators.

**Details:**  
- Logs or reports consensus state changes.
- Provides monitoring visibility.
- [NetworkOPsImp::reportConsensusStateChange (NetworkOPs.cpp)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/misc/NetworkOPs.cpp#LXX)

---

###### 3.2.5.2 RCLConsensus::startRound

**Summary:**  
Loops back to the start of the consensus process for the next round, ensuring continuous operation of the consensus mechanism.

**Details:**  
- Re-initializes consensus state for next round.
- Ensures uninterrupted consensus operation.
- [RCLConsensus::startRound (RCLConsensus.h)](https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/consensus/RCLConsensus.h#LXX)