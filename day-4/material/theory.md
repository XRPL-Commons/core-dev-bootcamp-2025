# Cryptography: Concepts and Functionality

The science of securing information and communications through the use of mathematical techniques

Cryptography is the science of securing information and communications through the use of mathematical techniques. Its primary goals are to ensure **confidentiality**, **integrity**, **authenticity**, and **non-repudiation** of data. Let’s explore the core concepts and ideas that underpin cryptographic systems.

---

## 0. Agenda

- Key Management
- Random Number Generation
- Hashing
- Encoding & Decoding
- Signing and Verification
- Verification
- Secure Memory Handling
- Cryptographic Handshakes
- Summary & Q&A

## 1. **Key Management**

**What:**  
Key management refers to the processes and mechanisms used to generate, distribute, store, rotate, and revoke cryptographic keys.

**Why:**  
Keys are the foundation of cryptographic security. If keys are compromised, the security of the entire system collapses. Proper key management ensures that only authorized parties can access or use the keys, and that keys are changed or destroyed when no longer needed.

**Key Concepts:**
- **Key Generation:** Creating strong, unpredictable keys.
- **Key Distribution:** Securely sharing keys between parties.
- **Key Storage:** Protecting keys from unauthorized access.
- **Key Rotation:** Regularly updating keys to limit exposure.
- **Key Revocation:** Invalidating keys that are no longer secure.

---

## 2. **Random Number Generation**

**What:**  
Random number generation is the process of producing numbers that are unpredictable and lack any discernible pattern.

**Why:**  
Cryptographic systems rely on randomness for key generation, initialization vectors, nonces, and more. Weak or predictable randomness can lead to vulnerabilities, making it easier for attackers to guess keys or other secret values.

**Key Concepts:**
- **True Randomness:** Derived from physical processes (e.g., atmospheric noise).
- **Pseudo-Randomness:** Generated algorithmically, but should be unpredictable if seeded securely.
- **Entropy:** A measure of unpredictability or randomness.

---

## 3. **Hashing**

**What:**  
A hash function takes an input (or "message") and produces a fixed-size string of bytes, typically a digest that appears random.

**Why:**  
Hashing is used to verify data integrity, store passwords securely, and as a building block in many cryptographic protocols. A good hash function is deterministic, fast, and produces outputs that are infeasible to reverse or find collisions for (i.e., two different inputs producing the same output).

**Key Concepts:**
- **Deterministic:** Same input always yields the same output.
- **Pre-image Resistance:** Hard to find an input that hashes to a given output.
- **Collision Resistance:** Hard to find two different inputs with the same hash.
- **Avalanche Effect:** Small changes in input produce vastly different outputs.

---

## 4. **Encoding and Decoding**

**What:**  
Encoding transforms data into a different format using a scheme that is publicly known, while decoding reverses this process.

**Why:**  
Encoding is not encryption; it is used to ensure data can be safely transmitted or stored (e.g., converting binary data to text for email). It does not provide confidentiality, but it ensures compatibility and integrity during transport.

**Key Concepts:**
- **Base64, Hexadecimal:** Common encoding schemes.
- **No Security Guarantee:** Encoding is reversible and not meant for secrecy.

---

## 5. **Signing and Verification**

**What:**  
Digital signing is the process of using a private key to create a unique signature for a message. Verification uses the corresponding public key to confirm the signature’s authenticity.

**Why:**  
Signing provides **authenticity** (proving the sender’s identity), **integrity** (ensuring the message hasn’t been altered), and **non-repudiation** (the sender cannot deny sending the message).

**Key Concepts:**
- **Private Key:** Used to create the signature; must be kept secret.
- **Public Key:** Used to verify the signature; can be shared openly.
- **Signature:** A unique value derived from the message and the private key.
- **Verification:** Confirms that the signature matches the message and public key.

---

## 6. **Verification**

**What:**  
Verification is the process of checking that a signature is valid for a given message and public key.

**Why:**  
Verification ensures that the message was indeed signed by the holder of the private key and that the message has not been tampered with.

**Key Concepts:**
- **Authenticity:** Confirms the sender’s identity.
- **Integrity:** Confirms the message has not changed.
- **Non-repudiation:** Prevents the sender from denying authorship.

---

## 7. **Secure Memory Handling**

**What:**  
Secure memory handling involves protecting sensitive data (like keys and passwords) in memory from unauthorized access or leakage.

**Why:**  
Even if cryptographic algorithms are strong, poor handling of secrets in memory can lead to compromise. Attackers may exploit memory dumps, swap files, or other vulnerabilities to extract secrets.

**Key Concepts:**
- **Zeroization:** Overwriting memory after use to prevent data remnants.
- **Access Controls:** Restricting who or what can access sensitive memory.
- **Isolation:** Keeping sensitive data separate from less secure parts of the system.

---

## 8. **Cryptographic Handshakes**

**What:**  
A cryptographic handshake is a process by which two parties establish a secure communication channel, often negotiating keys and verifying each other’s identities.

**Why:**  
Handshakes ensure that both parties agree on cryptographic parameters and that the communication is protected from eavesdropping or tampering from the outset.

**Key Concepts:**
- **Mutual Authentication:** Both parties prove their identities.
- **Key Exchange:** Securely establishing shared keys for encryption.
- **Session Establishment:** Setting up a secure, temporary communication context.
- **Protection Against MITM:** Ensuring no attacker can intercept or alter the handshake.

---

# **Summary**

Cryptography is a multi-faceted discipline that secures digital communications and data. Its effectiveness depends not just on strong algorithms, but on the careful management of keys, the use of true randomness, the integrity of hash functions, the proper handling of sensitive data, and robust protocols for establishing trust and secure channels. Signing and verification are central to ensuring authenticity and integrity, while secure handshakes and memory handling protect against a wide range of attacks. Understanding these concepts is essential for building and maintaining secure systems.