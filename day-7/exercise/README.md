# XRPL WebSocket Functionality Workshop Assignment

## Assignment Overview

This comprehensive workshop assignment will guide you through understanding and implementing WebSocket functionality in the XRPL (XRP Ledger) codebase. You will analyze the existing architecture, create a new WebSocket command, and demonstrate mastery of all WebSocket-related components.

## Part 1: Implementation - Account Change Monitor

### 3.1 Command Implementation

Create a new WebSocket command called `account_monitor` that provides real-time notifications when specified accounts change.

**File Structure**:
```
src/ripple/rpc/handlers/AccountMonitor.cpp
src/ripple/rpc/impl/AccountMonitor.h
```

**Implementation Requirements**:

```cpp
// AccountMonitor.cpp
#include <xrpld/rpc/handlers/AccountMonitor.h>
#include <xrpld/rpc/WSInfoSub.h>
#include <xrpl/app/ledger/LedgerMaster.h>
#include <xrpl/protocol/jss.h>

namespace ripple {

// Command handler
Json::Value doAccountMonitor(RPC::JsonContext& context) {
    // Parse request parameters
    if (!context.params.isMember(jss::account)) {
        return RPC::missing_field_error(jss::account);
    }
    
    // Validate account format
    AccountID accountID;
    if (!parseBase58<AccountID>(
        context.params[jss::account].asString(), accountID)) {
        return RPC::invalid_field_error(jss::account);
    }
    
    // Set up subscription
    if (auto infoSub = context.infoSub.lock()) {
        // Register for account notifications
        context.app.getOPs().subAccount(
            infoSub, accountID, true);
            
        Json::Value result;
        result[jss::status] = "success";
        result[jss::account] = context.params[jss::account];
        result[jss::type] = "response";
        return result;
    }
    
    return RPC::internal_error();
}

} // ripple
```

### 3.2 Integration with Subscription System

Extend the existing subscription infrastructure:

```cpp
// Modify NetworkOPs or equivalent to support account monitoring
class NetworkOPs {
public:
    void subAccount(
        std::shared_ptr<InfoSub> const& subscriber,
        AccountID const& account,
        bool realTime);
        
    void unsubAccount(
        std::shared_ptr<InfoSub> const& subscriber,
        AccountID const& account);
        
private:
    // Account subscription tracking
    hash_map<AccountID, std::set<std::weak_ptr<InfoSub>>> accountSubs_;
    std::mutex accountSubsMutex_;
    
    // Notification dispatch
    void notifyAccountChange(
        AccountID const& account,
        std::shared_ptr<ReadView const> const& ledger);
};
```

**Implementation Details**:
- Thread-safe subscription management
- Efficient account change detection
- Proper cleanup of expired subscriptions
- Integration with ledger close events

## Part 2: Advanced Features

### 4.1 Error Handling and Recovery

Implement comprehensive error handling:

```cpp
// Error scenarios to handle:
- Network disconnections
- Invalid account formats
- Subscription limits exceeded
- Ledger unavailability
```

## Testing Requirements

### Unit Tests
Create comprehensive unit tests covering:

```cpp
// Test file: src/test/rpc/AccountMonitor_test.cpp
class AccountMonitor_test : public beast::unit_test::suite {
public:
    void testBasicSubscription();
    void testInvalidAccount();
    void testUnsubscription();
    void testErrorHandling();
};
```

### Integration Tests
Test the complete WebSocket flow:

```cpp
// Integration test scenarios:
1. WebSocket connection establishment
2. Account monitor command execution
3. Real-time notification delivery
4. Connection cleanup
5. Stress testing with multiple clients
```