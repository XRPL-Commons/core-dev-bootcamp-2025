# XRPL Ledger State Analysis Exercise

## Background: Understanding Ledger State

The XRPL ledger is a global state machine that tracks all accounts, balances, and objects on the network. Each ledger contains the complete state of the network at a specific point in time, including all account balances, settings, and various ledger objects created by transactions.

In this exercise, you'll examine the baseline ledger state, then create transactions that add new ledger objects and observe how they change the overall ledger structure.

## Exercise Overview

You'll:
1. **Examine the baseline ledger state** with minimal objects
2. **Create transactions** that add new ledger entry types
3. **Analyze the resulting changes** to the ledger structure
4. **Compare results** with classmates to see different object types

## Step 1: Examine the Baseline Ledger State

First, let's look at the current ledger state to understand what objects exist by default.

### Command to Run

```bash
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.app.LedgerRPC
```

### Understanding the Baseline Output

The baseline ledger contains three fundamental ledger entry types:

#### 1. AccountRoot Object
```json
{
  "Account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
  "Balance": "100000000000000000",
  "Flags": 0,
  "LedgerEntryType": "AccountRoot",
  "OwnerCount": 0,
  "PreviousTxnID": "0000000000000000000000000000000000000000000000000000000000000000",
  "PreviousTxnLgrSeq": 0,
  "Sequence": 1,
  "index": "2B6AC232AA4C4BE41BF49D2459FA4A0347E1B543A4C92FCEE0821C0201E2E9A8"
}
```

**Key Fields:**
- **Account**: The account's address
- **Balance**: Current XRP balance (100,000,000,000,000,000 drops = 100 billion XRP)
- **OwnerCount**: Number of objects owned by this account (currently 0)
- **Sequence**: Next transaction sequence number for this account

#### 2. FeeSettings Object
```json
{
  "BaseFee": "c8",
  "Flags": 0,
  "LedgerEntryType": "FeeSettings",
  "ReferenceFeeUnits": 10,
  "ReserveBase": 200000000,
  "ReserveIncrement": 50000000,
  "index": "4BC50C9B0D8515D3EAAE1E74B29A95804346C491EE1A95BF25E4AAB854A6A651"
}
```

**Key Fields:**
- **BaseFee**: Base transaction fee (0xc8 = 200 drops)
- **ReserveBase**: Base reserve requirement (200,000,000 drops = 200 XRP)
- **ReserveIncrement**: Per-object reserve (50,000,000 drops = 50 XRP)

#### 3. LedgerHashes Object
```json
{
  "Flags": 0,
  "Hashes": ["E72CE5359BE861738E57E2394F8894B9908815F30780A4A098F23B02F0F2FE7A", "4E1966D711CCB7D8EEFB5BB65F5761C0DD36DE4B7C3F939AED95E58CD428D372"],
  "LastLedgerSequence": 2,
  "LedgerEntryType": "LedgerHashes",
  "index": "B4979A36CDC7F3D3D5C31A4EAE2AC7D7209DDA877588B9AFC66799692AB0D66B"
}
```

**Key Fields:**
- **Hashes**: Array of recent ledger hashes for historical reference
- **LastLedgerSequence**: Most recent ledger sequence in the hash list

### Current Ledger Summary

| Field | Value | Meaning |
|-------|-------|---------|
| **ledger_index** | 3 | This is the 3rd ledger in the chain |
| **account_hash** | 7F4432601CEB67B452ED8E5CF7F4151F89E6BDEBA5B45FE67EA1FB84068F94F3 | Hash of all account state |
| **total_coins** | 100000000000000000 | Total XRP in circulation (100 billion) |
| **transactions** | [] | No transactions in this ledger |

## Step 2: Create Transactions to Add Ledger Objects

Now you'll add a transaction to the test that creates new types of ledger objects. You'll be working with this test function:

Choose **one** of the following transaction types to add where the comment indicates:

### Option A: EscrowCreate Transaction

### Option B: CheckCreate Transaction

### Option C: DIDSet Transaction

### Option D: DepositPreauth Transaction

### Option E: TicketCreate Transaction

### Option F: NFTokenMint Transaction

### Important Note

After adding your transaction, you'll need to update the expected account state size in the test:

```cpp
// Change this line to match the expected number of ledger objects
BEAST_EXPECT(jrr[jss::ledger][jss::accountState].size() == 3u);
```

The new size will depend on how many objects your transaction creates:
- **Most transactions**: Change `3u` to `4u` (adds 1 object)
- **TicketCreate with 2 tickets**: Change `3u` to `5u` (adds 2 objects)

## Step 3: Implement Your Transaction

### Implementation Steps

1. **Choose your transaction type** from the options above
2. **Add the transaction code** to the test where the comment indicates
3. **Update the expected object count** in the BEAST_EXPECT line
4. **Run the test** to see the results
5. **Document your findings** for class discussion

### Running the Test

```bash
cmake --build . --target rippled --parallel 10 && ./rippled -u ripple.app.LedgerRPC
```

### What to Look For

After implementing your transaction, observe these changes:

1. **New Ledger Objects**: Your transaction should create one or more new ledger entries
2. **Account Changes**: 
   - **Balance**: Should decrease by the amount held + fees
   - **OwnerCount**: Should increase by the number of objects created
   - **Sequence**: Should increment to 2
3. **Ledger Metadata**:
   - **account_hash**: Will change due to modified account state
   - **ledger_index**: Should increment to 4
   - **transactions**: Should contain your transaction

### Expected Object Count Changes

| Transaction Type | Objects Added | New Total Count | Update BEAST_EXPECT to |
|------------------|---------------|-----------------|------------------------|
| EscrowCreate | 1 | 4 | `size() == 4u` |
| CheckCreate | 1 | 4 | `size() == 4u` |
| DIDSet | 1 | 4 | `size() == 4u` |
| DepositPreauth | 1 | 4 | `size() == 4u` |
| TicketCreate (2 tickets) | 2 | 5 | `size() == 5u` |
| NFTokenMint | 1+ | 4+ | `size() == 4u` (or higher) |

## Step 4: Analyze Your Results

### New Ledger Objects Created

Document each new ledger object:

```json
{
  "LedgerEntryType": "[Your Object Type]",
  "index": "[Object Index]",
  "[Key Field 1]": "[Value]",
  "[Key Field 2]": "[Value]",
  // ... other fields
}
```

## Class Discussion Questions

Prepare to discuss:

1. **What type of transaction did you implement?**
2. **How many ledger objects were created?**
3. **How did the account's balance and OwnerCount change?**
4. **What was the reserve impact of your transaction?**
5. **What unique fields does your ledger object type have?**

## Comparative Analysis

During class discussion, we'll compare:

### Object Creation Patterns

| Transaction Type | Objects Created | Reserve Impact |
|------------------|-----------------|----------------|
| EscrowCreate | 1 Escrow | X XRP + Amount |
| CheckCreate | 1 Check | X XRP |
| DIDSet | 1 DID | X XRP |
| DepositPreauth | 1 DepositPreauth | X XRP |
| TicketCreate | N Tickets | X XRP × N |
| NFTokenMint | Directory Page + NFToken | X XRP |

### Reserve Economics

Each object type has different reserve requirements:
- **Base Reserve**: 200 XRP (required for all accounts)
- **Object Reserve**: 50 XRP per object (with some exceptions)
- **Held Amounts**: Additional XRP locked in certain objects (like Escrows)

## Advanced Analysis Questions

1. **Why does OwnerCount increase?**
   - Objects owned by an account affect its reserve requirements

2. **What happens to the account_hash?**
   - Any change to ledger state changes the account state hash

3. **How does reserve requirement work?**
   - Base reserve + (OwnerCount × Reserve increment) = Total reserve

4. **What makes each object type unique?**
   - Different fields, behaviors, and lifecycle management

## Challenge Extension

Try creating multiple transactions of different types and observe:
1. **How OwnerCount accumulates**
2. **How different objects coexist in the ledger**
3. **The total reserve impact**
4. **The interaction between different object types**

## Key Takeaways

- **Ledger objects represent persistent state** beyond simple account balances
- **Each object type has specific fields and behaviors**
- **Reserve requirements incentivize efficient ledger usage**
- **The ledger state hash captures all changes** to the network state
- **Understanding object lifecycle is crucial** for XRPL development