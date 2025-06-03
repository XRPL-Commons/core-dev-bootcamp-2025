# XRPL Overlay Peering Quiz - Day 5
**Overlay Network and Peer-to-Peer Communication**

## Section A: Overlay Architecture and Components (25 points)

### Question 1 (5 points)
**Multiple Choice:** What is the XRPL overlay network?

a) A physical network infrastructure  
b) A collection of peers forming a connected directed graph layered on top of the Internet  
c) A centralized server managing all peer connections  
d) A blockchain stored across multiple nodes

### Question 2 (5 points)
**Short Answer:** Explain the relationship between the `Peer`, `PeerImp`, and `OverlayImpl` classes. What role does each play in the overlay system?

### Question 3 (5 points)
**Multiple Choice:** What serialization method does XRPL use for protocol messages between peers?

a) JSON  
b) XML  
c) Google Protocol Buffers  
d) Binary custom format

### Question 4 (5 points)
**True/False:** Each connection in the XRPL overlay network is bidirectional and represents a single Peer object on both sides.

### Question 5 (5 points)
**Short Answer:** What is the significance of maintaining wire compatibility when modifying protocol buffer definitions in XRPL?

---

## Section B: Connection Establishment and Handshake (25 points)

### Question 6 (5 points)
**Multiple Choice:** What is the correct order of steps in `OverlayImpl::connect` for establishing an outbound connection?

a) Create ConnectAttempt → Resource check → PeerFinder slot → Start connection  
b) Resource check → PeerFinder slot → Create ConnectAttempt → Start connection  
c) PeerFinder slot → Resource check → Create ConnectAttempt → Start connection  
d) Start connection → Resource check → Create ConnectAttempt → PeerFinder slot

### Question 7 (5 points)
**Short Answer:** Describe what happens during the HTTP upgrade and handshake process between two XRPL peers. What cryptographic verification occurs?

### Question 8 (5 points)
**Multiple Choice:** What method does `PeerImp` call to register itself as an active peer in the overlay?

a) `overlay_.register_peer()`  
b) `overlay_.add_active()`  
c) `overlay_.activate()`  
d) `overlay_.connect_peer()`

### Question 9 (5 points)
**True/False:** Inbound connections use `doAccept()` while outbound connections use `doProtocolStart()` after the handshake phase.

### Question 10 (5 points)
**Short Answer:** What information is exchanged in the handshake headers, and how does this information help establish the peer relationship?

---

## Section C: PeerFinder and Bootstrapping (30 points)

### Question 11 (5 points)
**Multiple Choice:** What is the correct connection preference order in PeerFinder bootstrapping?

a) Bootcache → Livecache → Fixed Peers  
b) Livecache → Fixed Peers → Bootcache  
c) Fixed Peers → Livecache → Bootcache  
d) Fixed Peers → Bootcache → Livecache

### Question 12 (10 points)
**Short Answer:** Explain the difference between Livecache and Bootcache in PeerFinder. What type of addresses does each contain, and when is each used?

### Question 13 (5 points)
**Multiple Choice:** What is special about cluster slot connections?

a) They have higher priority for message routing  
b) They do not count toward connection limits  
c) They use different cryptographic protocols  
d) They are automatically encrypted

### Question 14 (5 points)
**True/False:** When a peer receives an Endpoint message with hop count zero, it performs an incoming connection test to verify the address is connectable before forwarding it.

### Question 15 (5 points)
**Short Answer:** What is the purpose of the `ipLimit` configuration option in PeerFinder, and how does it contribute to network security?

---

## Section D: Message Relaying and Squelching (25 points)

### Question 16 (5 points)
**Multiple Choice:** What does the `OverlayImpl::relay` method consult before relaying a proposal message?

a) PeerFinder slot availability  
b) HashRouter to check if the message should be relayed  
c) Resource manager limits  
d) SSL/TLS connection status

### Question 17 (10 points)
**Short Answer:** Explain the squelching mechanism in XRPL. How does `Slot::update` work, and what triggers a peer to be squelched or unsquelched?

### Question 18 (5 points)
**Multiple Choice:** What happens when `OverlayImpl::unsquelch` is called for a peer?

a) The peer is disconnected from the network  
b) A TMSquelch message with squelch=false is sent to the peer  
c) The peer's slot is released in PeerFinder  
d) The peer's message queue is cleared

### Question 19 (5 points)
**True/False:** The squelching mechanism is designed to reduce redundant message relay by temporarily muting some peers while keeping others active for each validator.

---

## Section E: Resource Management and Thread Safety (20 points)

### Question 20 (5 points)
**Multiple Choice:** What happens if the ResourceManager indicates that resource limits are exceeded during connection establishment?

a) The connection is queued for later  
b) The connection attempt is logged and aborted  
c) The oldest connection is closed to make room  
d) The connection proceeds with reduced privileges

### Question 21 (5 points)
**Short Answer:** How does XRPL ensure thread safety in overlay operations? What mechanisms are used by `OverlayImpl` and `PeerImp`?

### Question 22 (5 points)
**Multiple Choice:** What assertion is made in `PeerImp::close` to ensure proper execution context?

a) The peer has an open socket  
b) Execution is on the correct strand  
c) The peer is not a cluster member  
d) The overlay is still operational

### Question 23 (5 points)
**True/False:** All modifications to shared state in `OverlayImpl` (peer maps, lists) are protected by mutexes to prevent race conditions.

---

## Section F: Monitoring and Cleanup (15 points)

### Question 24 (5 points)
**Short Answer:** What information is included in the JSON output of the `peers` command for monitoring the overlay network?

### Question 25 (5 points)
**Multiple Choice:** During `PeerImp` destruction (`~PeerImp`), which operations are performed to clean up the peer connection?

a) Only `overlay_.deletePeer(id_)` is called  
b) Only PeerFinder is notified via `peerFinder().on_closed(slot_)`  
c) Multiple cleanup operations including deletePeer, onPeerDeactivate, peerFinder notification, and remove  
d) The socket is closed and no other cleanup is needed

### Question 26 (5 points)
**True/False:** HashRouter is used to track which peers have sent or relayed a given message to prevent redundant processing.

---

## Bonus Questions (10 points)

### Bonus Question 1 (5 points)
**Challenge:** If you were designing a load balancing mechanism for the XRPL overlay network, what metrics from the peer system would you use, and how would you ensure it doesn't interfere with the consensus process?

### Bonus Question 2 (5 points)
**Challenge:** Explain how the XRPL overlay network handles network partitions. What role do fixed peers and cluster connections play in partition recovery?