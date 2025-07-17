# XRPL Transaction Tracing Lab Exercise

## Objective
Create a test for your assigned transactor and trace a transaction through the entire XRPL processing pipeline from RPC submission to final application.

---

## Part 1: Create Your Transaction Test

**Template to start with:**
```cpp
void
testTraceTransactor(FeatureBitset features)
{
   testcase("Trace Transactor");

   using namespace jtx;
   
   Env env{*this, features};
   Account const alice{"alice"};
   Account const bob{"bob"};
   env.fund(XRP(5000), alice, bob);
   env.close();

   std::cout << "START" << std::endl;

   env(pay(alice, bob, XRP(1)), ter(tesSUCCESS));
   env.close();

   BEAST_EXPECT(1 == 1);
}
```

### Step 2: Build and Run Your Test
```bash
# Build the test
cmake --build . --target rippled --parallel 10

# Run your specific test
./rippled -u ripple.bootcamp.MyTests
```

---

## Part 2: Add Transaction Tracing

### Step 3: Add Logging to Track Your Transaction
Based on the diff, we can see logging has been added to various stages of transaction processing. Your transaction will trigger these logs:

**Key logging points you'll see:**
1. **RPC Submission**: `doSubmit` - When the transaction is submitted via RPC
2. **Validation**: `checkValidity` - Initial transaction validation
3. **NetworkOPs Processing**: Multiple stages in NetworkOPs
4. **Transactor Execution**: `preflight`, `preclaim`, `doApply` in your specific transactor
5. **TxQ Processing**: Transaction queue handling

### Step 4: Run Your Test and Observe the Flow
Run your test again and observe the log output. You should see something like:
```
doSubmit
checkValidity
NetworkOPsImp::preProcessTransaction
NetworkOPsImp::processTransaction
NetworkOPsImp::doTransactionSync
NetworkOPsImp::doTransactionSyncBatch
NetworkOPsImp::apply
TxQ::apply: [transaction_id]
[YourTransactor]::preflight
[YourTransactor]::preclaim
[YourTransactor]::doApply
```

---

## Part 3: Analysis and Understanding

### Step 5: Continue Tracing the Transaction
Now that you've seen the high-level flow, let's trace deeper into the transaction processing:

**Key files to examine and add logging to:**
- `src/xrpld/app/tx/detail/Transactor.cpp` - Base transactor logic
- `src/xrpld/app/tx/detail/apply.cpp` - Transaction application logic
- `src/xrpld/ledger/OpenView.cpp` - Ledger view operations

**Hints for deeper tracing:**
1. **In Transactor.cpp**: Look for the `operator()` method and `apply()` method
2. **In apply.cpp**: Find the `apply()` function that coordinates transaction processing
3. **In OpenView.cpp**: Look for ledger modification operations

**Add logging to trace your transaction through these layers:**
```cpp
// Example logging you might add:
JLOG(j_.fatal()) << "Transactor::operator() called";
JLOG(j_.fatal()) << "Transactor::apply() processing transaction";
JLOG(j_.fatal()) << "OpenView operation: " << [describe the operation];
```