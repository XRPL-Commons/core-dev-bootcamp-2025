Ways a node receives transactions

Transaction Processing:

1. RPC Submit
- doSubmit: The rpc receives the transaction.
- NetworkOPsImp::processTransaction: Process transaction
- NetworkOPsImp::transactionBatch

2. Peers

- PeerImp::onMessage
- PeerImp::handleTransaction
- PeerImp::checkTransaction
- NetworkOPsImp::processTransaction: Process transaction

3. Processing Received (RPC/Peer) Transaction

- doTransactionSync
- doTransactionSyncBatch
- NetworkOPsImp::apply
- app_.getTxQ().apply
- tryDirectApply
- ripple::apply: preflight, preclaim, doApply
- app_.overlay().relay: relayed to the network