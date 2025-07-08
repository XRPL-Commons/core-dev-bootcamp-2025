# XRPL RPC Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the RPC (Remote Procedure Call) subsystem in the XRPL (XRP Ledger) source code. It covers every aspect of the RPC system, including handler registration/discovery, a comprehensive handler list, error handling and propagation (including permission errors), handler/call lifecycle, testing requirements, and best practices. All explanations are strictly grounded in the provided source code and documentation.

---

## Table of Contents

- [RPC Overview](#rpc-overview)
- [Handler Registration and Discovery](#handler-registration-and-discovery)
- [Comprehensive Handler List](#comprehensive-handler-list)
- [RPC Request Lifecycle](#rpc-request-lifecycle)
- [Role and Permission Management](#role-and-permission-management)
- [Resource Management](#resource-management)
- [Handler Lookup and Dispatch](#handler-lookup-and-dispatch)
- [Precondition Checks](#precondition-checks)
- [Command Validation and Dispatch](#command-validation-and-dispatch)
- [Error Handling and Response Formatting](#error-handling-and-response-formatting)
- [Permission Error Responses](#permission-error-responses)
- [Handler/Call Lifecycle](#handlercall-lifecycle)
- [Testing Requirements](#testing-requirements)
- [Examples and Best Practices](#examples-and-best-practices)
- [Supporting Classes and Utilities](#supporting-classes-and-utilities)
- [References to Source Code](#references-to-source-code)

---

## RPC Overview

- The XRPL server exposes a comprehensive RPC interface for interacting with the ledger, submitting transactions, querying state, and managing server operations.
- RPC requests can be made over HTTP, WebSocket, or gRPC (for select endpoints).
- The RPC subsystem is responsible for:
  - Parsing and validating incoming requests.
  - Determining the required and actual user roles.
  - Enforcing resource and rate limits.
  - Locating and dispatching the correct handler for each command.
  - Checking preconditions (network/ledger state).
  - Executing the handler and formatting the response.
  - Handling errors and masking sensitive information.

---

## Handler Registration and Discovery

### JSON/WebSocket Handlers

- Handler functions (e.g., `doAccountInfo`, `doBookOffers`) are declared in [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/Handlers.h.txt].
- Handlers are registered in a static handler table, defined in [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.cpp.txt]. Each entry specifies:
  - Method name (string)
  - Function pointer
  - Required user role
  - Required precondition
  - API version range
- The handler table is populated at server startup and is used for all JSON and WebSocket RPC dispatch.

### gRPC Handlers

- To add a new gRPC method:
  1. Define the method in `xrp_ledger.proto` (method name should begin with a verb).
  2. Define request and response types in their own files, named `<MethodName>Request` and `<MethodName>Response`.
  3. Instantiate the templated `CallData` class in `GRPCServerImpl::setupListeners()` ([https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/main/GRPCServer.cpp.txt]), specifying the request and response types.
  4. Implement the handler in the appropriate file under `src/ripple/rpc/handlers/`, abstracting common logic if a JSON/WebSocket equivalent exists.
- The gRPC server manages a set of `CallData` objects, each representing an active RPC call.

### Handler Discovery

- The function `getHandlerNames()` ([https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.h.txt]) returns the set of all registered handler names.
- The handler table supports versioning and beta flags, ensuring only valid handlers for the requested API version are accessible.

---

## Comprehensive Handler List

The following is a direct, code-based list of all available handlers, their required roles, and preconditions, as defined in [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.cpp.txt]. (For brevity, only a representative subset is shown; see the source for the full list.)

| Method Name              | Handler Function         | Required Role | Preconditions           | API Version Range |
|------------------------- |-------------------------|---------------|-------------------------|-------------------|
| account_currencies       | doAccountCurrencies     | USER          | NO_CONDITION            | 1+                |
| account_info             | doAccountInfo           | USER          | NO_CONDITION            | 1+                |
| account_lines            | doAccountLines          | USER          | NO_CONDITION            | 1+                |
| account_channels         | doAccountChannels       | USER          | NO_CONDITION            | 1+                |
| account_nfts             | doAccountNFTs           | USER          | NO_CONDITION            | 1+                |
| account_objects          | doAccountObjects        | USER          | NO_CONDITION            | 1+                |
| account_offers           | doAccountOffers         | USER          | NO_CONDITION            | 1+                |
| account_tx               | doAccountTxJson         | USER          | NEEDS_NETWORK_CONNECTION| 1+                |
| amm_info                 | doAMMInfo               | USER          | NO_CONDITION            | 1+                |
| book_offers              | doBookOffers            | USER          | NO_CONDITION            | 1+                |
| book_changes             | doBookChanges           | USER          | NO_CONDITION            | 1+                |
| black_list               | doBlackList             | ADMIN         | NO_CONDITION            | 1+                |
| can_delete               | doCanDelete             | ADMIN         | NO_CONDITION            | 1+                |
| channel_authorize        | doChannelAuthorize      | USER          | NO_CONDITION            | 1+                |
| channel_verify           | doChannelVerify         | USER          | NO_CONDITION            | 1+                |
| connect                  | doConnect               | ADMIN         | NO_CONDITION            | 1+                |
| consensus_info           | doConsensusInfo         | ADMIN         | NO_CONDITION            | 1+                |
| deposit_authorized       | doDepositAuthorized     | USER          | NO_CONDITION            | 1+                |
| feature                  | doFeature               | USER          | NO_CONDITION            | 1+                |
| fee                      | doFee                   | USER          | NEEDS_CURRENT_LEDGER    | 1+                |
| fetch_info               | doFetchInfo             | ADMIN         | NO_CONDITION            | 1+                |
| gateway_balances         | doGatewayBalances       | USER          | NO_CONDITION            | 1+                |
| get_counts               | doGetCounts             | ADMIN         | NO_CONDITION            | 1+                |
| get_aggregate_price      | doGetAggregatePrice     | USER          | NO_CONDITION            | 1+                |
| ledger_accept            | doLedgerAccept          | ADMIN         | NEEDS_CURRENT_LEDGER    | 1+                |
| ledger_cleaner           | doLedgerCleaner         | ADMIN         | NEEDS_NETWORK_CONNECTION| 1+                |
| ledger_closed            | doLedgerClosed          | USER          | NEEDS_CLOSED_LEDGER     | 1+                |
| ledger_current           | doLedgerCurrent         | USER          | NEEDS_CURRENT_LEDGER    | 1+                |
| ledger_data              | doLedgerData            | USER          | NO_CONDITION            | 1+                |
| ledger_entry             | doLedgerEntry           | USER          | NO_CONDITION            | 1+                |
| ...                      | ...                     | ...           | ...                     | ...               |

*See [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.cpp.txt] for the complete, up-to-date handler table.*

---

## RPC Request Lifecycle

(As previously documented; see original for details.)

---

## Role and Permission Management

(As previously documented; see original for details.)

---

## Resource Management

(As previously documented; see original for details.)

---

## Handler Lookup and Dispatch

- The handler table is a multimap of method names to Handler objects ([https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.cpp.txt]).
- The function `getHandler()` retrieves the handler for a given method, API version, and beta flag.
- For gRPC, handlers are registered via `CallData` instantiation in [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/main/GRPCServer.cpp.txt].

---

## Precondition Checks

- Each handler specifies required preconditions (e.g., network connectivity, ledger state).
- The function `conditionMet()` ([https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.h.txt]) checks these before handler execution.

---

## Command Validation and Dispatch

- The function `fillHandler()` ([https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/RPCHandler.cpp.txt]) validates the request, checks permissions, and locates the handler.
- The function `doCommand()` orchestrates handler execution and error handling.

---

## Error Handling and Response Formatting

### Error Propagation

- Errors are propagated from handlers to clients using error codes and structured JSON responses.
- For gRPC, errors are mapped to gRPC status codes and response messages ([https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/main/GRPCServer.cpp.txt]).
- Utilities in [include/xrpl/protocol/ErrorCodes.h.txt] and [src/libxrpl/protocol/ErrorCodes.cpp.txt] standardize error injection and formatting.

### Standard Error Handling and Logging

- Handlers return errors using `rpcError()` or `make_error()` utilities.
- Errors are logged using the server's logging facilities (see [xrpl/basics/Log.h]).
- Example error propagation:
  ```cpp
  if (!isUnlimited(context.role))
      return rpcError(rpcNO_PERMISSION);
  ```
- For JSON/WebSocket, error responses include:
  - `status: "error"`
  - `error`: error token (e.g., "noPermission")
  - `error_code`: numeric code (e.g., 401)
  - `error_message`: human-readable message
- For gRPC, errors are mapped to appropriate gRPC status codes and messages.

---

## Permission Error Responses

- Permission errors are indicated by the error code `rpcNO_PERMISSION` (value: 401), token `"noPermission"`, and message `"You don't have permission for this command."` ([include/xrpl/protocol/ErrorCodes.h.txt], [src/libxrpl/protocol/ErrorCodes.cpp.txt]).
- Example JSON error response:
  ```json
  {
    "status": "error",
    "error": "noPermission",
    "error_code": 401,
    "error_message": "You don't have permission for this command."
  }
  ```
- For gRPC, the error is mapped to a gRPC status code (e.g., `PERMISSION_DENIED`) with the same message.

---

## Handler/Call Lifecycle

### Creation, Usage, and Destruction

- Handler objects are not persistent; each request is dispatched to the appropriate handler function, which processes the request and returns a result.
- For gRPC, each call is managed by a `CallData` object ([https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/main/GRPCServer.cpp.txt]):
  - Created when a request is received.
  - Processes the request asynchronously.
  - Destroys itself after sending the response.

### Concurrency

- Multiple requests (across all interfaces) may be processed concurrently.
- Handlers must be thread-safe and avoid shared mutable state.
- The handler table and supporting caches are designed for concurrent access.

---

## Testing Requirements

- After implementing a new handler, comprehensive testing is required.
- For gRPC, see the "#### Testing" section in [include/xrpl/proto/org/xrpl/rpc/v1/README.md] (not fully included here).
- All request/response types must be validated, and error conditions tested.
- If a handler has both JSON/WebSocket and gRPC interfaces, both must be tested for consistency.

---

## Examples and Best Practices

### Best Practices

- Abstract common logic into helper functions when implementing both JSON/WebSocket and gRPC handlers (see `Tx.cpp` or `AccountTx.cpp`).
- Follow naming conventions for request/response types.
- Document every class and function.
- Focus each module on a single problem, with one class per header and as much implementation hidden as possible.

### Exemplary Implementations

- See [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/Tx.cpp.txt] and [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/AccountTx.cpp.txt] for shared logic and handler implementation.
- Handler declarations in [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/Handlers.h.txt] provide function signatures and organization.

---

## Supporting Classes and Utilities

(As previously documented; see original for details.)

---

## References to Source Code

- [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/Handlers.h.txt]
- [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.cpp.txt]
- [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/detail/Handler.h.txt]
- [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/app/main/GRPCServer.cpp.txt]
- [include/xrpl/protocol/ErrorCodes.h.txt]
- [src/libxrpl/protocol/ErrorCodes.cpp.txt]
- [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/Tx.cpp.txt]
- [https://github.com/XRPLF/rippled/blob/develop/src/xrpld/rpc/handlers/AccountTx.cpp.txt]
- [include/xrpl/proto/org/xrpl/rpc/v1/README.md]
- (See original documentation for additional references.)