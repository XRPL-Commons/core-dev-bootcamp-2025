## Consensus_TXOrdering Quiz

### 1. CanonicalTXSet Ordering and Tie-Breaking

**1.1** What is the primary purpose of the `CanonicalTXSet` in the consensus process?  
a) To store all transactions in the ledger  
b) To provide a deterministic ordering of transactions for consensus  
c) To validate transactions  
d) To calculate transaction fees

**1.2** When two transactions from the same account are present in the `CanonicalTXSet`, what is the primary tie-breaker used to determine their order?  
a) Transaction hash  
b) Account sequence number  
c) Fee level  
d) Ledger index

**1.3** True or False: The `CanonicalTXSet` ensures that transactions from different accounts are always ordered by their fee level.

---

### 2. Transaction Set Construction and Proposal

**2.1** In the consensus process, what is the role of the `TxSet_t` (transaction set)?  
a) It holds the set of transactions proposed for inclusion in the next ledger.  
b) It stores the results of transaction execution.  
c) It tracks failed transactions.  
d) It manages account balances.

**2.2** What must be true about the `txns.id()` and `position.position()` in the `ConsensusResult` constructor?  
a) They must be different  
b) They must be equal  
c) They must both be zero  
d) They must be negative

**2.3** Short Answer: Why is it important for all nodes to agree on the transaction set ID during consensus?

---

### 3. DisputedTx Lifecycle and Dispute Management

**3.1** What is the purpose of the `DisputedTx` class in the consensus process?  
a) To store all valid transactions  
b) To track transactions that are not agreed upon by all peers  
c) To calculate transaction fees  
d) To manage account sequence numbers

**3.2** When does a transaction become a "disputed" transaction?  
a) When it is included in the ledger  
b) When it is proposed by all peers  
c) When there is disagreement among peers about its inclusion  
d) When it fails validation

**3.3** Short Answer: What happens to a disputed transaction if consensus is not reached on its inclusion?

---

### 4. Consensus State Determination

**4.1** Which of the following is NOT a possible value for the consensus state?  
a) No  
b) MovedOn  
c) Yes  
d) Maybe

**4.2** What are the key parameters used by `checkConsensus` to determine consensus state? (Select all that apply)  
a) Number of proposers  
b) Time since consensus started  
c) Fee level of transactions  
d) Agreement thresholds

**4.3** What is the effect of the `normalConsensusIncreasePercent` and `slowConsensusDecreasePercent` parameters in the `TxQ::Setup` struct?

**4.4** Short Answer: What does the consensus process do if the required threshold is not met within the timeout period?

---

### 5. TxQ Ordering and Per-Account Logic

**5.1** What is the purpose of the `TxQ` (Transaction Queue)?  
a) To store all validated transactions  
b) To manage transactions waiting to be included in a ledger, ordered by fee and per-account rules  
c) To track account balances  
d) To validate transaction signatures

**5.2** What is the `maximumTxnPerAccount` parameter used for in the `TxQ::Setup` struct?  
a) To limit the number of transactions per ledger  
b) To limit the number of transactions per account in the queue  
c) To limit the number of ledgers in the queue  
d) To limit the number of failed transactions

**5.3** True or False: The `TxQ` can block transactions from being retried if the per-account limit is reached.

---

### 6. Blockers, Retries, and Per-Account Limits

**6.1** What happens to a transaction in the `TxQ` if it cannot be applied due to a sequence number gap?  
a) It is immediately discarded  
b) It is retried in the next ledger  
c) It is moved to the front of the queue  
d) It is marked as disputed

**6.2** Short Answer: How does the `retrySequencePercent` parameter affect transaction retries in the queue?

**6.3** What is the effect of the `minimumTxnInLedger` and `targetTxnInLedger` parameters in the `TxQ::Setup` struct?

---

### 7. Supporting Classes and Utilities

**7.1** What is the purpose of the `Metrics` struct in `TxQ`?  
a) To store transaction hashes  
b) To track statistics about the transaction queue and fee levels  
c) To manage account balances  
d) To validate transactions

**7.2** In the consensus process, what is the role of the `ConsensusTimer`?  
a) To track the time taken for transaction validation  
b) To measure the duration of each consensus round  
c) To calculate transaction fees  
d) To order transactions