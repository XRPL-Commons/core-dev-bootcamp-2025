<pre>
Title:       <b>XLS-??d RPA</b>
Authors:     <a href="mailto:xrpl365@gmail.com">Chris Dangerfield</a>
             <a href="mailto:dangell@transia.co">Denis Angell</a>
</pre>


# Recurring Payment Authorizations (RPA)

## Abstract

This proposal introduces a Recurring Payment Authorization (RPA) mechanism to the XRP Ledger (XRPL), enabling recurring payments with optional fund locking and flexible claim logic. The RPA system allows for both destination-based and open claims (with signature verification), supporting multiple claims per period up to a user-defined limit. Locked funds can be added by the account owner to guarantee availability for claims.

## Motivation and Rationale

Current XRPL payment flows require the sender to sign each transaction, which is impractical for recurring payments. Off-chain solutions exist, but they still require user authorization for each payment. This proposal enables on-ledger recurring payments, with optional fund locking for guaranteed availability, and supports both fixed-destination and open-claim models.

## Amendment

This feature enables account owners to authorize automated recurring payments with predefined parameters such as amount, frequency, and destination, with optional fund locking and flexible claim logic.

The amendment adds the following:

- A new ledger entry: `RecurringPayment`
- A new transaction type: `RecurringPaymentSet`
- A new transaction type: `RecurringPaymentCancel`
- A new transaction type: `RecurringPaymentClaim`
- A new transaction type: `RecurringPaymentLock`
- A new transaction type: `RecurringPaymentUnlock`

---

## Ledger Entry: `RecurringPayment`

The `RecurringPayment` ledger entry stores the details of the recurring payment, including the destination address (optional), the maximum allowable amount per period, the frequency, the next reset time, the amount claimed in the current period, the amount of locked funds, and (if no destination) the public key for open claims.

| Field                | Type      | Required | Description                                                                                                                      |
|----------------------|-----------|----------|----------------------------------------------------------------------------------------------------------------------------------|
| sfAccount            | AccountID | ✔️       | The account that owns the recurring payment.                                                                                     |
| sfDestination        | AccountID |          | The account authorized to receive the recurring payments. Optional.                                                              |
| sfDestinationTag     | Number    |          | Support for payment categorization by the Destination.                                                                           |
| sfAmount             | Amount    | ✔️       | The maximum amount that can be withdrawn during each time period.                                                                |
| sfFrequency          | UInt64    | ✔️       | The time period (in seconds) between consecutive resets (e.g., 2592000 for monthly).                                             |
| sfNextResetTime      | UInt32    | ✔️       | The next time (Ripple epoch time) the period resets.                                                                             |
| sfExpiration         | UInt32    |          | The time (Ripple epoch time) of the last payment. Allows for optional fixed period payments.                                     |
| sfClaimedThisPeriod  | Amount    | ✔️       | The total amount claimed in the current period.                                                                                  |
| sfLockedFunds        | Amount    | ✔️       | The total amount of funds currently locked for this recurring payment.                                                           |
| sfPublicKey          | Blob      | *        | **Required if no Destination is set. The public key of the account owner, used for signature verification on open claims.**      |
| sfFlags              | UInt32    |          | Bitwise flags. (Reserved for future use.)                                                                                        |

> **Note:**  
> - If `sfDestination` is omitted, `sfPublicKey` **must** be present and is stored in the ledger entry.
> - If `sfDestination` is present, `sfPublicKey` is not required.

#### **RecurringPaymentID**

The `RecurringPayment` object ID is the SHA-512Half of:

- The RecurringPayment space key (0x00??)
- The Account ID
- The Destination ID (or 0 if not present)
- The Txn Sequence

---

## Transaction Types

### 1. `RecurringPaymentSet`

Used to create or update a recurring payment.

| Field                | Type      | Required | Description                                                                                              |
|----------------------|-----------|----------|----------------------------------------------------------------------------------------------------------|
| sfTransactionType    | String    | ✔️       | The type of transaction: `RecurringPaymentSet`.                                                          |
| sfAccount            | AccountID | ✔️       | The account creating the recurring payment.                                                              |
| sfDestination        | AccountID |          | The account authorized to receive the recurring payments. Optional.                                      |
| sfDestinationTag     | Number    |          | A destination tag to be associated with the payment.                                                     |
| sfAmount             | Amount    | ✔️       | The maximum amount that can be withdrawn during each time period.                                        |
| sfFrequency          | UInt64    | ✔️       | The time period (in seconds) between consecutive resets.                                                 |
| sfStartTime          | UInt32    |          | (Optional) The time (Ripple epoch time) when the recurring payment starts. If not set, starts immediately.|
| sfExpiration         | UInt32    |          | (Optional) The time (Ripple epoch time) when the recurring payment ends.                                 |
| sfRecurringPaymentID | Hash256   |          | (Optional) Used for updating a recurring payment.                                                        |
| sfPublicKey          | Blob      | *        | **Required if no Destination is set. The public key of the account owner.**                              |
| sfFlags              | UInt32    |          | Bitwise flags. (Reserved for future use.)                                                                |

#### **Failure Conditions (Create/Update)**

- If `sfDestination` is omitted, `sfPublicKey` **must** be present and must match the account's master or regular key.
- `Destination` is the same as `Account`.
- `Amount` is invalid OR <= 0.
- `Frequency` <= SYSTEM_MINIMUM.
- `RecurringPayment` ledger entry exists (on create).
- `RecurringPayment` ledger entry does not exist (on update).
- `Account` does not have a valid Trustline (if IOU).
- `StartTime` is less than the current time.
- `Expiration` is less than the current time.
- `Expiration` is less than the `StartTime`.
- `Expiration` is less than the `NextResetTime`.
- `RecurringPaymentID` submitted and `Amount` not present or optional `Expiration` not present.

#### **State Changes (Create/Update)**

- Creates or updates the `RecurringPayment` ledger entry, initializing or updating all the fields.
- If `StartTime` is included, `NextResetTime` is set to `StartTime`.
- If `StartTime` is not included, `NextResetTime` is set to the current ledger time.
- `ClaimedThisPeriod` is set to 0 on create.

---

### 2. `RecurringPaymentLock`

Used to add locked funds to a recurring payment. Locked funds are reserved for claims and cannot be spent by the account except via claims or unlock.

| Field                | Type      | Required | Description                                                                                 |
|----------------------|-----------|----------|---------------------------------------------------------------------------------------------|
| sfTransactionType    | String    | ✔️       | The type of transaction: `RecurringPaymentLock`.                                            |
| sfAccount            | AccountID | ✔️       | The account adding locked funds.                                                            |
| sfRecurringPaymentID | Hash256   | ✔️       | The unique identifier of the recurring payment to add locked funds to.                      |
| sfAmount             | Amount    | ✔️       | The amount to lock.                                                                         |

#### **Failure Conditions**

- RecurringPayment ledger entry does not exist for RecurringPaymentID.
- `Account` is not the owner of the RecurringPayment.
- `Amount` is invalid or <= 0.
- `Account` has insufficient spendable funds (excluding already locked funds and reserves).
- `Amount` (type) does not equal `RecurringPayment` `Amount` (type).

#### **State Changes**

- Deducts the specified `Amount` from the account's spendable balance.
- Increases `sfLockedFunds` in the `RecurringPayment` ledger entry by the specified `Amount`.

---

### 3. `RecurringPaymentUnlock`

Used to unlock (withdraw) previously locked funds from a recurring payment, returning them to the owner's spendable balance.

| Field                | Type      | Required | Description                                                                                 |
|----------------------|-----------|----------|---------------------------------------------------------------------------------------------|
| sfTransactionType    | String    | ✔️       | The type of transaction: `RecurringPaymentUnlock`.                                          |
| sfAccount            | AccountID | ✔️       | The account unlocking funds.                                                                |
| sfRecurringPaymentID | Hash256   | ✔️       | The unique identifier of the recurring payment to unlock funds from.                        |
| sfAmount             | Amount    | ✔️       | The amount to unlock.                                                                       |

#### **Failure Conditions**

- RecurringPayment ledger entry does not exist for RecurringPaymentID.
- `Account` is not the owner of the RecurringPayment.
- `Amount` is invalid or <= 0.
- `sfLockedFunds` < `Amount`.
- `Amount` (type) does not equal `RecurringPayment` `Amount` (type).

#### **State Changes**

- Decreases `sfLockedFunds` in the `RecurringPayment` ledger entry by the specified `Amount`.
- Credits the specified `Amount` to the account's spendable balance.

---

### 4. `RecurringPaymentCancel`

Used to cancel an existing recurring payment. Must be signed by the account that created the payment or the destination (if present).

| Field                | Type      | Required | Description                                               |
|----------------------|-----------|----------|-----------------------------------------------------------|
| sfTransactionType    | String    | ✔️       | The type of transaction: `RecurringPaymentCancel`.        |
| sfAccount            | AccountID | ✔️       | The account that created the recurring payment.           |
| sfRecurringPaymentID | Hash256   | ✔️       | The unique identifier of the recurring payment to cancel. |

#### **Failure Conditions**

- `RecurringPaymentID` does not exist.
- `Account` is not the owner or the destination of the `RecurringPayment`.

#### **State Changes**

- Removes the `RecurringPayment` ledger entry.
- Any remaining `sfLockedFunds` are returned to the account's spendable balance.

---

### 5. `RecurringPaymentClaim`

Used to claim funds from a recurring payment. If `Destination` is present, only that account may claim. If not, any account may claim by providing a valid signature.

| Field                | Type      | Required | Description                                                                                 |
|----------------------|-----------|----------|---------------------------------------------------------------------------------------------|
| sfTransactionType    | String    | ✔️       | The type of transaction: `RecurringPaymentClaim`.                                           |
| sfAccount            | AccountID | ✔️       | The account claiming the payment.                                                           |
| sfRecurringPaymentID | Hash256   | ✔️       | The unique identifier of the recurring payment being claimed.                               |
| sfAmount             | Amount    | ✔️       | The amount being claimed, must not exceed the remaining authorized amount for the period.   |
| sfDestination        | AccountID |          | (Optional) The destination for the claim, if not set in the RecurringPayment.               |
| sfSignature          | Blob      |          | (Required if no Destination in RecurringPayment) Signature over (Amount, Destination, ID).  |

#### **Signature Verification (Open Claims)**

If the `RecurringPayment` has no `Destination`, the claim must include:

- `sfDestination`: The intended recipient.
- `sfSignature`: A signature by the `Account` (owner of the RecurringPayment) over the message:  
  `sha512(Amount || Destination || RecurringPaymentID)`

The public key for verification is taken from the `sfPublicKey` field in the `RecurringPayment` ledger entry.

**No `sfPublicKey` is present on the claim transaction.**

#### **Failure Conditions**

- RecurringPayment ledger entry does not exist for RecurringPaymentID.
- If `Destination` is present in the RecurringPayment, `Account` is not the destination.
- If `Destination` is not present, signature verification fails.
- `Amount` is < 0.
- `Amount` (type) does not equal `RecurringPayment` `Amount` (type).
- `ClaimedThisPeriod + Amount` exceeds the authorized amount for the period.
- `sfLockedFunds` < `Amount`.
- Current time is after `Expiration`.
- Current time is before `NextResetTime` (if first claim in period).

#### **State Changes**

- If current time >= `NextResetTime`, reset `ClaimedThisPeriod` to 0 and set `NextResetTime` to `NextResetTime + Frequency` (repeat until in future).
- Add `Amount` to `ClaimedThisPeriod`.
- Deduct the specified `Amount` from `sfLockedFunds` in the `RecurringPayment` ledger entry.
- Credit the specified `Amount` to the destination account.
- Remove the `RecurringPayment` ledger object if time > `Expiration` (and return any remaining locked funds to the owner).

---

## Zero Value Claims

A zero value claim is not a failure condition; no value is transferred but the `ClaimedThisPeriod` and `NextResetTime` fields are updated as appropriate.

---

## Transaction Fees & Reserves

All transactions incur standard XRPL fees. The `RecurringPayment` ledger entry increases the account's reserve by the standard amount for ledger objects.

---

## Key Points

- **Multiple Claims per Period:** Claims can be made multiple times per period, up to the maximum authorized amount.
- **Period Reset:** At each claim, if the current time is past `NextResetTime`, the period resets and `ClaimedThisPeriod` is set to 0.
- **Fund Locking:** Locked funds are added via `RecurringPaymentLock` and are reserved for claims. They can be unlocked by the owner at any time using `RecurringPaymentUnlock`.
- **Open Claims:** If no destination is set, claims require a valid signature from the account owner, verified using the public key stored in the ledger entry. The public key is **not** included on the claim transaction.

---

## FAQ

### Why allow multiple claims per period?

This supports use cases where the beneficiary needs to pull funds in increments (e.g., pay-as-you-go, metered services), up to the authorized limit.

### How does fund locking work?

Locked funds are added by the account owner using `RecurringPaymentLock`. Only locked funds can be claimed. Unclaimed locked funds remain available for future claims or are returned to the owner upon cancellation or expiration. The owner can also unlock funds at any time using `RecurringPaymentUnlock`.

### How are open claims secured?

If no destination is set, the claim must be signed by the account owner, authorizing the amount, destination, and RecurringPaymentID. The public key for verification is stored in the ledger entry and is **not** included on the claim transaction.

### How does the period reset?

At each claim, if the current time is past `NextResetTime`, the period resets: `ClaimedThisPeriod` is set to 0, and `NextResetTime` is incremented by `Frequency` (repeated as needed).

---

## Example: Open RPA (no destination)

#### On creation (`RecurringPaymentSet`):

```json
{
  "TransactionType": "RecurringPaymentSet",
  "Account": "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
  "Amount": "100000000",
  "Frequency": 2592000,
  "PublicKey": "ED5F...A1B2" // Required if no Destination
}