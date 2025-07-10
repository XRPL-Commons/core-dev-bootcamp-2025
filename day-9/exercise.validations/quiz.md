## Consensus Validations Quiz

### 1. Architecture

**1.1** Which of the following best describes the role of the Consensus Validations component in the system architecture?  
A) It stores all ledger data permanently  
B) It manages the collection, validation, and expiration of validation messages from peers  
C) It handles transaction signing  
D) It is responsible for network communication only

**1.2** True or False: Consensus Validations operates independently and does not interact with the consensus process.

---

### 2. Data Structures

**2.1** What data structure is primarily used to store and organize validation messages for efficient lookup by ledger hash?  
A) Hash map  
B) Ledger trie  
C) Linked list  
D) Array

**2.2** True or False: Each validation message is associated with a specific ledger sequence and hash.

---

### 3. Validation Message Handling

**3.1** Which method is responsible for processing a new validation message received from a peer?  
A) processTrustedProposal  
B) recvValidation  
C) doVoting  
D) setMode

**3.2** True or False: Validation messages are only accepted from trusted validators.

---

### 4. Trust Management

**4.1** How does Consensus Validations determine if a validation message should be trusted?  
A) By checking the validator's public key against a set of trusted keys  
B) By checking the message timestamp  
C) By verifying the transaction fee  
D) By checking the ledger sequence

**4.2** Which method is called when the set of trusted validators changes?  
A) trustChanged  
B) setMode  
C) doVoting  
D) mapComplete

---

### 5. Sequence Enforcement

**5.1** True or False: Consensus Validations enforces that only one validation per validator per ledger sequence is accepted.

**5.2** What happens if a validator submits multiple validations for the same ledger sequence?  
A) All are accepted  
B) Only the first is accepted; others are ignored  
C) Only the last is accepted  
D) All are rejected

---

### 6. Ledger Trie Usage

**6.1** What is the primary purpose of using a ledger trie in Consensus Validations?  
A) To store account balances  
B) To efficiently organize and query validations by ledger hash and sequence  
C) To manage transaction fees  
D) To store amendment votes

---

### 7. Expiration and Querying

**7.1** True or False: Old validation messages are expired and removed from storage after a certain period or when they are no longer relevant.

**7.2** Which of the following is a reason to query the validations data structure?  
A) To determine the quorum for a ledger  
B) To find all validations for a given ledger hash  
C) To check if a validator is trusted  
D) All of the above

---

### 8. Integration with Consensus

**8.1** Which method is used to check if a ledger sequence can be validated?  
A) canValidateSeq  
B) doVoting  
C) setNeedNetworkLedger  
D) isBlocked

**8.2** True or False: Consensus Validations provides validation data to the consensus process to help determine the last closed ledger.

---

### 9. Thread Safety

**9.1** True or False: Consensus Validations must be thread-safe because it is accessed by multiple threads during consensus and network operations.

---

### 10. Adaptor Pattern

**10.1** What is the purpose of using the adaptor pattern in Consensus Validations?  
A) To allow different implementations of validation storage and querying  
B) To manage network connections  
C) To handle transaction signing  
D) To store ledger data

---

### 11. Byzantine Detection

**11.1** True or False: Consensus Validations can help detect byzantine behavior by identifying validators that submit conflicting validations for the same ledger sequence.

---

### 12. Negative UNL

**12.1** What is the purpose of the Negative UNL (Unique Node List) feature?  
A) To increase the number of trusted validators  
B) To temporarily remove unreliable validators from the consensus process  
C) To store amendment votes  
D) To manage transaction fees

**12.2** Which method is involved in Negative UNL voting?  
A) nUnlVote_.doVoting  
B) processTrustedProposal  
C) setMode  
D) mapComplete

---

### 13. Amendment Voting

**13.1** True or False: Consensus Validations participates in amendment voting by collecting and tallying votes from trusted validations.

**13.2** Which method is responsible for handling amendment voting?  
A) doVoting  
B) recvValidation  
C) setNeedNetworkLedger  
D) isBlocked