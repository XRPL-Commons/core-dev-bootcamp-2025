# Running Rippled in Standalone Mode

## Step 1: Copy Configuration Files

After successfully building rippled, you need to copy the configuration files to the build directory:

```bash
# Navigate to your build directory (if not already there)
cd ~/projects/rippled/build

# Copy the configuration folder
cp ../config -r ./config/

# Alternative: Create the config directory if it doesn't exist
mkdir -p config
cp ../config/* ./config/
```

## Step 2: Run Standalone Mode

Choose one of the following options based on your needs:

### Basic Standalone Mode
```bash
./rippled -a --conf ./config/rippled.cfg
```

### Standalone Mode with Genesis Ledger
```bash
./rippled -a --conf ./config/rippled.cfg --ledgerfile ./config/genesis.json
```

**Command Breakdown:**
- `-a` or `--standalone`: Runs rippled in standalone mode (no network consensus)
- `--config`: Specifies the configuration file path
- `ledger_file`: (Optional) Loads a specific genesis ledger state

## Step 3: Verify Rippled is Running

Once started, rippled should display startup logs. Look for:
- Server initialization messages
- Port binding confirmations (typically WebSocket on port 6008, JSON-RPC on port 5005)
- "Application starting" or similar success messages

## Standalone Mode Interactions

### Launch XRPL Explorer

1. **Setup the Local Explorer**:
   ```bash
   # Open a new terminal session
   cd ~/core-dev-bootcamp-2025/explorer
   
   # Install dependencies (if not already done)
   npm install
   ```

2. **Start the Explorer**:
   ```bash
   npm run serve
   ```

3. **Open the Explorer**: Navigate to http://localhost:8080/
   - This connects the web-based explorer to your local rippled instance
   - The explorer will show real-time ledger data and transactions

4. **Verify Connection**: 
   - The explorer should show "Waiting for the next ledger to close..." status
   - Standalone does not make forward progress. You can make your own forward progress by pressing the "Close Ledger" button.
   - If connection fails, ensure rippled is running and ports are accessible

### Using the Explorer Command Interface

The XRPL Explorer provides a convenient web interface for sending commands to your rippled node:

1. **Access the Command Interface**: 
   - Navigate to http://localhost:8080/command (or click the command interface link in the explorer)
   - This opens the command console interface

2. **Execute Server Commands**: 
   You can enter rippled API commands directly in the web interface:

   ```json
   // Check server status
   {
     "command": "server_info"
   }
   ```

   ```json
   // Get current ledger information
   {
     "command": "ledger",
     "ledger_index": "current"
   }
   ```

   ```json
   // Check account information (replace with actual address)
   {
     "command": "account_info",
     "account": "rAccount..."
   }
   ```

3. **Common Commands to Try**:
   - `server_info` - View server status and configuration
   - `ledger_current` - Get current ledger index
   - `account_currencies` - List currencies for an account
   - `gateway_balances` - View gateway balances
   - `book_offers` - Check order book offers

4. **Web Socket API Tool**

   - https://xrpl.org/resources/dev-tools/websocket-api-tool#subscribe

### Playground Setup and Usage

#### Navigate to Playground Directory
```bash
# Open a new terminal session
cd ~/core-dev-bootcamp-2025/playground

# Install dependencies (if not already done)
yarn install
```

#### Connect to Your Local Node
```bash
ts-node src/connect.ts
```

**Expected Output:**
- Connection confirmation to localhost:6008
- Server information (version, ledger index, etc.)
- Network ID and other node details

#### Fund Test Accounts
```bash
ts-node src/fund.ts
```

**What This Does:**
- Creates new test accounts with XRP funding
- In standalone mode, you can generate XRP without constraints
- Displays account addresses and balances
- Copy these addresses to use in the Explorer command interface

#### Monitor Activity in Explorer
After running the fund script:
1. **Go to the Main Explorer**: http://localhost:8080/
2. **Check Recent Transactions**: You should see the funding transactions
3. **Use the Command Interface**: Go to `/command` and query the funded accounts:
   ```json
   {
     "method": "account_info",
     "params": [{"account": "rYourFundedAccountAddress"}]
   }
   ```
4. **Monitor Ledger Changes**: Watch as new ledgers close with your transactions

#### Using Command Interface for Testing
After creating test accounts and transactions, use the Explorer's `/command` interface to:

1. **Query Transaction History**:
   ```json
   {
     "command": "account_tx",
     "account": "rYourAccountAddress"
   }
   ```

2. **Check Account Lines**:
   ```json
   {
     "command": "account_lines",
     "account": "rYourAccountAddress"
   }
   ```

3. **Validate Transactions**:
   ```json
   {
     "command": "tx",
     "transaction": "YourTransactionHash"
   }
   ```

## Alternative Command Methods

### Using cURL (Command Line)
```bash
# Check server status
curl -X POST http://localhost:5005 -d '{"method": "server_info"}'

# Get ledger information
curl -X POST http://localhost:5005 -d '{"method": "ledger", "params": [{"ledger_index": "current"}]}'

# List account info
curl -X POST http://localhost:5005 -d '{"method": "account_info", "params": [{"account": "rAccount..."}]}'
```

### Using WebSocket (Advanced)
```javascript
// Connect via WebSocket for real-time data
const ws = new WebSocket('ws://localhost:6008');
ws.on('open', () => {
  ws.send(JSON.stringify({
    "method": "subscribe",
    "streams": ["ledger"]
  }));
});
```