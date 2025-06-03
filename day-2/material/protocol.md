# XRPL Protocol Feature and Object Management

This document provides a comprehensive overview of how the XRPL (XRP Ledger) source code manages protocol features (amendments), transaction types, ledger entries, and serialized fields using a macro-driven system. The approach ensures consistency, maintainability, and ease of protocol evolution by centralizing definitions and automating code generation for serialization, validation, and key computation.

---

## Table of Contents

- [Feature Management](#feature-management)
- [Transaction Type Definitions](#transaction-type-definitions)
- [Ledger Entry Definitions](#ledger-entry-definitions)
- [Serialized Field Definitions](#serialized-field-definitions)
- [How These Components Work Together](#how-these-components-work-together)
- [Serialization and Data Structures](#serialization-and-data-structures)
  - [STObject](#stobject)
  - [STArray](#starray)
  - [STBase](#stbase)
  - [STVar](#stvar)
  - [SOTemplate](#sotemplate)
  - [STLedgerEntry](#stledgerentry)
  - [STAccount](#staccount)
  - [STAmount](#stamount)
  - [STNumber](#stnumber)
  - [STBlob](#stblob)
  - [STVector256](#stvector256)
  - [STIssue](#stissue)
  - [STCurrency](#stcurrency)
  - [STPathSet](#stpathset)
  - [STParsedJSON](#stparsedjson)
- [Protocol Context and Field Access](#protocol-context-and-field-access)

---

## Feature Management

XRPL protocol features and amendments are defined and managed using macros in `features.macro`. The key macros are:

- `XRPL_FEATURE(name, supported, vote)`: Registers a new protocol feature.
- `XRPL_FIX(name, supported, vote)`: Registers a protocol fix (for bug fixes).
- `XRPL_RETIRE(name)`: Marks an amendment as retired.

These macros expand to code that registers, tracks, and enforces amendments across the network. All amendments are listed in `xrpl/protocol/detail/features.macro`, and the total number is tracked in `Feature.h`. The macro system ensures that new amendments are added in a consistent and centralized manner, with compile-time checks for undefined macros.

---

## Transaction Type Definitions

Transaction types are defined in `transactions.macro` using the `TRANSACTION` macro. Each transaction specifies a tag, numeric value, class name, delegation status, and a list of required/optional fields.

**Example:**
```cpp
TRANSACTION(ttPAYMENT, 0, Payment, Delegation::delegatable, ({
    {sfDestination, soeREQUIRED},
    {sfAmount, soeREQUIRED, soeMPTSupported},
    {sfSendMax, soeOPTIONAL, soeMPTSupported},
    {sfPaths, soeDEFAULT},
    {sfInvoiceID, soeOPTIONAL},
    {sfDestinationTag, soeOPTIONAL},
    {sfDeliverMin, soeOPTIONAL, soeMPTSupported},
    {sfCredentialIDs, soeOPTIONAL},
}))
```
This macro expands to generate code for transaction processing, validation, and serialization, making it easy to add or modify transaction types in a single location.

---

## Ledger Entry Definitions

Ledger object types are defined in `ledger_entries.macro` using the `LEDGER_ENTRY` macro. Each entry has a type code, numeric ID, class name, and a list of fields.

**Example:**
```cpp
LEDGER_ENTRY(ltOFFER, 0x006f, Offer, offer, ({
    {sfAccount,              soeREQUIRED},
    {sfSequence,             soeREQUIRED},
    {sfTakerPays,            soeREQUIRED},
    {sfTakerGets,            soeREQUIRED},
    {sfBookDirectory,        soeREQUIRED},
    {sfBookNode,             soeREQUIRED},
    {sfOwnerNode,            soeREQUIRED},
    {sfPreviousTxnID,        soeREQUIRED},
    {sfPreviousTxnLgrSeq,    soeREQUIRED},
    {sfExpiration,           soeOPTIONAL},
}))
```
Macros generate code for ledger serialization, deserialization, and validation. These definitions are also used in files like `Indexes.cpp` to compute unique keys for ledger objects.

---

## Serialized Field Definitions

All possible fields (SFields) that can appear in transactions and ledger entries are defined in `sfields.macro`, mapping each to a type and unique code. Types correspond to C++ classes (e.g., `STAmount`, `STAccount`).

**Example:**
```cpp
TYPED_SFIELD(sfAmount, AMOUNT, 1)
TYPED_SFIELD(sfAccount, ACCOUNT, 1)
TYPED_SFIELD(sfSequence, UINT32, 4)
TYPED_SFIELD(sfTakerPays, AMOUNT, 4)
TYPED_SFIELD(sfTakerGets, AMOUNT, 5)
```
Macro expansions generate SField objects used for serialization, deserialization, and validation, ensuring each field knows its type, code, and processing logic.

---

## How These Components Work Together

- **Transactions:** Transaction types and required fields are determined from `transactions.macro`, with field types and codes from `sfields.macro`.
- **Ledger Entries:** Ledger objects are defined in `ledger_entries.macro`, referencing SFields for their structure. These definitions are used for serialization and key computation.
- **SFields and Types:** SFields are mapped to C++ types, ensuring correct serialization and validation of protocol objects.

---

## Serialization and Data Structures

Classes and functions for handling data and values associated with the XRP Ledger protocol use the "ST" prefix for serialized types. Objects transmitted over the network must be serialized into a canonical format.

### STObject

Implements the `STObject` class, a core data structure for representing and manipulating serialized objects with various field types. Provides constructors, field accessors, mutators, serialization/deserialization, template application, comparison, and JSON conversion, ensuring field ordering and type safety.

**Example:**
```cpp
STObject obj;
obj.setFieldU32(sfSequence, 12345); // Setter
uint32_t seq = obj.getFieldU32(sfSequence); // Getter
```

### STArray

Implements the `STArray` class, representing an array of `STObject` elements. Supports construction, move semantics, serialization/deserialization, JSON/text conversion, sorting, and comparison, ensuring only valid objects are added.

**Example:**
```cpp
STArray arr;
arr.emplace_back(STObject(sfGeneric));
const STObject& elem = arr[0];
```

### STBase

Implements the `STBase` class, a foundational class for serialized types. Provides basic construction, assignment, comparison, and field name management, serving as a base for more specific data structures.

**Example:**
```cpp
STBase base;
std::string name = base.getFullText();
```

### STVar

Implements the `STVar` class, a type-erased wrapper for various serialized types. Manages construction, destruction, copying, and moving of protocol objects, supporting stack and heap allocation, and enforces maximum nesting depth.

**Example:**
```cpp
STVar var(STAmount(1000));
auto& amt = var.get<STAmount>();
```

### SOTemplate

Implements the `SOTemplate` class, managing a template of fields for protocol objects. Constructs a list of unique and common fields, checks for valid and non-duplicate field indices, and provides efficient field lookup.

**Example:**
```cpp
SOTemplate tmpl({{sfAccount, soeREQUIRED}, {sfAmount, soeOPTIONAL}});
auto idx = tmpl.getIndex(sfAccount);
```

### STLedgerEntry

Implements the `STLedgerEntry` class, representing a ledger entry. Provides constructors, serialization, JSON conversion, text representation, and logic for handling ledger entry types and transaction threading.

**Example:**
```cpp
STLedgerEntry entry(ltOFFER);
entry.setFieldAmount(sfTakerPays, STAmount(1000));
STAmount amt = entry.getFieldAmount(sfTakerPays);
```

### STAccount

Implements the `STAccount` class, representing an account field in serialized objects. Provides constructors, serialization logic, equivalence checks, and string conversion, managing account data and ensuring correct serialization.

**Example:**
```cpp
STAccount acct;
acct.setAccountID(accountID);
AccountID id = acct.getAccountID();
```

### STAmount

Implements the `STAmount` class, representing and manipulating amounts of native XRP, IOUs, and MPT tokens. Provides arithmetic operations, serialization/deserialization, JSON conversion, and canonicalization logic, ensuring type safety and correct formatting.

**Example:**
```cpp
STAmount amt(1000000); // 1 XRP in drops
amt += STAmount(500000);
int64_t value = amt.xrp().drops();
```

### STNumber

Implements the `STNumber` class, representing a serialized numeric value with mantissa and exponent. Provides construction, serialization, deserialization, comparison, and conversion from JSON and string representations, with parsing logic for numbers.

**Example:**
```cpp
STNumber num(42);
int64_t val = num.value();
```

### STBlob

Implements the `STBlob` class, representing a variable-length binary field. Provides methods for copying, moving, serializing, comparing blob data, and converting to hexadecimal, supporting default value checks.

**Example:**
```cpp
Blob data = {0x01, 0x02, 0x03};
STBlob blob(data);
auto hex = blob.getText();
```

### STVector256

Implements the `STVector256` class, representing a vector of 256-bit values. Provides serialization/deserialization, JSON conversion, comparison, and manipulation of vector contents, ensuring correct handling of binary data.

**Example:**
```cpp
STVector256 vec;
vec.push_back(uint256::fromHex("AABB..."));
auto v = vec[0];
```

### STIssue

Implements the `STIssue` class, representing an issued asset or currency. Handles serialization, deserialization, JSON conversion, and equivalence checks for different issue types, ensuring consistency and correct construction.

**Example:**
```cpp
STIssue issue(currency, issuer);
auto c = issue.getCurrency();
auto i = issue.getIssuer();
```

### STCurrency

Implements the `STCurrency` class, representing a currency type in serialized objects. Provides constructors, serialization, JSON conversion, comparison, and utility methods for handling currency values, including validation from JSON.

**Example:**
```cpp
STCurrency curr;
curr.setCurrency(currencyID);
auto id = curr.getCurrency();
```

### STPathSet

Implements the `STPathSet` and related classes, handling sets of payment paths for pathfinding and transaction routing. Provides serialization/deserialization, path equivalence checks, path addition, JSON conversion, and hashing for path elements.

**Example:**
```cpp
STPathSet paths;
paths.addPath(path);
auto json = paths.getJson(0);
```

### STParsedJSON

Implements parsing of JSON objects and arrays into protocol-specific data structures. Provides error handling for type mismatches, unknown fields, invalid data, and nesting depth, converting JSON input into strongly-typed protocol objects.

**Example:**
```cpp
Json::Value jv = ...;
STParsedJSON parsed("Payment", jv);
auto obj = parsed.object;
```

### Optional Fields

- `x[sfFoo]` returns the value of 'Foo' if it exists, or the default value if it doesn't.
- `x[~sfFoo]` returns the value of 'Foo' if it exists, or nothing if it doesn't.
- Assignment like `x[~sfFoo] = y[~sfFoo]` copies the value or omits the field if not present.

**Example:**
```cpp
uint32_t seq = obj[sfSequence]; // get with default
std::optional<uint32_t> optSeq = obj[~sfSequence]; // get optional
obj[sfSequence] = 12345; // set value
```
