# XRPL Escrow Test Implementation Lab

## Objective
Write the complete `testIOUEnablement` function step by step, understanding each component as you build it.

---

## Step 1: Function Header and Basic Setup

**Write the function signature and initial setup:**

```cpp
void testIOUEnablement(FeatureBitset features)
{
    testcase("IOU Enablement");
    
    using namespace jtx;
    using namespace std::chrono;
    
    // TODO: Add the main test loop here
}
```

**What you're doing:**
- Declaring the test function that takes a `FeatureBitset` parameter
- Setting up the test case name
- Importing necessary namespaces for testing (`jtx`) and time operations

---

## Step 2: Create the Amendment Toggle Loop

**Add the loop that tests with and without the TokenEscrow amendment:**

```cpp
void testIOUEnablement(FeatureBitset features)
{
    testcase("IOU Enablement");
    
    using namespace jtx;
    using namespace std::chrono;
    
    for (bool const withTokenEscrow : {false, true})
    {
        // TODO: Configure amendment based on withTokenEscrow
        // TODO: Create test environment
        // TODO: Set up accounts and currency
    }
}
```

**What you're doing:**
- Creating a loop that runs the test twice: once without TokenEscrow, once with it
- This tests both the disabled and enabled states of the amendment

---

## Step 3: Configure the Amendment and Environment

**Inside the loop, add amendment configuration and environment setup:**

```cpp
for (bool const withTokenEscrow : {false, true})
{
    auto const amend = withTokenEscrow ? features : features - featureTokenEscrow;
    Env env{*this, amend};
    auto const baseFee = env.current()->fees().base;
    
    // TODO: Create accounts
    // TODO: Set up currency and trust lines
    // TODO: Define expected results
}
```

**What you're doing:**
- Conditionally removing `featureTokenEscrow` from the feature set when testing disabled state
- Creating a test environment with the configured amendments
- Getting the base fee for transaction costs

---

## Step 4: Create Accounts and Currency

**Add account creation and currency setup:**

```cpp
for (bool const withTokenEscrow : {false, true})
{
    auto const amend = withTokenEscrow ? features : features - featureTokenEscrow;
    Env env{*this, amend};
    auto const baseFee = env.current()->fees().base;
    
    auto const alice = Account("alice");
    auto const bob = Account("bob");
    auto const gw = Account{"gateway"};
    auto const USD = gw["USD"];
    
    // TODO: Fund accounts
    // TODO: Set up trust lines
    // TODO: Distribute currency
}
```

**What you're doing:**
- Creating three test accounts: alice, bob, and a gateway
- Defining USD as a currency issued by the gateway

---

## Step 5: Fund Accounts and Set Up Trust Lines

**Add funding and trust line setup:**

```cpp
auto const alice = Account("alice");
auto const bob = Account("bob");
auto const gw = Account{"gateway"};
auto const USD = gw["USD"];

env.fund(XRP(5000), alice, bob, gw);
env(fset(gw, asfAllowTrustLineLocking));
env.close();
env.trust(USD(10'000), alice, bob);
env.close();
env(pay(gw, alice, USD(5000)));
env(pay(gw, bob, USD(5000)));
env.close();

// TODO: Define expected transaction results
// TODO: Test escrow creation
```

**What you're doing:**
- Funding all accounts with XRP for transaction fees
- Setting the gateway flag to allow trust line locking
- Creating trust lines from alice and bob to the gateway for USD
- Distributing USD tokens to alice and bob

---

## Step 6: Define Expected Results

**Add the expected transaction results based on amendment state:**

```cpp
env(pay(gw, alice, USD(5000)));
env(pay(gw, bob, USD(5000)));
env.close();

auto const createResult = withTokenEscrow ? ter(tesSUCCESS) : ter(temBAD_AMOUNT);
auto const finishResult = withTokenEscrow ? ter(tesSUCCESS) : ter(tecNO_TARGET);

// TODO: Test escrow creation and finishing
// TODO: Test escrow creation and cancellation
```

**What you're doing:**
- Defining that escrow creation should succeed with amendment, fail with `temBAD_AMOUNT` without it
- Defining that escrow finish/cancel should succeed with amendment, fail with `tecNO_TARGET` without it

---

## Step 7: Test Escrow Creation and Finishing

**Add the first escrow test (create → finish):**

```cpp
auto const createResult = withTokenEscrow ? ter(tesSUCCESS) : ter(temBAD_AMOUNT);
auto const finishResult = withTokenEscrow ? ter(tesSUCCESS) : ter(tecNO_TARGET);

auto const seq1 = env.seq(alice);
env(escrow::create(alice, bob, USD(1'000)),
    escrow::condition(escrow::cb1),
    escrow::finish_time(env.now() + 1s),
    fee(baseFee * 150),
    createResult);
env.close();

env(escrow::finish(bob, alice, seq1),
    escrow::condition(escrow::cb1),
    escrow::fulfillment(escrow::fb1),
    fee(baseFee * 150),
    finishResult);
env.close();

// TODO: Test escrow creation and cancellation
```

**What you're doing:**
- Getting alice's sequence number before creating the escrow
- Creating an escrow with a condition and finish time
- Attempting to finish the escrow with the proper fulfillment
- Using higher fees (150x base) for escrow operations

---

## Step 8: Test Escrow Creation and Cancellation

**Add the second escrow test (create → cancel):**

```cpp
env(escrow::finish(bob, alice, seq1),
    escrow::condition(escrow::cb1),
    escrow::fulfillment(escrow::fb1),
    fee(baseFee * 150),
    finishResult);
env.close();

auto const seq2 = env.seq(alice);
env(escrow::create(alice, bob, USD(1'000)),
    escrow::condition(escrow::cb2),
    escrow::finish_time(env.now() + 1s),
    escrow::cancel_time(env.now() + 2s),
    fee(baseFee * 150),
    createResult);
env.close();

env(escrow::cancel(bob, alice, seq2), finishResult);
env.close();

// TODO: Add second test loop for edge cases
```

**What you're doing:**
- Creating a second escrow with both finish and cancel times
- Using a different condition (cb2) for the second escrow
- Testing the cancel operation

---

## Step 9: Add Edge Case Testing

**Add the second loop that tests operations without valid escrows:**

```cpp
    } // End of first loop

    // Test edge cases - operations without valid escrows
    for (bool const withTokenEscrow : {false, true})
    {
        auto const amend = withTokenEscrow ? features : features - featureTokenEscrow;
        Env env{*this, amend};
        auto const baseFee = env.current()->fees().base;
        
        auto const alice = Account("alice");
        auto const bob = Account("bob");
        auto const gw = Account{"gateway"};
        auto const USD = gw["USD"];
        
        env.fund(XRP(5000), alice, bob, gw);
        env(fset(gw, asfAllowTrustLineLocking));
        env.close();
        env.trust(USD(10'000), alice, bob);
        env.close();
        env(pay(gw, alice, USD(5000)));
        env(pay(gw, bob, USD(5000)));
        env.close();

        // TODO: Test operations on non-existent escrows
    }
```

**What you're doing:**
- Starting a second test loop with the same setup
- This will test what happens when you try to finish/cancel escrows that don't exist

---

## Step 10: Test Operations on Non-Existent Escrows

**Complete the function with edge case tests:**

```cpp
env(pay(gw, alice, USD(5000)));
env(pay(gw, bob, USD(5000)));
env.close();

auto const seq1 = env.seq(alice);
env(escrow::finish(bob, alice, seq1),
    escrow::condition(escrow::cb1),
    escrow::fulfillment(escrow::fb1),
    fee(baseFee * 150),
    ter(tecNO_TARGET));
env.close();

env(escrow::cancel(bob, alice, seq1), ter(tecNO_TARGET));
env.close();
```

**What you're doing:**
- Attempting to finish an escrow that was never created
- Attempting to cancel an escrow that was never created  
- Both operations should fail with `tecNO_TARGET` regardless of amendment state

---

## Final Complete Function

**Your completed function should look like:**

```cpp
void testIOUEnablement(FeatureBitset features)
{
    testcase("IOU Enablement");
    
    using namespace jtx;
    using namespace std::chrono;
    
    for (bool const withTokenEscrow : {false, true})
    {
        auto const amend = withTokenEscrow ? features : features - featureTokenEscrow;
        Env env{*this, amend};
        auto const baseFee = env.current()->fees().base;
        auto const alice = Account("alice");
        auto const bob = Account("bob");
        auto const gw = Account{"gateway"};
        auto const USD = gw["USD"];
        env.fund(XRP(5000), alice, bob, gw);
        env(fset(gw, asfAllowTrustLineLocking));
        env.close();
        env.trust(USD(10'000), alice, bob);
        env.close();
        env(pay(gw, alice, USD(5000)));
        env(pay(gw, bob, USD(5000)));
        env.close();

        auto const createResult = withTokenEscrow ? ter(tesSUCCESS) : ter(temBAD_AMOUNT);
        auto const finishResult = withTokenEscrow ? ter(tesSUCCESS) : ter(tecNO_TARGET);

        auto const seq1 = env.seq(alice);
        env(escrow::create(alice, bob, USD(1'000)),
            escrow::condition(escrow::cb1),
            escrow::finish_time(env.now() + 1s),
            fee(baseFee * 150),
            createResult);
        env.close();
        env(escrow::finish(bob, alice, seq1),
            escrow::condition(escrow::cb1),
            escrow::fulfillment(escrow::fb1),
            fee(baseFee * 150),
            finishResult);
        env.close();

        auto const seq2 = env.seq(alice);
        env(escrow::create(alice, bob, USD(1'000)),
            escrow::condition(escrow::cb2),
            escrow::finish_time(env.now() + 1s),
            escrow::cancel_time(env.now() + 2s),
            fee(baseFee * 150),
            createResult);
        env.close();
        env(escrow::cancel(bob, alice, seq2), finishResult);
        env.close();
    }
}
```