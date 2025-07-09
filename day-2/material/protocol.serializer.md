# XRPL Protocol: Serialization, Field Codes, and Canonical Binary Format

This section expands the protocol material to include precise, code-grounded details on how to serialize transactions, use field codes, and apply the canonical serialization format in the XRP Ledger (XRPL).

---

## Serialization of Transactions and Protocol Objects

### Overview

- The XRPL uses a canonical binary format for transactions, ledger entries, and other protocol objects.
- This format is required for digital signatures and for peer-to-peer communication between servers.
- JSON is used for API communication, but **all signing and consensus-critical operations use the binary format**.

### Serialization Steps

To serialize a transaction (or any protocol object):

1. **Ensure all required fields are present**, including auto-fillable fields (e.g., `Sequence`, `Fee`, `SigningPubKey`).
2. **Convert each field's value to its internal binary format** (see [Type List](#type-list)).
3. **Sort fields in canonical order** (see [Canonical Field Order](#canonical-field-order)).
4. **Prefix each field with its Field ID** (see [Field IDs](#field-ids)).
5. **Concatenate all fields (with prefixes) in sorted order** to produce the final binary blob.

- For signing, hash the binary blob with the appropriate prefix (`0x53545800` for single-signing, `0x534D5400` for multi-signing).
- After signing, re-serialize the transaction with the `TxnSignature` field included.

---

## Field Codes and Field IDs

### Field Codes

- Each field is defined by a **type code** and a **field code**.
- Type codes are assigned to each data type (e.g., UInt32, Amount, AccountID).
- Field codes are unique within each type and are used to order fields of the same type.

### Field IDs

- The **Field ID** is a compact encoding of the type code and field code, used as a prefix for each field in the binary format.
- The size of the Field ID is 1–3 bytes, depending on the values:
    - **Type code < 16, Field code < 16:** 1 byte (high 4 bits: type, low 4 bits: field)
    - **Type code >= 16 or Field code >= 16:** 2 or 3 bytes (see table below)

|                  | Type Code < 16, Field Code < 16 | Type Code >= 16, Field Code < 16 | Type Code < 16, Field Code >= 16 | Type Code >= 16, Field Code >= 16 |
|------------------|---------------------------------|-----------------------------------|-----------------------------------|-------------------------------------|
| **Bytes**        | 1                               | 2                                 | 2                                 | 3                                   |

- **Do not sort by Field ID bytes**; always sort by (type code, field code) tuple.

---

## Canonical Field Order

- Fields are sorted first by **type code**, then by **field code**.
- This order is critical for signature validity and protocol compatibility.
- Type codes and field codes are defined in the XRPL source (`SField.h`, `sfields.macro`) and in the [definitions file](https://github.com/XRPLF/xrpl.js/blob/main/packages/ripple-binary-codec/src/enums/definitions.json).

---

## Internal Binary Format for Each Type

See the [Type List](#type-list) for all types, their codes, and serialization rules.

### Examples

- **UInt32**: 4 bytes, big-endian.
- **Amount**: 8 bytes for XRP, 8+20+20 bytes for tokens (see [Amount Fields](#amount-fields)).
- **AccountID**: 20 bytes, length-prefixed if top-level field.
- **Blob**: Length-prefixed, arbitrary bytes.
- **STArray**: Sequence of objects, each with its own Field ID, terminated by Array End Field ID (`0xf1`).
- **STObject**: Sequence of fields in canonical order, terminated by Object End Field ID (`0xe1`).

---

## Length Prefixing

- Some types (e.g., Blob, AccountID) are **length-prefixed**.
- The length prefix is 1–3 bytes, depending on the size:
    - 0–192 bytes: 1 byte
    - 193–12480 bytes: 2 bytes
    - 12481–918744 bytes: 3 bytes

---

## Type List

| Type Name     | Type Code | Bit Length | Length-prefixed? | Description    |
|:--------------|:----------|:-----------|:-----------------|----------------|
| AccountID     | 8         | 160        | Yes              | 20 bytes, length-prefixed if top-level field. |
| Amount        | 6         | 64/384     | No               | 8 bytes for XRP, 8+20+20 for tokens. |
| Blob          | 7         | Variable   | Yes              | Arbitrary bytes, length-prefixed. |
| Hash128       | 4         | 128        | No               | 16 bytes. |
| Hash160       | 17        | 160        | No               | 20 bytes. |
| Hash256       | 5         | 256        | No               | 32 bytes. |
| PathSet       | 18        | Variable   | No               | See [PathSet Fields](#pathset-fields). |
| STArray       | 15        | Variable   | No               | Array of objects, terminated by Array End. |
| STIssue       | 24        | 160/320    | No               | 20 or 40 bytes. |
| STObject      | 14        | Variable   | No               | Object, terminated by Object End. |
| UInt8         | 16        | 8          | No               | 1 byte. |
| UInt16        | 1         | 16         | No               | 2 bytes. |
| UInt32        | 2         | 32         | No               | 4 bytes. |
| UInt64        | 3         | 64         | No               | 8 bytes. |
| Vector256     | 19        | Variable   | Yes              | Array of 32-byte hashes, length-prefixed. |
| XChainBridge  | 25        | Variable   | No               | See [XChainBridge Fields](#xchainbridge-fields). |

---

## Serialization Format: Field-by-Field

### UInt Fields

- **UInt8/16/32/64**: Big-endian unsigned integer, no length prefix.

### AccountID

- 20 bytes, no length prefix.

### Amount

- **XRP**: 8 bytes, most significant bit 0, next bit 1 for positive, remaining 62 bits for value.
- **Token**: 8 bytes (see [Token Amount Format](#token-amount-format)), followed by 20 bytes currency code, 20 bytes issuer.

### Blob

- Length-prefixed, arbitrary bytes.

### STArray

- Start: Array Start Field ID (`0xf0`), no contents.
- Each element: Field ID + serialized object.
- End: Array End Field ID (`0xf1`), no contents.

### STObject

- Start: Object Start Field ID (`0xe0`), no contents.
- Members in canonical order.
- Each: Field ID + value.
- End: Object End Field ID (`0xe1`), no contents.

### PathSet

- 1–6 paths, each 1–8 steps.
- Each step: type byte + fields (account, currency, issuer).
- Path end: `0xff` (more paths) or `0x00` (end).

---

## Using Field Codes and Serialization in Practice

- **Field definitions** (type code, field code, isSerialized, isSigningField, etc.) are centralized in `sfields.macro` and the [definitions file](https://github.com/XRPLF/xrpl.js/blob/main/packages/ripple-binary-codec/src/enums/definitions.json).
- **Transaction types** and their required/optional fields are defined in `transactions.macro`.
- **Ledger entry types** are defined in `ledger_entries.macro`.
- **Serialization code** is generated by macros and implemented in classes such as `STObject`, `STArray`, `STAmount`, etc.

### Example: Serializing a Payment Transaction

1. **Collect all required fields** (e.g., `Account`, `Destination`, `Amount`, `Fee`, `Sequence`, `SigningPubKey`).
2. **For each field:**
    - Get its type code and field code from the definitions.
    - Convert the value to its internal binary format.
3. **Sort fields** by (type code, field code).
4. **For each field:**
    - Write the Field ID (encoded as per [Field IDs](#field-ids)).
    - Write the field's binary value.
5. **Concatenate all fields** to produce the binary blob.

---

## References

- [SField.h](https://github.com/XRPLF/rippled/blob/master/include/xrpl/protocol/SField.h)
- [sfields.macro](https://github.com/XRPLF/rippled/blob/master/include/xrpl/protocol/detail/sfields.macro)
- [STObject.cpp](https://github.com/XRPLF/rippled/blob/develop/src/ripple/protocol/impl/STObject.cpp)
- [definitions.json](https://github.com/XRPLF/xrpl.js/blob/main/packages/ripple-binary-codec/src/enums/definitions.json)
- [Serialization HTML Reference](serialization.html)

---

## Summary Table: Serialization Process

| Step | Action |
|------|--------|
| 1    | Ensure all required fields are present (see transaction/ledger entry definitions) |
| 2    | Convert each field to its internal binary format (see [Type List](#type-list)) |
| 3    | Sort fields by (type code, field code) (see [Canonical Field Order](#canonical-field-order)) |
| 4    | Prefix each field with its Field ID (see [Field IDs](#field-ids)) |
| 5    | Concatenate all fields in order to produce the binary blob |