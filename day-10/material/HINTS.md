## Hints

Escrow.cpp: Token/MPT Implementation For Locking/Unlocking
PayChan.cpp: Has claim information for creating and authorizing payment channel claims.

## Testing

1. Test Preflight, Preclaim & DoApply
2. Name your test file RecurringPayments_test.cpp
3. Put all your helper functions at the top of the file

Example

Json::Value
recurringPaymentSet(jtx::Account const& account)
{
    Json::Value jv;
    jv[jss::TransactionType] = jss::RecurringPaymentSet;
    jv[jss::Account] = to_string(account.id());
    return jv;
}

recurringPaymentSet()

## How I do it.

https://github.com/XRPLF/rippled/pull/5136

1. Create Feature
2. Add any transactions, ledger entries and sfields.
    - transactions.macro
    - ledger.entries.marco
    - sfields.macro
3. Transaction Files: RecurringPaymentSet.cpp/h etc
    - Create with return tesSUCCESS preflight, preclaim, do apply
4. Create Test File: RecurringPayment_test.cpp
5. Create Test Helpers: recurringPaymentSet()
6. Create testEnabled()
