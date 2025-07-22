# Rippled Validator Keys Exercise

## Part 1: Building Rippled with Validator Keys Support

### Step 1: Configure the Build
First, you'll need to build rippled with validator keys support enabled:

```bash
cmake -G Ninja \
    -DCMAKE_TOOLCHAIN_FILE:FILEPATH=build/generators/conan_toolchain.cmake \
    -DCMAKE_CXX_FLAGS=-DBOOST_ASIO_HAS_STD_INVOKE_RESULT \
    -DCMAKE_BUILD_TYPE=Debug \
    -DUNIT_TEST_REFERENCE_FEE=200 \
    -Dtests=TRUE \
    -Dxrpld=TRUE \
    -Dstatic=OFF \
    -Dassert=TRUE \
    -Dwerr=TRUE \
    -Dvalidator_keys=ON \
    ..
```

### Step 2: Build the Validator Keys Tool
```bash
cmake --build . --target validator-keys --parallel 10
```

## Part 2: Understanding the Validator Key Architecture

### Security Model Overview
The validator uses a **master private key** to:
1. Sign tokens that authorize rippled servers to operate as this validator
2. Sign revocations if the key is compromised

Key principles:
- Each new token invalidates all previous tokens
- The current token must be present in the rippled config
- Servers automatically adapt when tokens change
- There's a hard limit of 4,294,967,293 tokens per key pair

## Part 3: Initial Validator Setup

### Step 1: Generate Master Keys
Create your validator's master key pair:

```bash
cd validator-keys && ./validator-keys create_keys
```

Expected output:
```
Validator keys stored in /home/ubuntu/.ripple/validator-keys.json
```

### Step 2: Generate Your First Token
Create a validator token for your rippled server:

```bash
validator-keys create_token
```

Expected output:
```
Update rippled.cfg file with these values:

# validator public key: nHUtNnLVx7odrz5dnfb2xpIgbEeJPbzJWfdicSkGyVw1eE5GpjQr

[validator_token]
eyJ2YWxpZGF0aW9uX3NlY3J|dF9rZXkiOiI5ZWQ0NWY4NjYyNDFjYzE4YTI3NDdiNT
QzODdjMDYyNTkwNzk3MmY0ZTcxOTAyMzFmYWE5Mzc0NTdmYT|kYWY2IiwibWFuaWZl
c3QiOiJKQUFBQUFGeEllMUZ0d21pbXZHdEgyaUNjTUpxQzlnVkZLaWxHZncxL3ZDeE
hYWExwbGMyR25NaEFrRTFhZ3FYeEJ3RHdEYklENk9NU1l1TTBGREFscEFnTms4U0tG
bjdNTzJmZGtjd1JRSWhBT25ndTlzQUtxWFlvdUorbDJWMFcrc0FPa1ZCK1pSUzZQU2
hsSkFmVXNYZkFpQnNWSkdlc2FhZE9KYy9hQVpva1MxdnltR21WcmxIUEtXWDNZeXd1
NmluOEhBU1FLUHVnQkQ2N2tNYVJGR3ZtcEFUSGxHS0pkdkRGbFdQWXk1QXFEZWRGdj
VUSmEydzBpMjFlcTNNWXl3TFZKWm5GT3I3QzBrdzJBaVR6U0NqSXpkaXRROD0ifQ==
```

### Step 3: Update Your Configuration
Add the `[validator_token]` section to your `rippled.cfg` file and restart rippled.

**Exercise Tasks**:
1. What information is encoded in the validator token?
2. How would you verify that your validator is properly configured?
3. What happens if you try to use an old token after generating a new one?

### Step 4: Examining Token Contents
To understand what's inside your validator token, you can use the XRPL Binary Visualizer:

1. Copy your validator token (the long base64 string from the `[validator_token]` section)
2. Navigate to https://richardah.github.io/xrpl-binary-visualizer/
3. Paste the token into the visualizer to decode and examine its contents
4. This will show you the internal structure including the manifest and validation secret key

## Part 4: Token Management and Rotation

### Scenario: Routine Token Rotation
You should periodically rotate your validator tokens for security. Generate a new token:

```bash
validator-keys create_token
```

**Exercise Tasks**:
1. Update your rippled.cfg with the new token
2. Restart rippled
3. Verify that other servers still recognize your validator
4. What happens to the old token?

## Part 5: Key Revocation (Emergency Scenario)

### When to Revoke
Revoke your validator keys if:
- Your master private key is compromised
- You suspect unauthorized access to your key storage
- You're permanently retiring the validator

### Revocation Process
⚠️ **WARNING**: This action is irreversible and permanently disables your validator identity.

```bash
validator-keys revoke_keys
```

Expected output:
```
WARNING: This will revoke your validator keys!

Update rippled.cfg file with these values and restart rippled:

# validator public key: nHUtNnLVx7odrz5dnfb2xpIgbEeJPbzJWfdicSkGyVw1eE5GpjQr

[validator_key_revocation]
JP////9xIe0hvssbqmgzFH4/NDp1z|3ShkmCtFXuC5A0IUocppHopnASQN2MuMD1Puoyjvnr
jQ2KJSO/2tsjRhjO6q0QQHppslQsKNSXWxjGQNIEa6nPisBOKlDDcJVZAMP4QcIyNCadzgM=
```

### Post-Revocation Steps
1. Add the `[validator_key_revocation]` section to your config
2. Restart rippled
3. Securely destroy the old key file
4. If continuing as a validator, generate new keys and start over