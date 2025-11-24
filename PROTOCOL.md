# P2P Social Network Protocol Specification

**Version:** 0.1.0-alpha  
**Status:** Draft  
**Last Updated:** 2024-11-23

---

## Table of Contents

1. [Introduction](#introduction)
2. [Network Architecture](#network-architecture)
3. [Message Format](#message-format)
4. [Signaling Protocol](#signaling-protocol)
5. [Peer-to-Peer Protocol](#peer-to-peer-protocol)
6. [Content Addressing](#content-addressing)
7. [Data Redundancy](#data-redundancy)
8. [Cryptography](#cryptography)
9. [Network Topology](#network-topology)
10. [Error Handling](#error-handling)

---

## 1. Introduction

### 1.1 Purpose

This specification defines the wire protocol for P2P Social, a browser-based peer-to-peer social network with no central servers for content storage or distribution.

### 1.2 Design Goals

- **Simplicity**: Easy to implement in any language
- **Efficiency**: Minimal bandwidth and computational overhead
- **Extensibility**: Protocol can evolve without breaking changes
- **Interoperability**: Multiple implementations can coexist

### 1.3 Terminology

- **Peer**: A browser tab running the P2P Social application
- **Relay**: A signaling server (Firebase) that helps peers discover each other
- **Content**: Any data created by users (posts, images, etc.)
- **Chunk**: A piece of content after being split for distribution
- **Hash**: SHA-256 hash used for content addressing

---

## 2. Network Architecture

### 2.1 Three-Layer Model

```
┌─────────────────────────────────────┐
│  Application Layer                  │
│  (User interface, content creation) │
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│  Protocol Layer                     │
│  (Message handling, routing)        │
└────────────────┬────────────────────┘
                 │
┌────────────────┴────────────────────┐
│  Transport Layer                    │
│  (WebRTC, Firebase signaling)       │
└─────────────────────────────────────┘
```

### 2.2 Connection Types

**Signaling Connection** (WebSocket to Firebase):
- Purpose: Peer discovery and WebRTC negotiation
- Lifetime: Persistent while tab is open
- Bandwidth: Very low (< 1 KB/s average)

**Data Connection** (WebRTC DataChannel):
- Purpose: Direct peer-to-peer content transfer
- Lifetime: Maintained while both peers online
- Bandwidth: Variable (0-10 MB/s typical)

---

## 3. Message Format

### 3.1 Base Message Structure

All messages are JSON objects with the following structure:

```json
{
  "version": "0.1.0",
  "type": "MESSAGE_TYPE",
  "timestamp": 1700000000000,
  "peer_id": "abc123...",
  "signature": "ed25519_signature",
  "payload": { ... }
}
```

**Fields:**
- `version`: Protocol version (semantic versioning)
- `type`: Message type identifier (uppercase string)
- `timestamp`: Unix timestamp in milliseconds
- `peer_id`: Sender's public key (hex encoded)
- `signature`: Ed25519 signature of entire message
- `payload`: Type-specific data (varies by message type)

### 3.2 Signature Calculation

```javascript
// Message to sign
const message = {
  version: "0.1.0",
  type: "POST",
  timestamp: 1700000000000,
  peer_id: "abc123...",
  payload: { ... }
};

// Canonical JSON (sorted keys, no whitespace)
const canonical = JSON.stringify(message, Object.keys(message).sort());

// Sign with Ed25519 private key
const signature = ed25519.sign(canonical, privateKey);

// Add signature to message
message.signature = bufferToHex(signature);
```

### 3.3 Signature Verification

```javascript
// Extract signature
const { signature, ...messageToVerify } = receivedMessage;

// Canonical JSON
const canonical = JSON.stringify(
  messageToVerify, 
  Object.keys(messageToVerify).sort()
);

// Verify
const publicKey = hexToBuffer(messageToVerify.peer_id);
const sig = hexToBuffer(signature);
const isValid = ed25519.verify(canonical, sig, publicKey);
```

---

## 4. Signaling Protocol

### 4.1 Peer Announcement

When a peer comes online, it announces its presence to Firebase:

```json
{
  "type": "ANNOUNCE",
  "peer_id": "abc123...",
  "capabilities": {
    "storage": true,
    "relay": true,
    "max_connections": 6
  },
  "webrtc_offer": {
    "type": "offer",
    "sdp": "v=0\r\no=..."
  }
}
```

**Firebase Path:**  
`/peers/{peer_id}/status`

### 4.2 Peer Discovery

To find available peers:

```javascript
// Listen for peers
firebase.database().ref('/peers')
  .orderByChild('last_seen')
  .startAt(Date.now() - 60000) // Active in last 60 seconds
  .on('child_added', (snapshot) => {
    const peer = snapshot.val();
    // Initiate connection
  });
```

### 4.3 WebRTC Negotiation

**Offer/Answer Exchange:**

```json
// Peer A sends offer
{
  "type": "WEBRTC_OFFER",
  "from": "peer_a",
  "to": "peer_b",
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}

// Peer B responds with answer
{
  "type": "WEBRTC_ANSWER",
  "from": "peer_b",
  "to": "peer_a",
  "answer": {
    "type": "answer",
    "sdp": "..."
  }
}
```

**ICE Candidate Exchange:**

```json
{
  "type": "ICE_CANDIDATE",
  "from": "peer_a",
  "to": "peer_b",
  "candidate": {
    "candidate": "candidate:...",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

### 4.4 Heartbeat

Peers send periodic heartbeats to maintain presence:

```json
{
  "type": "HEARTBEAT",
  "peer_id": "abc123...",
  "connected_peers": 5,
  "storage_used": 45000000,
  "storage_available": 500000000
}
```

**Frequency:** Every 30 seconds

**Firebase Path:**  
`/peers/{peer_id}/last_seen`

---

## 5. Peer-to-Peer Protocol

### 5.1 Content Publication

**POST Message:**

```json
{
  "version": "0.1.0",
  "type": "POST",
  "timestamp": 1700000000000,
  "peer_id": "abc123...",
  "signature": "...",
  "payload": {
    "content_hash": "sha256_hash",
    "content_type": "text/plain",
    "content": "Hello, world!",
    "metadata": {
      "title": "My First Post",
      "tags": ["test", "hello"]
    }
  }
}
```

**Content Hash Calculation:**

```javascript
// Calculate hash
const content = message.payload.content;
const hash = await crypto.subtle.digest('SHA-256', 
  new TextEncoder().encode(content)
);
const contentHash = bufferToHex(hash);

// Verify
message.payload.content_hash === contentHash;
```

### 5.2 Content Request

**REQUEST Message:**

```json
{
  "type": "REQUEST",
  "peer_id": "requester_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "content_hash": "sha256_hash",
    "chunks": [0, 1, 2, 3, 4, 5, 6], // Hamming chunks needed
    "priority": "high"
  }
}
```

### 5.3 Content Response

**RESPONSE Message:**

```json
{
  "type": "RESPONSE",
  "peer_id": "responder_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "content_hash": "sha256_hash",
    "chunk_number": 0,
    "chunk_data": "base64_encoded_data",
    "total_chunks": 7
  }
}
```

### 5.4 Gossip Protocol

**GOSSIP Message:**

```json
{
  "type": "GOSSIP",
  "peer_id": "sender_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "event": "NEW_POST",
    "content_hash": "sha256_hash",
    "author": "author_public_key",
    "hops": 2,
    "ttl": 8
  }
}
```

**Propagation Rules:**
- Decrement TTL by 1 before forwarding
- Drop if TTL <= 0
- Don't forward to sender
- Don't forward duplicates (check last 1000 gossip hashes)
- Forward to random 3-5 peers

---

## 6. Content Addressing

### 6.1 Hash-Based Addressing

All content is addressed by its SHA-256 hash:

```
p2p://Qm5d2c4b6e8f0a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f
         └─ Base58-encoded SHA-256 hash
```

### 6.2 Content Metadata

```json
{
  "content_hash": "Qm5d2c...",
  "content_type": "text/plain",
  "size": 1024,
  "created": 1700000000000,
  "author": "author_public_key",
  "signature": "...",
  "chunks": [
    {"chunk_id": 0, "hash": "..."},
    {"chunk_id": 1, "hash": "..."},
    // ... 7 total chunks for Hamming (7,4)
  ]
}
```

### 6.3 Content Discovery

**QUERY Message:**

```json
{
  "type": "QUERY",
  "peer_id": "requester_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "content_hash": "Qm5d2c...",
    "query_id": "random_uuid"
  }
}
```

**QUERY_RESPONSE Message:**

```json
{
  "type": "QUERY_RESPONSE",
  "peer_id": "responder_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "query_id": "random_uuid",
    "found": true,
    "chunks_available": [0, 1, 2, 4, 5, 6]
  }
}
```

---

## 7. Data Redundancy

### 7.1 Hamming (7,4) Encoding

**Algorithm:**

```
Input: 4 data chunks (D1, D2, D3, D4)
Output: 7 chunks total (D1-D4, P1-P3)

P1 = D1 ⊕ D2 ⊕ D3
P2 = D1 ⊕ D2 ⊕ D4
P3 = D1 ⊕ D3 ⊕ D4

Where ⊕ is bitwise XOR
```

**Implementation:**

```javascript
function encodeHamming(data) {
  // Split data into 4 equal chunks
  const chunkSize = Math.ceil(data.length / 4);
  const d1 = data.slice(0, chunkSize);
  const d2 = data.slice(chunkSize, chunkSize * 2);
  const d3 = data.slice(chunkSize * 2, chunkSize * 3);
  const d4 = data.slice(chunkSize * 3);
  
  // Calculate parity chunks
  const p1 = xor(xor(d1, d2), d3);
  const p2 = xor(xor(d1, d2), d4);
  const p3 = xor(xor(d1, d3), d4);
  
  return [d1, d2, d3, d4, p1, p2, p3];
}

function xor(buf1, buf2) {
  const result = new Uint8Array(Math.max(buf1.length, buf2.length));
  for (let i = 0; i < result.length; i++) {
    result[i] = (buf1[i] || 0) ^ (buf2[i] || 0);
  }
  return result;
}
```

### 7.2 Decoding and Recovery

```javascript
function decodeHamming(chunks) {
  // Check which chunks are missing
  const available = chunks.filter(c => c !== null);
  
  if (available.length < 5) {
    throw new Error('Need at least 5 of 7 chunks to recover');
  }
  
  // If all data chunks present, just return them
  if (hasChunks([0,1,2,3], chunks)) {
    return concatenate(chunks[0], chunks[1], chunks[2], chunks[3]);
  }
  
  // Reconstruct missing data chunks from parity
  // Example: If D2 is missing
  // D2 = D1 ⊕ D3 ⊕ P1
  // (because P1 = D1 ⊕ D2 ⊕ D3, so D2 = P1 ⊕ D1 ⊕ D3)
  
  // ... reconstruction logic ...
  
  return reconstructedData;
}
```

### 7.3 Chunk Distribution Strategy

**Distribution Message:**

```json
{
  "type": "STORE_CHUNK",
  "peer_id": "distributor_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "content_hash": "Qm5d2c...",
    "chunk_number": 0,
    "chunk_data": "base64_encoded",
    "expires": 1700086400000 // Optional expiry
  }
}
```

**Selection Algorithm:**
1. Calculate `hash(peer_id + content_hash)`
2. Sort all available peers by this hash
3. Select first 7 peers from sorted list
4. Each peer stores one chunk (deterministic distribution)

---

## 8. Cryptography

### 8.1 Key Generation

```javascript
// Generate Ed25519 keypair
const keypair = await crypto.subtle.generateKey(
  { name: "Ed25519" },
  true,
  ["sign", "verify"]
);

// Export public key (this becomes peer_id)
const publicKey = await crypto.subtle.exportKey("raw", keypair.publicKey);
const peer_id = bufferToHex(publicKey);

// Store private key in IndexedDB
await storeKey('private_key', keypair.privateKey);
```

### 8.2 Message Signing

```javascript
async function signMessage(message, privateKey) {
  const canonical = JSON.stringify(message, Object.keys(message).sort());
  const signature = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(canonical)
  );
  return bufferToHex(signature);
}
```

### 8.3 Message Verification

```javascript
async function verifyMessage(message) {
  const { signature, peer_id, ...messageToVerify } = message;
  
  const canonical = JSON.stringify(
    messageToVerify, 
    Object.keys(messageToVerify).sort()
  );
  
  const publicKey = await crypto.subtle.importKey(
    "raw",
    hexToBuffer(peer_id),
    { name: "Ed25519" },
    false,
    ["verify"]
  );
  
  return await crypto.subtle.verify(
    "Ed25519",
    publicKey,
    hexToBuffer(signature),
    new TextEncoder().encode(canonical)
  );
}
```

### 8.4 End-to-End Encryption (Optional)

**Key Exchange (ECDH):**

```javascript
// Generate ephemeral key for each conversation
const ephemeralKey = await crypto.subtle.generateKey(
  { name: "ECDH", namedCurve: "P-256" },
  true,
  ["deriveKey"]
);

// Derive shared secret with recipient's public key
const sharedSecret = await crypto.subtle.deriveKey(
  { name: "ECDH", public: recipientPublicKey },
  senderPrivateKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);
```

**Encrypted Message:**

```json
{
  "type": "ENCRYPTED_MESSAGE",
  "peer_id": "sender_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "recipient": "recipient_public_key",
    "ephemeral_public_key": "...",
    "nonce": "...",
    "ciphertext": "base64_encoded",
    "auth_tag": "..."
  }
}
```

---

## 9. Network Topology

### 9.1 Mesh Structure

Each peer maintains 3-6 active connections:

```
Target Connections:
- Minimum: 3 (for redundancy)
- Optimal: 5 (balance between redundancy and overhead)
- Maximum: 6 (prevent overload)
```

### 9.2 Connection Management

**Connection Scoring:**

```javascript
function scoreConnection(peer) {
  let score = 0;
  
  // Latency (lower is better)
  score += (1000 - peer.latency) / 10;
  
  // Bandwidth (higher is better)
  score += peer.bandwidth / 1000;
  
  // Uptime (higher is better)
  score += peer.uptime_percentage;
  
  // Storage contribution (higher is better)
  score += peer.storage_contributed / 1000000;
  
  return score;
}
```

**Connection Replacement:**

```javascript
// Periodically evaluate connections
setInterval(() => {
  const connections = getActiveConnections();
  const worstConnection = connections.sort(scoreConnection)[0];
  
  // Find better alternatives
  const availablePeers = discoverPeers();
  const betterPeer = availablePeers.find(
    p => scoreConnection(p) > scoreConnection(worstConnection) * 1.2
  );
  
  if (betterPeer) {
    disconnect(worstConnection);
    connect(betterPeer);
  }
}, 60000); // Every minute
```

### 9.3 Bootstrap Nodes

**Static Seed Peers:**

```javascript
const BOOTSTRAP_PEERS = [
  "wss://seed1.p2p-social.org",
  "wss://seed2.p2p-social.org",
  "wss://seed3.p2p-social.org"
];

// Connect to seeds on startup
async function bootstrap() {
  for (const seed of BOOTSTRAP_PEERS) {
    try {
      await connectToPeer(seed);
      // Once connected, discover more peers
      const peers = await requestPeerList(seed);
      // Connect to additional peers
    } catch (error) {
      console.warn(`Failed to connect to ${seed}`);
    }
  }
}
```

---

## 10. Error Handling

### 10.1 Error Message Format

```json
{
  "type": "ERROR",
  "peer_id": "sender_id",
  "timestamp": 1700000000000,
  "signature": "...",
  "payload": {
    "error_code": "CONTENT_NOT_FOUND",
    "error_message": "Requested content hash not available",
    "related_message_id": "...",
    "retry_after": 5000
  }
}
```

### 10.2 Error Codes

| Code | Description | Handling |
|------|-------------|----------|
| `INVALID_SIGNATURE` | Message signature verification failed | Drop message |
| `CONTENT_NOT_FOUND` | Requested content not available | Try another peer |
| `CHUNK_CORRUPTED` | Chunk hash doesn't match | Request from another peer |
| `RATE_LIMITED` | Too many requests | Back off exponentially |
| `STORAGE_FULL` | Peer has no storage capacity | Find alternative peer |
| `PROTOCOL_MISMATCH` | Incompatible protocol versions | Upgrade or downgrade |
| `PEER_OVERLOADED` | Peer too busy to respond | Try again later |

### 10.3 Retry Logic

```javascript
async function requestWithRetry(peer, request, maxRetries = 3) {
  let attempts = 0;
  let delay = 1000; // Start with 1 second
  
  while (attempts < maxRetries) {
    try {
      const response = await sendRequest(peer, request);
      return response;
    } catch (error) {
      attempts++;
      
      if (attempts >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts`);
      }
      
      // Exponential backoff
      await sleep(delay);
      delay *= 2;
    }
  }
}
```

### 10.4 Connection Failure

**Detection:**
- No heartbeat for 60 seconds
- WebRTC connection state = "failed"
- Multiple consecutive request timeouts

**Recovery:**
```javascript
async function handleConnectionFailure(peer) {
  // Remove from active connections
  removeConnection(peer);
  
  // Redistribute content chunks stored on this peer
  const chunksToRedistribute = getChunksOnPeer(peer);
  for (const chunk of chunksToRedistribute) {
    await redistributeChunk(chunk);
  }
  
  // Find replacement peer
  const replacement = await findReplacementPeer();
  if (replacement) {
    await connect(replacement);
  }
}
```

---

## Appendix A: Message Types

Complete list of message types:

| Type | Direction | Purpose |
|------|-----------|---------|
| `ANNOUNCE` | Peer → Firebase | Announce presence |
| `HEARTBEAT` | Peer → Firebase | Keep-alive signal |
| `WEBRTC_OFFER` | Peer → Peer (via Firebase) | WebRTC negotiation |
| `WEBRTC_ANSWER` | Peer → Peer (via Firebase) | WebRTC negotiation |
| `ICE_CANDIDATE` | Peer → Peer (via Firebase) | WebRTC negotiation |
| `POST` | Peer → Peers | Publish new content |
| `REQUEST` | Peer → Peer | Request content chunks |
| `RESPONSE` | Peer → Peer | Send content chunks |
| `QUERY` | Peer → Peers | Search for content |
| `QUERY_RESPONSE` | Peer → Peer | Response to query |
| `GOSSIP` | Peer → Peers | Propagate events |
| `STORE_CHUNK` | Peer → Peer | Store content chunk |
| `DELETE_CHUNK` | Peer → Peer | Delete content chunk |
| `ENCRYPTED_MESSAGE` | Peer → Peer | E2E encrypted message |
| `ERROR` | Peer → Peer | Error notification |

---

## Appendix B: Implementation Checklist

### Phase 1: Basic Connectivity
- [ ] Ed25519 key generation
- [ ] Firebase signaling connection
- [ ] WebRTC offer/answer exchange
- [ ] ICE candidate exchange
- [ ] Data channel establishment
- [ ] Message signing/verification
- [ ] Heartbeat implementation

### Phase 2: Content Distribution
- [ ] Content hash calculation
- [ ] POST message creation
- [ ] REQUEST/RESPONSE implementation
- [ ] Basic content storage (IndexedDB)
- [ ] Simple content retrieval

### Phase 3: Redundancy
- [ ] Hamming (7,4) encoding
- [ ] Hamming (7,4) decoding
- [ ] Chunk distribution algorithm
- [ ] Chunk reconstruction
- [ ] Storage management

### Phase 4: Network Health
- [ ] Connection scoring
- [ ] Peer discovery
- [ ] Connection replacement
- [ ] Error handling
- [ ] Retry logic
- [ ] Failure recovery

### Phase 5: Advanced Features
- [ ] Gossip protocol
- [ ] E2E encryption
- [ ] Query/search
- [ ] Bootstrap nodes
- [ ] Network monitoring

---

## Appendix C: Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Connection time | < 2 seconds | From page load to first peer connection |
| Message latency | < 100 ms | P2P message delivery |
| Chunk retrieval | < 500 ms | Per chunk, assuming 3 hops |
| Content reconstruction | < 2 seconds | Full file from Hamming chunks |
| Storage efficiency | > 75% | Data size / total storage used |
| Bandwidth overhead | < 10% | Protocol overhead vs. content |
| CPU usage | < 5% | Idle state with 5 connections |
| Memory usage | < 100 MB | With 100 cached content items |

---

## Appendix D: Security Considerations

1. **Sybil Attacks**: Proof-of-work for peer announcements
2. **Eclipse Attacks**: Diverse peer selection algorithm
3. **DDoS**: Rate limiting and peer reputation
4. **Content Poisoning**: Hash verification before storage
5. **Man-in-the-Middle**: Ed25519 signatures prevent tampering
6. **Privacy**: Optional Tor integration for anonymity
7. **Legal**: Users control what content they cache

---

## Appendix E: Future Extensions

- **Protocol buffers** instead of JSON for efficiency
- **QUIC** as alternative to WebRTC for some connections
- **DHT** for decentralized peer discovery
- **Merkle trees** for efficient sync
- **Smart contracts** for incentive mechanisms
- **IPLD** compatibility for ecosystem integration

---

**End of Specification**

For questions or clarifications, open an issue at:  
https://github.com/p2p-social/p2p-social/issues
