- doSubmit: The rpc receives the transaction.
- NetworkOPsImp::processTransaction: Process transaction
- doTransactionSync
- doTransactionSyncBatch
- NetworkOPsImp::apply
- app_.getTxQ().apply
- tryDirectApply
- ripple::apply: preflight, preclaim, doApply
- app_.overlay().relay: relayed to the network

Ways a node receives transactions

1. RPC Submit
2. Peers