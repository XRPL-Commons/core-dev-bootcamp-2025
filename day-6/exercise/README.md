# XRPL RPC System Workshop Assignment

## Overview

This comprehensive workshop assignment will test your understanding of the XRPL RPC system by having you implement a new RPC command from scratch. You'll need to demonstrate knowledge of handler registration, lifecycle management, error handling, testing, and best practices.

## Assignment: Implement `GetAccountBalance` RPC Command

You will create a new RPC command called `GetAccountBalance` that returns detailed balance information for an XRPL account, including XRP balance, trust lines, and reserve requirements.

---

## Part 1: RPC System Architecture Understanding

### 1.1 System Overview Questions

Answer the following questions in detail:

1. **Handler Discovery**: Explain how RPC handlers are registered and discovered in the XRPL system. What role does the `Handler` struct play?

2. **Request Lifecycle**: Describe the complete lifecycle of an RPC request from receipt to response, including all major stages.

3. **Role-Based Access**: Explain the different user roles (`GUEST`, `USER`, `ADMIN`, `FORBID`) and how they affect RPC command access.

---

## Part 2: Handler Implementation

### 2.1 Handler Registration

**Task**: Add your `GetAccountBalance` handler to the system.

1. **File Location**: Identify where to add the handler registration
2. **Handler Structure**: Define the complete `Handler` struct for your command
3. **Registration Code**: Write the code to register your handler

**Requirements**:
- Command name: `"account_balance"`
- Required role: `USER` or higher
- Resource cost: `MEDIUM` (since it may query multiple objects)
- Condition: Available when server is synced

### 2.2 Request/Response Types

**Task**: Define the JSON request and response structures.

**Request Parameters**:
```json
{
    "command": "account_balance",
    "account": "rAccount...",
    "ledger_index": "validated", // optional
    "include_reserves": true,    // optional, default false
    "include_trustlines": true   // optional, default false
}
```

**Response Structure**:
```json
{
    "account": "rAccount...",
    "ledger_index": 12345,
    "xrp_balance": "1000000000",
    "available_balance": "980000000",
    "reserves": {
        "base_reserve": "10000000",
        "owner_reserve": "2000000",
        "total_reserve": "20000000"
    },
    "trustlines": [...], // if requested
    "validated": true
}
```

### 2.3 Handler Implementation

**Task**: Implement the complete handler function.

```cpp
Json::Value doGetAccountBalance(RPC::JsonContext& context)
{
    // Your implementation here
}
```

**Requirements**:
1. **Parameter Validation**: Validate all input parameters
2. **Account Validation**: Verify account format and existence
3. **Ledger Access**: Handle ledger selection (current, validated, specific)
4. **Balance Calculation**: Calculate XRP balance and available balance
5. **Reserve Calculation**: Calculate base and owner reserves
6. **Trust Line Handling**: Optionally include trust line balances
7. **Error Handling**: Proper error responses for all failure cases

**Key Implementation Points**:
- Use `RPC::accountFromString()` for account validation
- Use `context.ledgerMaster` for ledger access
- Handle both current and historical ledger queries
- Implement proper resource management
- Follow existing patterns from similar handlers

---

## Part 3: Error Handling and Validation

### 3.1 Comprehensive Error Handling

**Task**: Implement complete error handling for all possible failure scenarios.

**Required Error Cases**:
1. **Invalid Parameters**:
   - Missing account parameter
   - Invalid account format
   - Invalid ledger_index format

2. **System Errors**:
   - Ledger not available
   - Account not found
   - Network/database errors

3. **Permission Errors**:
   - Insufficient role permissions
   - Resource limit exceeded

**Implementation Requirements**:
```cpp
// Example error handling structure
if (/* validation fails */)
{
    return RPC::make_error(rpcINVALID_PARAMS, "Invalid account format");
}

if (/* account not found */)
{
    return RPC::make_error(rpcACT_NOT_FOUND, "Account not found");
}

// Add comprehensive error handling for all scenarios
```

### 3.2 Input Validation

**Task**: Implement robust input validation.

**Validation Requirements**:
1. **Account Parameter**: Must be present and valid XRPL address
2. **Ledger Index**: Must be valid (number, "validated", "current", "closed")
3. **Boolean Flags**: Validate include_reserves and include_trustlines
4. **Parameter Types**: Ensure correct JSON types for all parameters

---

## Part 4: Testing Implementation

### 4.1 Unit Tests

**Task**: Write comprehensive unit tests for your handler.

**Required Test Cases**:
```cpp
// Test file: src/test/rpc/GetAccountBalance_test.cpp

class GetAccountBalance_test : public beast::unit_test::suite
{
public:
    void testValidRequest()
    {
        // Test normal operation with valid account
    }
    
    void testInvalidAccount()
    {
        // Test various invalid account formats
    }
    
    void testLedgerSelection()
    {
        // Test different ledger_index values
    }
    
    void testPermissions()
    {
        // Test role-based access control
    }
    
    void testErrorConditions()
    {
        // Test all error scenarios
    }
    
    void testOptionalParameters()
    {
        // Test include_reserves and include_trustlines flags
    }
    
    void run() override
    {
        testValidRequest();
        testInvalidAccount();
        testLedgerSelection();
        testPermissions();
        testErrorConditions();
        testOptionalParameters();
    }
};

BEAST_DEFINE_TESTSUITE(GetAccountBalance, rpc, ripple);
```

---

## Resources and References

### Key Files to Study
- `src/ripple/rpc/handlers/AccountInfo.cpp` - Similar account-based handler
- `src/ripple/rpc/handlers/AccountLines.cpp` - Trust line handling
- `src/ripple/rpc/impl/Handler.h` - Handler registration
- `src/ripple/rpc/impl/RPCHelpers.cpp` - Common RPC utilities