# XRPL RPC Functionality and Architecture: Comprehensive Lesson Plan

This document provides a detailed, code-based breakdown of the RPC (Remote Procedure Call) functionality in the XRPL (XRP Ledger) source code. It covers every aspect of the RPC system, including architecture, handler registration and dispatch, request/response flow, authentication and roles, error handling, resource management, batch and streaming support, gRPC integration, and supporting utilities. All explanations are strictly grounded in the provided source code and documentation. For any specific handler or feature, the referenced source files are the final authority.

---

## Table of Contents

- [RPC Overview](#rpc-overview)
- [RPC Handler Registration and Dispatch](#rpc-handler-registration-and-dispatch)
  - [Handler Structure and Table](#handler-structure-and-table)
  - [Handler Lookup and Versioning](#handler-lookup-and-versioning)
  - [Handler Registration](#handler-registration)
- [Request/Response Flow](#requestresponse-flow)
  - [HTTP/WS Entry Points](#httpws-entry-points)
  - [Parsing, Validation, and Role Assignment](#parsing-validation-and-role-assignment)
  - [Handler Invocation](#handler-invocation)
  - [Batch Request Handling](#batch-request-handling)
  - [Response Formatting and Masking](#response-formatting-and-masking)
- [Authentication, Roles, and Permissions](#authentication-roles-and-permissions)
  - [Role Determination](#role-determination)
  - [Role Enforcement](#role-enforcement)
  - [Resource Usage and Limits](#resource-usage-and-limits)
  - [Blacklist and Gossip](#blacklist-and-gossip)
- [Error Handling and Status Codes](#error-handling-and-status-codes)
  - [Error Code Definitions](#error-code-definitions)
  - [Error Injection and Reporting](#error-injection-and-reporting)
  - [HTTP Status Mapping](#http-status-mapping)
  - [Error Response Structure and Masking](#error-response-structure-and-masking)
- [RPC Handler Implementation](#rpc-handler-implementation)
  - [Handler Function Signatures](#handler-function-signatures)
  - [Context Object](#context-object)
  - [Common Handler Patterns](#common-handler-patterns)
  - [Example Handlers](#example-handlers)
  - [Handler Coverage](#handler-coverage)
- [Streaming and Subscriptions](#streaming-and-subscriptions)
  - [doSubscribe and doUnsubscribe](#dosubscribe-and-dounsubscribe)
  - [Available Streams and Permissions](#available-streams-and-permissions)
  - [RPCSub and Event Delivery](#rpcsub-and-event-delivery)
- [gRPC Integration](#grpc-integration)
  - [GRPCServer and CallData](#grpcserver-and-calldata)
  - [Adding New gRPC Methods](#adding-new-grpc-methods)
- [Supporting Classes and Utilities](#supporting-classes-and-utilities)
- [References to Source Code](#references-to-source-code)

---

## RPC Overview

- The XRPL server exposes a comprehensive RPC interface for client interaction, supporting both JSON-RPC (over HTTP/WebSocket) and gRPC ([Handlers.h](src/xrpld/rpc/handlers/Handlers.h.txt), [GRPCServer.cpp](src/xrpld/app/main/GRPCServer.cpp.txt)).
- RPC commands cover all aspects of ledger access, transaction submission, account management, server control, pathfinding, NFT operations, AMM, validator management, and more.
- Each RPC command is implemented as a handler function, registered in a central handler table, and invoked via a unified dispatch mechanism.
- The canonical list of all available RPC handlers is declared in [Handlers.h](src/xrpld/rpc/handlers/Handlers.h.txt). This file serves as the authoritative reference for all supported RPC commands.

---

## RPC Handler Registration and Dispatch

### Handler Structure and Table

- The core structure for an RPC handler is `Handler` ([Handler.h](src/xrpld/rpc/detail/Handler.h.txt)):
  - `name_`: The RPC method name (e.g., "account_info").
  - `valueMethod_`: Function pointer to the handler implementation.
  - `role_`: Required user role (e.g., USER, ADMIN).
  - `condition_`: Required server/network condition (e.g., NEEDS_CURRENT_LEDGER).
  - `minApiVer_`, `maxApiVer_`: Supported API version range.

- All handlers are registered in a static array and managed by `HandlerTable`, which ensures no overlapping API version ranges and provides lookup by name and version ([Handler.cpp](src/xrpld/rpc/detail/Handler.cpp.txt)).

### Handler Lookup and Versioning

- Handlers are retrieved using `getHandler(version, betaEnabled, method)` ([Handler.h](src/xrpld/rpc/detail/Handler.h.txt), [Handler.cpp](src/xrpld/rpc/detail/Handler.cpp.txt)):
  - Looks up the handler by name and checks if the requested API version is within the supported range.
  - Supports beta API versioning and extensibility.

### Handler Registration

- Handlers are registered in a static array in [Handler.cpp](src/xrpld/rpc/detail/Handler.cpp.txt), e.g.:
  - `{"account_info", byRef(&doAccountInfo), Role::USER, NO_CONDITION},`
  - Each entry specifies the method name, function pointer, required role, and condition.

---

## Request/Response Flow

### HTTP/WS Entry Points

- Incoming HTTP and WebSocket requests are handled by `ServerHandler` ([ServerHandler.h](src/xrpld/rpc/ServerHandler.h.txt), [ServerHandler.cpp](src/xrpld/rpc/detail/ServerHandler.cpp.txt)):
  - Accepts connections, parses requests, and manages sessions.
  - Supports both single and batch JSON-RPC requests.
  - Handles authentication, resource usage, and error responses.

### Parsing, Validation, and Role Assignment

- Requests are parsed and validated for structure, method, and parameters ([ServerHandler.cpp](src/xrpld/rpc/detail/ServerHandler.cpp.txt)):
  - Checks for required fields (`method`, `params`), correct types, and non-empty values.
  - Determines the API version from the request.
  - Assigns a user role using `roleRequired` and `requestRole`, based on method, API version, and authentication ([RPCHandler.cpp](src/xrpld/rpc/detail/RPCHandler.cpp.txt)).

### Handler Invocation

- After validation, the appropriate handler is invoked via `doCommand` ([RPCHandler.h](src/xrpld/rpc/RPCHandler.h.txt), [RPCHandler.cpp](src/xrpld/rpc/detail/RPCHandler.cpp.txt)):
  - Fills a `JsonContext` with request data, application state, and user info.
  - Looks up the handler and checks conditions (network state, ledger availability) using `conditionMet`.
  - Calls the handler function, passing the context and a result object.
  - Handles exceptions and logs performance metrics.

### Batch Request Handling

- Batch requests are supported by detecting a `"method": "batch"` field and iterating over the `"params"` array ([ServerHandler.cpp](src/xrpld/rpc/detail/ServerHandler.cpp.txt)):
  - Each sub-request is processed independently, with results collected into an array.
  - Errors in individual sub-requests do not affect others.

### Response Formatting and Masking

- Responses are formatted according to the API version and request type ([ServerHandler.cpp](src/xrpld/rpc/detail/ServerHandler.cpp.txt)):
  - For API v2.0+, errors are included as objects with `status`, `code`, and `message` fields.
  - For earlier versions, errors are included as fields in the response object.
  - Sensitive fields (e.g., `passphrase`, `secret`, `seed`, `seed_hex`) are masked in error responses.
  - Batch responses are returned as arrays; single responses as objects.
  - The response may include additional fields such as `jsonrpc`, `ripplerpc`, and `id` if present in the request.

---

## Authentication, Roles, and Permissions

### Role Determination

- Roles are determined by `roleRequired` and `requestRole` ([RPCHandler.cpp](src/xrpld/rpc/detail/RPCHandler.cpp.txt)):
  - Roles include ADMIN, USER, IDENTIFIED, PROXY, FORBID.
  - Role assignment is based on method, API version, authentication headers, and server configuration.

### Role Enforcement

- Each handler specifies a required role; requests from users with insufficient privileges are rejected with appropriate error codes ([Handler.cpp](src/xrpld/rpc/detail/Handler.cpp.txt), [ServerHandler.cpp](src/xrpld/rpc/detail/ServerHandler.cpp.txt)).

### Resource Usage and Limits

- Resource usage is tracked per request using `Resource::Consumer` ([ServerHandler.cpp](src/xrpld/rpc/detail/ServerHandler.cpp.txt)):
  - Each request is charged a fee based on its type and load.
  - Excessive or malformed requests are penalized, and clients may be disconnected if they exceed limits.
  - Warnings are included in responses if resource usage is high.

### Blacklist and Gossip

- The server maintains a blacklist of IP addresses that are imposing significant load, using a mechanism called "Gossip" ([Resource README](include/xrpl/resource/README.md)):
  - Each server in a cluster shares its blacklist with others to help identify and drop connections from abusive clients.
  - The blacklist can be queried via the `doBlackList` handler.

---

## Error Handling and Status Codes

### Error Code Definitions

- Error codes are defined in [ErrorCodes.h](include/xrpl/protocol/ErrorCodes.h.txt) and [ErrorCodes.cpp](src/libxrpl/protocol/ErrorCodes.cpp.txt):
  - Enumerates all possible error codes (e.g., `rpcINVALID_PARAMS`, `rpcNO_PERMISSION`, `rpcNOT_READY`, etc.).
  - Each code has a string token, message, and HTTP status.

### Error Injection and Reporting

- Utility functions inject errors into JSON responses ([ErrorCodes.h](include/xrpl/protocol/ErrorCodes.h.txt), [ErrorCodes.cpp](src/libxrpl/protocol/ErrorCodes.cpp.txt)):
  - `inject_error`, `make_error`, `missing_field_error`, `invalid_field_error`, etc.
  - Errors are included in the response with fields: `error`, `error_code`, `error_message`, and optionally `status`.

### HTTP Status Mapping

- Error codes are mapped to HTTP status codes for proper client handling ([ErrorCodes.cpp](src/libxrpl/protocol/ErrorCodes.cpp.txt)):
  - E.g., `rpcFORBIDDEN` → 403, `rpcNOT_READY` → 503, `rpcINTERNAL` → 500, `rpcNO_PERMISSION` → 401, `rpcUNKNOWN_COMMAND` → 405, etc.

### Error Response Structure and Masking

- For API v2.0+, error responses are structured as objects with `status`, `code`, and `message` fields.
- For earlier versions, errors are included as fields in the response object, and the original request is included with sensitive fields masked (e.g., `passphrase`, `secret`, `seed`, `seed_hex`).
- The error response may also include the original request, the error code, and a human-readable message.

---

## RPC Handler Implementation

### Handler Function Signatures

- Each handler is a function taking a `RPC::JsonContext&` and returning a `Json::Value` ([Handlers.h](src/xrpld/rpc/handlers/Handlers.h.txt)):
  - Example: `Json::Value doAccountInfo(RPC::JsonContext& context);`

### Context Object

- `JsonContext` encapsulates all request state ([Context.h](src/xrpld/rpc/Context.h.txt)):
  - Application reference, ledger views, user role, resource usage, parameters, headers, and more.
  - Used by handlers to access ledger data, configuration, and user info.

### Common Handler Patterns

- Handlers typically:
  - Validate input parameters (using helpers like `accountFromString`, `readLimitField`).
  - Look up ledger and account data.
  - Perform the requested operation (e.g., fetch account info, submit transaction).
  - Format and return the result as a JSON object.
  - Handle errors using the error utilities.

### Example Handlers

- [doAccountInfo](src/xrpld/rpc/handlers/AccountInfo.cpp.txt): Retrieves account data, validates input, and returns account state.
- [doBookOffers](src/xrpld/rpc/handlers/BookOffers.cpp.txt): Validates order book parameters, fetches offers, and returns paginated results.
- [doTxJson](src/xrpld/rpc/handlers/Tx.cpp.txt): Retrieves transaction details by hash or CTID, validates input, and formats the response.
- [doNoRippleCheck](src/xrpld/rpc/handlers/NoRippleCheck.cpp.txt): Checks account trust lines and flags, suggests corrective transactions, and returns issues found.

### Handler Coverage

- The XRPL server supports a wide range of RPC commands, including but not limited to:
  - Account management: `account_info`, `account_objects`, `account_nfts`, `account_offers`, etc.
  - Ledger operations: `ledger`, `ledger_data`, `ledger_entry`, `ledger_header`, etc.
  - Transaction processing: `submit`, `sign`, `sign_for`, `submit_multisigned`, `tx`, `tx_history`, etc.
  - Server and peer management: `server_info`, `server_state`, `peers`, `stop`, etc.
  - NFT operations: `nft_buy_offers`, `nft_sell_offers`, etc.
  - Pathfinding: `path_find`, `ripple_path_find`.
  - Validator management: `validators`, `validator_info`, `unl_list`, etc.
  - AMM and other features: `amm_info`, `feature`, etc.
- The full, authoritative list is in [Handlers.h](src/xrpld/rpc/handlers/Handlers.h.txt).

---

## Streaming and Subscriptions

### doSubscribe and doUnsubscribe

- [doSubscribe](src/xrpld/rpc/handlers/Subscribe.cpp.txt) and [doUnsubscribe](src/xrpld/rpc/handlers/Subscribe.cpp.txt) manage real-time data streams:
  - Clients can subscribe to streams such as `server`, `ledger`, `book_changes`, `transactions`, `validations`, `manifests`, `peer_status`, `consensus`, and more.
  - Subscriptions are managed via `InfoSub` objects, with authentication and permission checks for certain streams (e.g., `peer_status` requires ADMIN).

### Available Streams and Permissions

- The following streams are available for subscription:
  - `server`, `ledger`, `book_changes`, `manifests`, `transactions`, `transactions_proposed`/`rt_transactions`, `validations`, `peer_status`, `consensus`.
  - Some streams (e.g., `peer_status`) require ADMIN privileges.
  - Subscriptions can be made via WebSocket or via URL (the latter requires admin authentication).
  - Subscriptions can include account and book monitoring, with immediate snapshots available if requested.

### RPCSub and Event Delivery

- [RPCSub.cpp](src/xrpld/net/detail/RPCSub.cpp.txt) implements the `RPCSubImp` class for delivering events to remote endpoints:
  - Maintains a queue of events, supports authentication, and sends events asynchronously using `RPCCall::fromNetwork`.
  - Handles connection details, SSL, and error logging.
  - Factory function `make_RPCSub` creates instances for use by the server.

---

## gRPC Integration

### GRPCServer and CallData

- [GRPCServer.cpp](src/xrpld/app/main/GRPCServer.cpp.txt) implements the gRPC server:
  - Defines `GRPCServer` and `GRPCServerImpl`, which manage the server lifecycle and request processing.
  - Uses a templated `CallData` class to handle each gRPC method, managing request/response, resource usage, and role determination.
  - Supports endpoints such as `GetLedger`, `GetLedgerData`, `GetLedgerDiff`, `GetLedgerEntry`.

### Adding New gRPC Methods

To add a new gRPC method ([README](include/xrpl/proto/org/xrpl/rpc/v1/README.md)):

1. **Define the method in `xrp_ledger.proto`** with appropriate request/response types (request type suffixed with `Request`, response with `Response`).
2. **Add an instantiation of `CallData`** in `GRPCServerImpl::setupListeners()`.
3. **Implement the handler** in the appropriate file under `src/ripple/rpc/handlers/`.
4. **If a JSON/WebSocket equivalent exists**, abstract common logic into helper functions (see `Tx.cpp` or `AccountTx.cpp` for examples).

---

## Supporting Classes and Utilities

- [RPCCall.cpp](src/xrpld/net/detail/RPCCall.cpp.txt): Implements parsing, constructing, and executing RPC commands from CLI or network, including authentication and error handling.
- [RPCHelpers.h](src/xrpld/rpc/detail/RPCHelpers.h.txt): Provides helper functions for account parsing, ledger lookup, and parameter validation.
- [Status.h](src/xrpld/rpc/Status.h.txt): Defines the `Status` class for representing handler execution results.
- [Context.h](src/xrpld/rpc/Context.h.txt): Defines the `JsonContext` structure used by all handlers.
- [BookChanges.h](src/xrpld/rpc/BookChanges.h.txt): Implements `computeBookChanges` for summarizing order book changes in a ledger.

---

## References to Source Code

- [Handlers.h](src/xrpld/rpc/handlers/Handlers.h.txt)
- [Handler.h](src/xrpld/rpc/detail/Handler.h.txt)
- [Handler.cpp](src/xrpld/rpc/detail/Handler.cpp.txt)
- [RPCHandler.h](src/xrpld/rpc/RPCHandler.h.txt)
- [RPCHandler.cpp](src/xrpld/rpc/detail/RPCHandler.cpp.txt)
- [ServerHandler.h](src/xrpld/rpc/ServerHandler.h.txt)
- [ServerHandler.cpp](src/xrpld/rpc/detail/ServerHandler.cpp.txt)
- [RPCCall.cpp](src/xrpld/net/detail/RPCCall.cpp.txt)
- [RPCCall.h](src/xrpld/net/RPCCall.h.txt)
- [RPCHelpers.h](src/xrpld/rpc/detail/RPCHelpers.h.txt)
- [ErrorCodes.h](include/xrpl/protocol/ErrorCodes.h.txt)
- [ErrorCodes.cpp](src/libxrpl/protocol/ErrorCodes.cpp.txt)
- [GRPCServer.cpp](src/xrpld/app/main/GRPCServer.cpp.txt)
- [Subscribe.cpp](src/xrpld/rpc/handlers/Subscribe.cpp.txt)
- [RPCSub.cpp](src/xrpld/net/detail/RPCSub.cpp.txt)
- [BookOffers.cpp](src/xrpld/rpc/handlers/BookOffers.cpp.txt)
- [AccountInfo.cpp](src/xrpld/rpc/handlers/AccountInfo.cpp.txt)
- [Tx.cpp](src/xrpld/rpc/handlers/Tx.cpp.txt)
- [NoRippleCheck.cpp](src/xrpld/rpc/handlers/NoRippleCheck.cpp.txt)
- [BookChanges.h](src/xrpld/rpc/BookChanges.h.txt)
- [LedgerHandler.cpp](src/xrpld/rpc/handlers/LedgerHandler.cpp.txt)
- [LedgerHandler.h](src/xrpld/rpc/handlers/LedgerHandler.h.txt)
- [TransactionSign.cpp](src/xrpld/rpc/detail/TransactionSign.cpp.txt)
- [TransactionSign.h](src/xrpld/rpc/detail/TransactionSign.h.txt)
- [NetworkOPs.cpp](src/xrpld/app/misc/NetworkOPs.cpp.txt)
- [Main.cpp](src/xrpld/app/main/Main.cpp.txt)