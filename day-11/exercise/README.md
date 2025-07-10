# XRPL Amendment Voting Exercise Guide

## Exercise 1: Amendment Discovery

### Step 1: Use the Hex Visualizer Tool

1. **Navigate to the hex visualizer**:
   ```
   https://transia-rnd.github.io/xrpl-hex-visualizer/
   ```

2. **Input "RecurringPayments" to get amendment hash**:
   ```
   3B95AC1581B355A45AC47DDFA65BE283519CD444B455A9719A1CAE6DE5A1E7A4
   ```

3. **Explore the amendment details** - this will show you how the amendment name "RecurringPayments" gets hashed to produce the amendment identifier.

### Step 2: Understanding Amendment Hashing

The amendment hash is created by hashing the amendment name. For example:
- **Amendment Name**: `RecurringPayments`
- **Amendment Hash**: `3B95AC1581B355A45AC47DDFA65BE283519CD444B455A9719A1CAE6DE5A1E7A4`

This hash is what the XRPL network uses to identify and track amendments.

## Exercise 2: Connect to XRPL Nodes

### Available Node Endpoints

Choose one of these nodes for your connection:

| Node | JSON-RPC Port | WebSocket Port |
|------|---------------|----------------|
| IP1  | 79.110.60.99:5105 | 79.110.60.99:6106 |
| IP2  | 79.110.60.100:5205 | 79.110.60.100:6206 |
| IP3  | 79.110.60.101:5305 | 79.110.60.101:6306 |
| IP4  | 79.110.60.102:5405 | 79.110.60.102:6406 |
| IP5  | 79.110.60.103:5505 | 79.110.60.103:6506 |
| IP6  | 79.110.60.104:5605 | 79.110.60.104:6606 |

### Web Explorer Access

Use this URL to access the command interface:
```
https://explorer.xrplf.org/ws:79.110.60.100:6206/command
```

## Exercise 3: Query Amendment Status

### Execute the Feature Command

In the web explorer, run:
```json
{
  "command": "feature"
}
```

### Look for RecurringPayments Amendment

Find this entry in the response:
```json
{
  "3B95AC1581B355A45AC47DDFA65BE283519CD444B455A9719A1CAE6DE5A1E7A4": {
    "count": 0,
    "enabled": false,
    "name": "RecurringPayments",
    "supported": true,
    "threshold": 1,
    "validations": 1,
    "vetoed": true
  }
}
```

### Status Field Meanings

- **count**: Current number of validator votes
- **enabled**: Whether amendment is active
- **name**: Human-readable amendment name
- **supported**: This node supports the amendment
- **threshold**: Votes needed for activation
- **validations**: Total validators in network
- **vetoed**: Whether amendment is vetoed

## Exercise 4: Cast Your Vote

### Run the Vote Script
```bash
ts-node src/amendment/vote.ts
```

This will:
- Connect to your XRPL node
- Submit a vote for RecurringPayments amendment
- Display transaction results

### Verify Your Vote

Return to the web explorer and re-run:
```json
{
  "command": "feature"
}
```

You should see:
```json
{
  "3B95AC1581B355A45AC47DDFA65BE283519CD444B455A9719A1CAE6DE5A1E7A4": {
    "count": 1,          // ← Increased from 0
    "enabled": false,
    "name": "RecurringPayments",
    "supported": true,
    "threshold": 1,
    "validations": 1,
    "vetoed": false      // ← Changed from true
  }
}
```

## Amendment Activation Requirements

For activation, an amendment needs:
- ≥80% of trusted validators voting for it
- Sustained support for ≥2 weeks (2 flag ledgers)
- No vetoes from trusted validators

## Amendment Majority Status

When 80% threshold is reached, you'll see a `majority` field appear:

```json
{
  "3B95AC1581B355A45AC47DDFA65BE283519CD444B455A9719A1CAE6DE5A1E7A4": {
    "count": 1,
    "enabled": false,
    "majority": 805385181,    // ← XRPL Time when majority was reached
    "name": "RecurringPayments",
    "supported": true,
    "threshold": 1,
    "validations": 1,
    "vetoed": false
  }
}
```

### Majority Field Significance

- **majority**: The ledger sequence number when ≥80% support was first achieved
- This starts the 2-week countdown to activation
- Amendment will activate after 2 flag ledgers (approximately 2 weeks)
- If support drops below 80%, the majority field disappears

## Amendment Activation Process

### EnableAmendment Pseudo Transaction

After the 2-week majority period, the network automatically creates an EnableAmendment pseudo transaction:

```json
[
  {
    "hash": "491378DA1BAAE870A6C247B3E42193E80E507A50858A4E51217685E2765E6CE8",
    "type": "EnableAmendment",
    "Account": "rrrrrrrrrrrrrrrrrrrrrhoLvTp"
  }
]
```

### Final Enabled State

Once the EnableAmendment pseudo transaction is processed, the feature command will show:

```json
{
  "3B95AC1581B355A45AC47DDFA65BE283519CD444B455A9719A1CAE6DE5A1E7A4": {
    "enabled": true,        // ← Amendment is now active
    "name": "RecurringPayments",
    "supported": true
  }
}
```

Note that once enabled, the amendment status simplifies to just show:
- **enabled**: `true` (amendment is active)
- **name**: The amendment name
- **supported**: Whether this node supports it

## Troubleshooting

### Connection Issues
- Verify IP address and port
- Try different node endpoints
- Check network connectivity

### Vote Not Appearing
- Wait for next flag ledger
- Re-query feature status
- Verify transaction success

### Amendment Not Activating
- Check threshold requirements
- Verify no vetoes exist
- Wait for required time period

## Key Takeaways

1. **Amendment Discovery**: Use the hex visualizer to understand how amendment names become hashes
2. **Network Querying**: The `feature` command shows all amendment statuses
3. **Voting Process**: Validators vote through special transactions
4. **Activation Timeline**: Amendments need sustained support over time
5. **Majority Tracking**: The `majority` field indicates when 80% threshold was reached
6. **Pseudo Transaction**: The network automatically creates EnableAmendment transactions
7. **Final State**: Enabled amendments show a simplified status structure
8. **Collaborative Process**: Network consensus requires coordination among validators