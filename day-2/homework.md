# XRPL Testing Homework - Day 2

## Objective
Run an existing test from the rippled codebase, analyze what it does, and present your findings to the class. This homework will help you understand how XRPL tests work and how they validate transaction behavior.

---

## Assignment Overview

You will:
1. **Choose** a test function from the rippled codebase
2. **Run** the specific test function
3. **Analyze** what the test does step-by-step
4. **Prepare** a 3-5 minute presentation explaining the test to your classmates
5. **Present** your findings, focusing on what the test validates and how it works

---

## How to Run a Specific Test

### Step 1: Disable Other Tests
First, you need to disable other test functions so only your chosen test runs. In the test file, comment out the other test function calls in the `run()` method.

### Step 2: Run the Test
```bash
# From your rippled/build directory
./rippled -u ripple.app.Flow
```

This will run only the Flow test suite with your specific test function enabled.

---

## Example Analysis: `testDirectStep`

Let's walk through one specific scenario from `testDirectStep` to show you what to look for:

**Scenario: "Pay USD, trivial path"**
```cpp
{
    // Pay USD, trivial path
    Env env(*this, features);
    env.fund(XRP(10000), alice, bob, gw);
    env.close();
    env.trust(USD(1000), alice, bob);
    env(pay(gw, alice, USD(100)));
    env(pay(alice, bob, USD(10)), paths(USD));
    env.require(balance(bob, USD(10)));
}
```

**What's happening here:**
1. **Setup**: Creates accounts Alice, Bob, and Gateway; funds them with 10,000 XRP each
2. **Trust Lines**: Alice and Bob both trust the Gateway's USD up to 1,000 USD
3. **Initial Payment**: Gateway pays Alice 100 USD (so Alice now has USD to spend)
4. **Test Payment**: Alice pays Bob 10 USD using a direct USD path
5. **Validation**: Confirms Bob received exactly 10 USD

**Key Insight**: This tests the simplest IOU payment scenario - direct transfer of a currency between accounts that both trust the same issuer.

**What makes this test important**: It validates that basic IOU payments work correctly, which is fundamental to XRPL's multi-currency capabilities.

---

## Choose Your Own Test

Pick one of these test functions to analyze (or find another one you're interested in):

### From Flow_test.cpp:
- `testDirectStep` - Basic payment scenarios
- `testLineQuality` - Trust line quality and rates
- `testBookStep` - Order book interactions
- `testTransferRate` - Gateway transfer fees
- `testSelfPayment1` or `testSelfPayment2` - Self-payments through offers

### From Other Test Files:
- Look in `src/test/app/` for other test files
- Examples: `DID_test.cpp`, `Check_test.cpp`, `Escrow_test.cpp`

---

## General Analysis Framework

For any test you choose, structure your analysis using this framework:

### 1. Test Purpose (What?)
- What XRPL functionality is being tested?
- What transaction types are involved?
- Why is this test important for XRPL reliability?

### 2. Test Setup (How?)
```cpp
// Look for patterns like:
Env env{*this, features};
Account alice{"alice"};
env.fund(XRP(1000), alice);
env.trust(USD(100), alice);
```
- What accounts are created?
- What initial funding occurs?
- Are trust lines or offers created?

### 3. Test Actions (What happens?)
```cpp
// Look for transaction submissions like:
env(pay(alice, bob, XRP(100)));
env(offer(alice, XRP(100), USD(50)));
```
- What transactions are being submitted?
- Are there multiple steps in the test?
- Does the test call `env.close()` to advance ledgers?

### 4. Validations (How do we know it worked?)
```cpp
// Look for validation patterns like:
env.require(balance(alice, XRP(900)));
BEAST_EXPECT(some_condition);
```
- What state is being checked?
- How does the test verify success/failure?
- What edge cases are being tested?

### 5. Edge Cases and Error Handling
- Look for `ter(tecPATH_PARTIAL)` or other error codes
- Check for `txflags(tfPartialPayment)` or special flags
- Notice any expected failures or error conditions

---

## Presentation Guidelines

### What to Include (3-5 minutes)
1. **Test Purpose** (30 seconds)
   - What functionality is being tested?
   - Why is this test important?

2. **Test Walkthrough** (2-3 minutes)
   - Walk through one interesting scenario from your test
   - Explain the setup, action, and validation
   - Show key parts of the actual code

3. **Key Insights** (1 minute)
   - What did you learn about XRPL from this test?
   - What surprised you about how the test works?
   - How does this test ensure XRPL reliability?

4. **Questions** (30 seconds)
   - What aspects were confusing?
   - What would you like to understand better?

### Presentation Tips
- Use the actual code from the test file in your slides
- Focus on the "why" not just the "what"
- Relate the test back to real XRPL functionality
- Don't worry if you don't understand everything - share what you learned!

---

## Getting Help

If you encounter issues:

1. **Build Problems**: Review Day 1 setup instructions
2. **Test Won't Run**: 
   - Check that you're in the correct directory (`rippled/build`)
   - Make sure you commented out other tests in the `run()` method
3. **Code Understanding**: Focus on the high-level flow, don't get stuck on details
4. **Analysis Questions**: Use the framework provided - answer what you can

Remember: The goal is to understand how tests work, not to become an expert overnight. Share what you learned, even if it's incomplete!

---

## Bonus Challenge (Optional)

If you finish early and want an extra challenge:

### Run with Trace Logging
Add trace logging to see detailed execution:
```cpp
// In your test function, add:
Env env(*this, features, nullptr, beast::severities::kTrace);
```

This will show you detailed logging of what happens during test execution, including:
- Transaction processing steps
- Ledger state changes
- Internal validations
- Path finding details

### Inspect Ledger State After Transactions
Add this code after any `env.close()` call to see the complete ledger with all transactions:
```cpp
{
    Json::Value params;
    params[jss::ledger_index] = env.current()->seq() - 1;
    params[jss::transactions] = true;
    params[jss::expand] = true;
    auto const jrr = env.rpc("json", "ledger", to_string(params));
    std::cout << jrr << std::endl;
}
```

This will output the full ledger JSON showing:
- All transactions that were included in the ledger
- Transaction metadata and results
- Account state changes
- Ledger header information