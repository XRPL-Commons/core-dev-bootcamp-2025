# XRPL Cryptography Quiz - Day 4
**Cryptographic Systems and Security**

## Section A: Key Management (25 points)

### Question 1 (5 points)
**Multiple Choice:** Which cryptographic algorithms does XRPL support for key generation and signing?

a) RSA and DSA only  
b) secp256k1 and ed25519  
c) secp256r1 and RSA  
d) ed25519 and RSA

### Question 2 (5 points)
**Short Answer:** What security measure does the `SecretKey` class destructor implement, and why is this important?

### Question 3 (5 points)
**Multiple Choice:** How many bytes does a compressed secp256k1 public key contain in XRPL?

a) 32 bytes  
b) 33 bytes  
c) 64 bytes  
d) 65 bytes

### Question 4 (5 points)
**True/False:** The `randomSecretKey()` function uses `beast::rngfill` with `crypto_prng()` and performs secure erasure of temporary buffers.

### Question 5 (5 points)
**Short Answer:** Explain the difference between `generateKeyPair()` and `randomKeyPair()` functions. When would you use each?

---

## Section B: Hashing and Digests (25 points)

### Question 6 (5 points)
**Multiple Choice:** What does the `sha512Half()` function return?

a) The first 64 bytes of a SHA-512 hash  
b) The first 32 bytes of a SHA-512 hash  
c) Half of the input data hashed with SHA-512  
d) A 256-bit hash computed using SHA-256

### Question 7 (5 points)
**Short Answer:** Describe what the `ripesha_hasher` computes and where this type of hash is typically used in blockchain systems.

### Question 8 (5 points)
**Multiple Choice:** Which OpenSSL-based hashers are available in XRPL?

a) SHA-256, SHA-512, and MD5  
b) SHA-256, SHA-512, and RIPEMD-160  
c) SHA-1, SHA-256, and SHA-512  
d) SHA-256, RIPEMD-160, and Blake2b

### Question 9 (5 points)
**True/False:** The `sha512Half_s` function variant uses secure erasure of internal state for additional security.

### Question 10 (5 points)
**Short Answer:** Why might XRPL use RIPEMD-160(SHA-256(x)) for address generation instead of just SHA-256?

---

## Section C: Digital Signatures (25 points)

### Question 11 (5 points)
**Multiple Choice:** When signing with secp256k1, what preprocessing is done to the message before signing?

a) The message is signed directly  
b) The message is hashed with SHA-256  
c) The message is hashed with SHA-512 and the first 256 bits are used  
d) The message is encoded with Base58 first

### Question 12 (5 points)
**Short Answer:** Explain the difference between the `sign()` and `signDigest()` functions. What are the security implications of each?

### Question 13 (5 points)
**Multiple Choice:** For ed25519 signatures, how many bytes does the signature contain?

a) 32 bytes  
b) 64 bytes  
c) Variable length (DER encoded)  
d) 72 bytes

### Question 14 (5 points)
**True/False:** The `verify()` function can handle both secp256k1 and ed25519 signatures automatically by detecting the key type from the public key.

### Question 15 (5 points)
**Short Answer:** Why does XRPL use DER encoding for secp256k1 signatures but not for ed25519 signatures?

---

## Section D: Encoding and Security (25 points)

### Question 16 (5 points)
**Multiple Choice:** What does the Base58 token encoding include for integrity verification?

a) A version number only  
b) A type byte and 4-byte checksum  
c) A timestamp and hash  
d) A digital signature

### Question 17 (5 points)
**Short Answer:** Describe the RFC1751 mnemonic encoding process. How does it convert a 16-byte key into English words?

### Question 18 (5 points)
**Multiple Choice:** What function does XRPL use for secure memory erasure?

a) `memset()`  
b) `bzero()`  
c) `OPENSSL_cleanse()`  
d) `SecureZeroMemory()`

### Question 19 (5 points)
**True/False:** The `csprng_engine` uses OpenSSL's `RAND_bytes()` function and includes thread safety mechanisms for older OpenSSL versions.

### Question 20 (5 points)
**Short Answer:** What is the purpose of the `mix_entropy()` function in the CSPRNG, and when might it be called?

---

## Section E: Network Security and SSL/TLS (20 points)

### Question 21 (5 points)
**Multiple Choice:** What is the difference between `make_SSLContext()` and `make_SSLContextAuthed()`?

a) One uses TLS 1.2, the other uses TLS 1.3  
b) One is for anonymous connections, the other requires certificate authentication  
c) One uses RSA, the other uses elliptic curves  
d) One is for servers, the other is for clients

### Question 22 (5 points)
**Short Answer:** In the overlay handshake process, what information is included in the `Session-Signature` header, and how is it generated?

### Question 23 (5 points)
**Multiple Choice:** Which headers are included in the XRPL peer handshake for cryptographic verification?

a) Public-Key and Session-Signature only  
b) Public-Key, Session-Signature, and Network-ID  
c) Public-Key, Session-Signature, Network-ID, and Network-Time  
d) All of the above plus Instance-Cookie and Server-Domain

### Question 24 (5 points)
**Short Answer:** How does the `verifyHandshake()` function validate the integrity of handshake headers received from a peer?

---

## Bonus Questions (10 points)

### Bonus Question 1 (5 points)
**Challenge:** If you were implementing post-quantum cryptography in XRPL, which components would need to be updated, and what would be the main challenges in maintaining backward compatibility?

### Bonus Question 2 (5 points)
**Challenge:** Explain how the deterministic key generation in `generateKeyPair()` ensures that the same seed always produces the same key pair while maintaining cryptographic security.