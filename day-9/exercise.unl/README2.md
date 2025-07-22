# 🧪 Negative UNL Engineering Challenge: Creating Validator Disable/Re-enable Scenarios

## Overview
In this hands-on exercise, you'll create scenarios to test Ripple's Negative UNL (Universal Node List) mechanism, which allows the network to temporarily disable poorly performing validators and later re-enable them when they recover.

## Background: Negative UNL Mechanics

From the test code, the Negative UNL system works as follows:

- **Flag Ledgers**: Updates occur every 256 ledgers (`l->isFlagLedger()`)
- **ToDisable**: Validators can be marked for disabling via `ttUNL_MODIFY` transactions
- **ToReEnable**: Disabled validators can be marked for re-enabling
- **Scoring**: Validators are scored based on validation participation
- **Watermarks**: 
  - Low watermark: Below this score triggers disable consideration
  - High watermark: Above this score triggers re-enable consideration

## Exercise Setup

Look for the `testNegativeUNL()` function around line 100+ to see the comprehensive test scenarios.

## Step-by-Step Exercise

### Phase 1: Create Your Test Function (15 minutes)

**Your Task**: Add a new test function to simulate validator lifecycle

1. **Add the test function** after the existing `testNegativeUNL()` function:

```cpp
void
testValidatorLifecycle()
{
    testcase("Validator Lifecycle - Disable and Re-enable");
    
    std::cout << "=== Starting Validator Lifecycle Test ===" << std::endl;
    
    jtx::Env env(*this, jtx::supported_amendments() | featureNegativeUNL);
    std::vector<PublicKey> publicKeys = createPublicKeys(5);
    
    std::cout << "Created " << publicKeys.size() << " validator public keys" << std::endl;
    for (size_t i = 0; i < publicKeys.size(); ++i) {
        std::cout << "Validator " << i << " key created" << std::endl;
    }
    
    // Create genesis ledger
    auto l = std::make_shared<Ledger>(
        create_genesis,
        env.app().config(),
        std::vector<uint256>{},
        env.app().getNodeFamily());
    
    std::cout << "Genesis ledger created with sequence: " << l->seq() << std::endl;
    std::cout << "Negative UNL feature enabled: " << l->rules().enabled(featureNegativeUNL) << std::endl;
    
    // Record expected negative UNL state
    hash_map<PublicKey, std::uint32_t> nUnlLedgerSeq;
}
```

2. **Register your test** in the `run()` function:

```cpp
void
run() override
{
    // testNegativeUNL(); // Comment out this line
    testValidatorLifecycle();  // Add this line
}
```

### Phase 2: Build to First Flag Ledger (20 minutes)

**Your Task**: Create ledgers until you reach the first flag ledger

3. **Add ledger progression** inside your `testValidatorLifecycle()` function:

```cpp
std::cout << "\n=== Building to First Flag Ledger ===" << std::endl;

// Build ledgers up to first flag ledger (sequence 256)
int ledgerCount = 0;
while (!l->isFlagLedger() || l->seq() == 1) {
    l = std::make_shared<Ledger>(*l, env.app().timeKeeper().closeTime());
    ledgerCount++;
    
    if (ledgerCount % 50 == 0) {
        std::cout << "Built " << ledgerCount << " ledgers, current sequence: " << l->seq() << std::endl;
    }
}

std::cout << "Reached flag ledger at sequence: " << l->seq() << std::endl;
std::cout << "Total ledgers built: " << ledgerCount << std::endl;
std::cout << "Is flag ledger: " << l->isFlagLedger() << std::endl;

// Update the negative UNL (this is what happens automatically at flag ledgers)
l->updateNegativeUNL();
std::cout << "Updated Negative UNL on flag ledger" << std::endl;

// Test initial state
std::cout << "\n--- Initial Flag Ledger State ---" << std::endl;
std::cout << "Negative UNL size: " << l->negativeUNL().size() << std::endl;
std::cout << "Has validator to disable: " << (l->validatorToDisable() != std::nullopt) << std::endl;
std::cout << "Has validator to re-enable: " << (l->validatorToReEnable() != std::nullopt) << std::endl;

// Verify initial state
BEAST_EXPECT(negUnlSizeTest(l, 0, false, false));
```

**❓ Question**: Why can't we disable validators before reaching a flag ledger?

### Phase 3: Test Validator Disabling (25 minutes)

**Your Task**: Create and test ToDisable transactions

4. **Add disable transaction testing**:

```cpp
std::cout << "\n=== Testing Validator Disable Transactions ===" << std::endl;

// Create disable transactions for different validators
auto txDisable_0 = createTx(true, l->seq(), publicKeys[0]);  // Should succeed
auto txDisable_1 = createTx(true, l->seq(), publicKeys[1]);  // Should fail (only 1 per flag ledger)
auto txReEnable_0 = createTx(false, l->seq(), publicKeys[0]); // Should fail (can't re-enable what's not disabled)

std::cout << "Created disable transaction for validator 0" << std::endl;
std::cout << "Created disable transaction for validator 1 (should fail)" << std::endl;
std::cout << "Created re-enable transaction for validator 0 (should fail)" << std::endl;

// Apply transactions to the ledger
OpenView accum(&*l);

std::cout << "\n--- Applying Transactions ---" << std::endl;

// Test first disable - should succeed
bool result1 = applyAndTestResult(env, accum, txDisable_0, true);
std::cout << "First disable transaction (validator 0): " << (result1 ? "SUCCESS" : "FAILED") << std::endl;
BEAST_EXPECT(result1);

// Test second disable - should fail (only 1 ToDisable per flag ledger)
bool result2 = applyAndTestResult(env, accum, txDisable_1, false);
std::cout << "Second disable transaction (validator 1): " << (result2 ? "SUCCESS (unexpected)" : "FAILED (expected)") << std::endl;
BEAST_EXPECT(result2);

// Test re-enable on empty nUNL - should fail
bool result3 = applyAndTestResult(env, accum, txReEnable_0, false);
std::cout << "Re-enable transaction on empty nUNL: " << (result3 ? "SUCCESS (unexpected)" : "FAILED (expected)") << std::endl;
BEAST_EXPECT(result3);

// Apply changes to ledger
accum.apply(*l);
std::cout << "Applied accumulated changes to ledger" << std::endl;

// Check ledger state after applying transactions
std::cout << "\n--- Ledger State After Disable Transactions ---" << std::endl;
bool stateOk = negUnlSizeTest(l, 0, true, false);
std::cout << "Negative UNL size: " << l->negativeUNL().size() << std::endl;
std::cout << "Has ToDisable: " << (l->validatorToDisable() != std::nullopt) << std::endl;
std::cout << "Has ToReEnable: " << (l->validatorToReEnable() != std::nullopt) << std::endl;

if (stateOk && l->validatorToDisable()) {
    std::cout << "ToDisable validator matches expected: " << (*l->validatorToDisable() == publicKeys[0]) << std::endl;
    BEAST_EXPECT(*l->validatorToDisable() == publicKeys[0]);
    
    // Check if transaction is in ledger's transaction set
    uint256 txID = txDisable_0.getTransactionID();
    bool txInLedger = l->txExists(txID);
    std::cout << "Disable transaction found in ledger: " << txInLedger << std::endl;
    BEAST_EXPECT(txInLedger);
}
BEAST_EXPECT(stateOk);
```

**❓ Question**: Why can only one ToDisable transaction be applied per flag ledger?

### Phase 4: Progress to Next Flag Ledger (20 minutes)

**Your Task**: Build ledgers and observe the negative UNL update

5. **Add ledger progression and UNL update**:

```cpp
std::cout << "\n=== Progressing to Next Flag Ledger ===" << std::endl;

// Build 256 more ledgers to reach next flag ledger
ledgerCount = 0;
for (int i = 0; i < 256; ++i) {
    // Check state during progression
    if (i % 64 == 0) {
        bool progressState = negUnlSizeTest(l, 0, true, false);
        std::cout << "At ledger " << l->seq() << " - State OK: " << progressState << std::endl;
        if (progressState && l->validatorToDisable()) {
            std::cout << "  Still has ToDisable for validator 0: " << (*l->validatorToDisable() == publicKeys[0]) << std::endl;
        }
        BEAST_EXPECT(progressState);
        if (progressState && l->validatorToDisable()) {
            BEAST_EXPECT(*l->validatorToDisable() == publicKeys[0]);
        }
    }
    
    l = std::make_shared<Ledger>(*l, env.app().timeKeeper().closeTime());
    ledgerCount++;
}

std::cout << "Built " << ledgerCount << " ledgers to sequence: " << l->seq() << std::endl;
std::cout << "Is flag ledger: " << l->isFlagLedger() << std::endl;
BEAST_EXPECT(l->isFlagLedger());

// Update negative UNL - this processes the ToDisable
l->updateNegativeUNL();
std::cout << "Updated Negative UNL - ToDisable should now be processed" << std::endl;

// Check updated state
std::cout << "\n--- Updated Flag Ledger State ---" << std::endl;
bool updatedState = negUnlSizeTest(l, 1, false, false);
std::cout << "Negative UNL size: " << l->negativeUNL().size() << std::endl;
std::cout << "Has ToDisable: " << (l->validatorToDisable() != std::nullopt) << std::endl;
std::cout << "Has ToReEnable: " << (l->validatorToReEnable() != std::nullopt) << std::endl;

BEAST_EXPECT(updatedState);
if (updatedState) {
    bool hasValidator0 = l->negativeUNL().count(publicKeys[0]) > 0;
    std::cout << "Validator 0 in Negative UNL: " << hasValidator0 << std::endl;
    BEAST_EXPECT(hasValidator0);
    
    // Record for verification
    nUnlLedgerSeq.emplace(publicKeys[0], l->seq());
    std::cout << "Recorded validator 0 disabled at ledger sequence: " << l->seq() << std::endl;
}
```

**❓ Question**: What happens to the ToDisable field after the flag ledger processes it?

### Phase 5: Test Re-enabling (20 minutes)

**Your Task**: Test re-enabling the disabled validator

6. **Add re-enable transaction testing**:

```cpp
std::cout << "\n=== Testing Validator Re-enable Transactions ===" << std::endl;

// Now we can test more complex scenarios on this flag ledger
auto txDisable_0_again = createTx(true, l->seq(), publicKeys[0]);  // Should fail (already disabled)
auto txDisable_2 = createTx(true, l->seq(), publicKeys[2]);        // Should succeed
auto txReEnable_0 = createTx(false, l->seq(), publicKeys[0]);      // Should succeed  
auto txReEnable_1 = createTx(false, l->seq(), publicKeys[1]);      // Should fail (not in nUNL)
auto txReEnable_2 = createTx(false, l->seq(), publicKeys[2]);      // Should fail (same as ToDisable)

std::cout << "Created various transactions for complex scenario testing" << std::endl;

OpenView accum2(&*l);

std::cout << "\n--- Testing Complex Transaction Scenarios ---" << std::endl;

// Should fail - can't disable what's already disabled
bool result4 = applyAndTestResult(env, accum2, txDisable_0_again, false);
std::cout << "Disable already disabled validator 0: " << (result4 ? "SUCCESS (unexpected)" : "FAILED (expected)") << std::endl;
BEAST_EXPECT(result4);

// Should succeed - disable new validator
bool result5 = applyAndTestResult(env, accum2, txDisable_2, true);
std::cout << "Disable validator 2: " << (result5 ? "SUCCESS" : "FAILED") << std::endl;
BEAST_EXPECT(result5);

// Should fail - can't re-enable validator not in nUNL
bool result6 = applyAndTestResult(env, accum2, txReEnable_1, false);
std::cout << "Re-enable validator 1 (not in nUNL): " << (result6 ? "SUCCESS (unexpected)" : "FAILED (expected)") << std::endl;
BEAST_EXPECT(result6);

// Should fail - can't re-enable same validator as ToDisable in same round
bool result7 = applyAndTestResult(env, accum2, txReEnable_2, false);
std::cout << "Re-enable validator 2 (same as ToDisable): " << (result7 ? "SUCCESS (unexpected)" : "FAILED (expected)") << std::endl;
BEAST_EXPECT(result7);

// Should succeed - re-enable validator in nUNL
bool result8 = applyAndTestResult(env, accum2, txReEnable_0, true);
std::cout << "Re-enable validator 0 (in nUNL): " << (result8 ? "SUCCESS" : "FAILED") << std::endl;
BEAST_EXPECT(result8);

// Apply all changes
accum2.apply(*l);
std::cout << "Applied all transaction changes" << std::endl;

// Check final state
std::cout << "\n--- Final Flag Ledger State ---" << std::endl;
bool finalState = negUnlSizeTest(l, 1, true, true);
std::cout << "Negative UNL size: " << l->negativeUNL().size() << std::endl;
std::cout << "Has ToDisable: " << (l->validatorToDisable() != std::nullopt) << std::endl;
std::cout << "Has ToReEnable: " << (l->validatorToReEnable() != std::nullopt) << std::endl;

BEAST_EXPECT(finalState);
if (finalState) {
    bool stillHasValidator0 = l->negativeUNL().count(publicKeys[0]) > 0;
    std::cout << "Validator 0 still in nUNL: " << stillHasValidator0 << std::endl;
    BEAST_EXPECT(stillHasValidator0);
    
    if (l->validatorToDisable()) {
        bool toDisableIs2 = *l->validatorToDisable() == publicKeys[2];
        std::cout << "ToDisable is validator 2: " << toDisableIs2 << std::endl;
        BEAST_EXPECT(toDisableIs2);
    }
    
    if (l->validatorToReEnable()) {
        bool toReEnableIs0 = *l->validatorToReEnable() == publicKeys[0];
        std::cout << "ToReEnable is validator 0: " << toReEnableIs0 << std::endl;
        BEAST_EXPECT(toReEnableIs0);
    }
    
    // Verify ledger sequence tracking
    bool seqVerified = VerifyPubKeyAndSeq(l, nUnlLedgerSeq);
    std::cout << "Ledger sequence verification passed: " << seqVerified << std::endl;
    BEAST_EXPECT(seqVerified);
}
```

### Phase 6: Complete the Lifecycle (15 minutes)

**Your Task**: Process the final changes and verify cleanup

7. **Add final processing**:

```cpp
std::cout << "\n=== Completing Validator Lifecycle ===" << std::endl;

// Progress to next flag ledger to see both ToDisable and ToReEnable processed
ledgerCount = 0;
for (int i = 0; i < 256; ++i) {
    l = std::make_shared<Ledger>(*l, env.app().timeKeeper().closeTime());
    ledgerCount++;
}

std::cout << "Built " << ledgerCount << " more ledgers to sequence: " << l->seq() << std::endl;
std::cout << "Is flag ledger: " << l->isFlagLedger() << std::endl;

// Process the ToDisable and ToReEnable
l->updateNegativeUNL();
std::cout << "Processed ToDisable and ToReEnable transactions" << std::endl;

// Check final state
std::cout << "\n--- Final Lifecycle State ---" << std::endl;
bool lifecycleComplete = negUnlSizeTest(l, 1, false, false);
std::cout << "Negative UNL size: " << l->negativeUNL().size() << std::endl;
std::cout << "Has ToDisable: " << (l->validatorToDisable() != std::nullopt) << std::endl;
std::cout << "Has ToReEnable: " << (l->validatorToReEnable() != std::nullopt) << std::endl;

BEAST_EXPECT(lifecycleComplete);
if (lifecycleComplete) {
    // Should now have validator 2 instead of validator 0
    bool hasValidator2 = l->negativeUNL().count(publicKeys[2]) > 0;
    bool noValidator0 = l->negativeUNL().count(publicKeys[0]) == 0;
    std::cout << "Validator 2 in nUNL: " << hasValidator2 << std::endl;
    std::cout << "Validator 0 removed from nUNL: " << noValidator0 << std::endl;
    
    BEAST_EXPECT(hasValidator2);
    BEAST_EXPECT(noValidator0);
    
    // Update tracking
    nUnlLedgerSeq.emplace(publicKeys[2], l->seq());
    nUnlLedgerSeq.erase(publicKeys[0]);
    
    bool finalSeqVerified = VerifyPubKeyAndSeq(l, nUnlLedgerSeq);
    std::cout << "Final sequence verification passed: " << finalSeqVerified << std::endl;
    BEAST_EXPECT(finalSeqVerified);
}

std::cout << "\n=== Validator Lifecycle Test Complete ===" << std::endl;
```