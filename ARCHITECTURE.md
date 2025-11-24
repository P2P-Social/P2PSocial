# P2P Social Platform Architecture
## Build the Uncensorable Social Network

> "I just want to discuss news articles with my friends without some algorithm deciding what I can see."

### The Problem

Modern social platforms have become censorship bottlenecks:
- Content filtered by opaque algorithms
- Users banned for sharing legitimate content
- Platforms prioritize engagement over user intent
- Central servers = central points of failure and control

**We can do better.**

---

## Architecture Overview

This is a **serverless peer-to-peer social platform** that runs entirely in browser tabs, with zero backend infrastructure costs and zero ability for platforms to censor content.

### Three Simple Components

```
┌─────────────────┐
│  GitHub Pages   │  Static HTML/JS/CSS
│  (Free Hosting) │  Unlimited bandwidth
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Firebase     │  WebRTC Signaling only
│   (Matchmaker)  │  Peer discovery
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Browser Tabs   │  Direct P2P connections
│   (The Network) │  Data storage & routing
└─────────────────┘
```

**Key Principle**: After initial handshake, **all data flows peer-to-peer**. Firebase never sees your content.

---

## Technical Components

### 1. Static Frontend (GitHub Pages)

**What it does:**
- Serves the single-page application
- Zero server costs
- Distributed via GitHub's CDN
- Instant deployment via `git push`

**Technologies:**
- Pure JavaScript (or React/Vue/Svelte)
- IndexedDB for local storage (5MB+ persistent)
- WebRTC Data Channels
- Web Crypto API for encryption

**Files:**
```
/index.html          # Entry point
/app.js             # Main application logic
/p2p-network.js     # WebRTC mesh management
/storage.js         # Local data & Hamming codes
/crypto.js          # Encryption utilities
/ui.js              # User interface
```

### 2. Signaling Service (Firebase)

**What it does:**
- Helps peers find each other
- Exchanges WebRTC handshake data (SDP/ICE)
- Maintains peer presence/availability
- **Never sees actual content**

**Firebase Services Used:**
- **Realtime Database**: Peer presence & signaling
- **Authentication**: Optional user identity
- **Hosting**: Alternative to GitHub Pages

**Data Structure:**
```json
{
  "peers": {
    "peer_id_123": {
      "online": true,
      "lastSeen": 1700000000,
      "offer": "...",
      "answer": "..."
    }
  },
  "rooms": {
    "room_id_456": {
      "members": ["peer_id_123", "peer_id_789"]
    }
  }
}
```

**Cost:** Free tier supports ~100 concurrent users, scales affordably.

### 3. P2P Network (WebRTC)

**What it does:**
- Direct browser-to-browser data transfer
- Mesh network topology
- Content distribution
- Zero bandwidth costs (after handshake)

**Connection Flow:**
```
1. Peer A loads app from GitHub Pages
2. Connects to Firebase for signaling
3. Publishes presence & connection offer
4. Peer B receives offer via Firebase
5. Sends answer back through Firebase
6. WebRTC connection established
7. Firebase no longer involved
8. All data flows directly A ↔ B
```

**Mesh Topology:**
```
    [User A] ←→ [User B]
       ↕           ↕
    [User C] ←→ [User D]
       ↕           ↕
    [User E] ←→ [User F]
```

Each user maintains 3-6 active connections for redundancy.

---

## Data Storage & Redundancy

### The Challenge
Browser tabs can close at any time. How do we keep data available?

### Solution: Distributed Storage with Hamming Codes

**Hamming (7,4) Error Correction:**
- Take 1 file, split into 4 chunks
- Generate 3 parity chunks (XOR operations)
- Distribute 7 chunks across 7 peers
- Can lose ANY 2 chunks and still recover file
- Minimal overhead (75% efficiency)

**Example:**
```
Original File (400 KB)
  ↓
Split into 4 chunks (100 KB each)
  D1, D2, D3, D4
  ↓
Generate 3 parity chunks
  P1 = D1 ⊕ D2 ⊕ D3
  P2 = D1 ⊕ D2 ⊕ D4
  P3 = D1 ⊕ D3 ⊕ D4
  ↓
Distribute 7 chunks (D1-D4, P1-P3) to 7 peers
```

**Recovery:**
- If Peer holding D2 goes offline
- Any 6 remaining peers can reconstruct D2
- System automatically detects and repairs

**Implementation:**
```javascript
// Simplified Hamming encoding
function encodeHamming(data) {
  const chunks = splitIntoChunks(data, 4);
  return {
    d1: chunks[0],
    d2: chunks[1],
    d3: chunks[2],
    d4: chunks[3],
    p1: xor(chunks[0], chunks[1], chunks[2]),
    p2: xor(chunks[0], chunks[1], chunks[3]),
    p3: xor(chunks[0], chunks[2], chunks[3])
  };
}

function decodeHamming(chunks) {
  // Detect missing chunks
  // Reconstruct from available data
  // Return complete file
}
```

### Storage Layers

**1. Hot Storage (RAM - SessionStorage)**
- Active content in memory
- Multi-GB capacity
- Lost when tab closes

**2. Warm Storage (IndexedDB)**
- 5MB+ persistent storage
- User's own content + frequently accessed
- Survives browser restart

**3. Cold Storage (Distributed Network)**
- Content distributed across peer network
- Hamming-encoded for redundancy
- Reconstructed on demand

---

## Content Addressing

Every piece of content has a unique hash-based address:

```
p2p://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/post
```

**Benefits:**
- Content-addressable (hash = verification)
- Deduplication (same hash = same content)
- Immutable (can't change without changing hash)
- Censor-resistant (no single location)

**Discovery:**
```javascript
// User wants to view a post
const contentHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

// Query connected peers
const peers = getConnectedPeers();
for (const peer of peers) {
  if (peer.hasContent(contentHash)) {
    const chunks = await peer.requestChunks(contentHash);
    const content = reconstructFromChunks(chunks);
    displayContent(content);
    break;
  }
}
```

---

## Security Model

### 1. User Identity
**Public Key Cryptography:**
- Each user generates Ed25519 keypair
- Public key = user ID
- Private key stored in browser (never shared)
- All posts signed with private key

```javascript
// Generate identity
const keypair = await crypto.subtle.generateKey(
  { name: "Ed25519" },
  true,
  ["sign", "verify"]
);

// Sign content
const signature = await crypto.subtle.sign(
  "Ed25519",
  keypair.privateKey,
  contentBuffer
);

// Others verify
const isValid = await crypto.subtle.verify(
  "Ed25519",
  authorPublicKey,
  signature,
  contentBuffer
);
```

### 2. Content Encryption (Optional)
**End-to-End Encryption for Private Messages:**
- Sender encrypts with recipient's public key
- Only recipient can decrypt
- Network only sees encrypted blobs

### 3. Access Control
**No Traditional Auth:**
- No passwords
- No accounts to hack
- No servers to breach
- Identity = cryptographic key

**Follow Model:**
```javascript
// Follow a user (store their public key)
const following = {
  "user_alice": "ED25519_PUBLIC_KEY_ALICE",
  "user_bob": "ED25519_PUBLIC_KEY_BOB"
};

// Only accept content from followed users
function validatePost(post) {
  const authorKey = following[post.author];
  if (!authorKey) return false;
  return verifySignature(post, authorKey);
}
```

### 4. Spam/Abuse Prevention
**Computational Proof of Work:**
- Posts require small PoW (prevents spam)
- Configurable difficulty
- Users can ignore low-PoW content

**Web of Trust:**
- Only see content from followed users
- Or users-of-users (2nd degree)
- Block lists shared among trusted peers

---

## Network Protocols

### 1. Peer Discovery Protocol
```
ANNOUNCE {
  peer_id: "abc123",
  public_key: "...",
  capabilities: ["storage", "relay"],
  timestamp: 1700000000
}

QUERY {
  looking_for: "content_hash_xyz",
  requester: "peer_abc123"
}

RESPONSE {
  have_content: true,
  chunks: [1, 3, 4, 7],
  peer_id: "def456"
}
```

### 2. Content Transfer Protocol
```
REQUEST_CHUNK {
  content_hash: "Qm...",
  chunk_number: 3,
  requester_sig: "..."
}

SEND_CHUNK {
  content_hash: "Qm...",
  chunk_number: 3,
  data: <binary>,
  sender_sig: "..."
}
```

### 3. Gossip Protocol
```
// New content propagates through network
GOSSIP {
  type: "NEW_POST",
  content_hash: "Qm...",
  author: "alice_pubkey",
  timestamp: 1700000000,
  hops: 2
}

// Peers re-broadcast to their connections
// TTL prevents infinite loops
```

---

## User Experience

### First Run
```
1. Visit: yourproject.github.io
2. App generates keypair
3. Shows "Your ID: alice_abc123"
4. Connects to Firebase for peer discovery
5. Establishes connections to online peers
6. Ready to post/browse
```

### Posting Content
```
1. User writes post
2. Post signed with private key
3. Split into chunks + Hamming encoding
4. Distributed to connected peers
5. Content hash returned as "permalink"
6. Peers gossip about new content
```

### Browsing Content
```
1. See post hashes from followed users
2. Request chunks from peers
3. Reconstruct from Hamming codes
4. Verify signature
5. Display content
```

### Following Users
```
1. Friend shares their public key (QR code, link, etc)
2. You add to "following" list
3. Network prioritizes content from followed users
4. You help distribute their content
```

---

## Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] Basic WebRTC mesh networking
- [ ] Firebase signaling setup
- [ ] Simple text posts
- [ ] Content-addressed storage
- [ ] Public key identity

**Deliverable:** Two users can chat P2P via browser tabs

### Phase 2: Redundancy (Weeks 5-8)
- [ ] Hamming (7,4) encoding/decoding
- [ ] Chunk distribution protocol
- [ ] Automatic reconstruction
- [ ] Peer storage management
- [ ] Network health monitoring

**Deliverable:** Content persists across tab closures

### Phase 3: Social Features (Weeks 9-12)
- [ ] User profiles
- [ ] Follow/unfollow
- [ ] Feed algorithm (chronological)
- [ ] Content discovery
- [ ] Search

**Deliverable:** Basic social network functionality

### Phase 4: Media & Polish (Weeks 13-16)
- [ ] Image/video support
- [ ] Markdown formatting
- [ ] Threading/comments
- [ ] Notifications
- [ ] Mobile-responsive UI

**Deliverable:** Feature-complete social platform

### Phase 5: Advanced Features
- [ ] End-to-end encrypted DMs
- [ ] Groups/communities
- [ ] Content moderation tools
- [ ] Analytics dashboard
- [ ] Mobile apps (PWA)

---

## Technical Considerations

### NAT Traversal
**Problem:** Most users behind NAT/firewall

**Solution:**
- Use Google's free STUN servers
- Add TURN servers for worst-case scenarios
- Most modern browsers handle this automatically

```javascript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

### Bootstrap Problem
**Problem:** First user has no peers

**Solution:**
- Static "seed peers" (always-on tabs in cloud VMs)
- Incentivize users to keep tabs open
- Browser extension for persistent background page
- Progressive Web App for mobile persistence

### Scaling
**Firebase Free Tier:**
- 100 simultaneous connections
- 10 GB/month data transfer
- Plenty for signaling

**Beyond Free Tier:**
- Multiple Firebase projects as backup
- Self-hosted signaling servers (Socket.io)
- Alternative services (PeerJS, Gun.js relays)

### Data Retention
**Challenge:** All users close tabs

**Mitigation:**
- Users encouraged to export/backup important content
- "Pinning" feature for critical content
- Browser extensions stay alive in background
- Community runs dedicated "archive nodes"

---

## Getting Started

### For Users
```bash
# Just visit the site
https://yourproject.github.io

# Or run locally
git clone https://github.com/yourproject/p2p-social
cd p2p-social
python -m http.server 8000
# Open http://localhost:8000
```

### For Developers
```bash
# Clone repository
git clone https://github.com/yourproject/p2p-social
cd p2p-social

# Install dependencies
npm install

# Set up Firebase
# 1. Create Firebase project
# 2. Copy config to src/firebase-config.js
# 3. Enable Realtime Database

# Run development server
npm run dev

# Deploy to GitHub Pages
npm run deploy
```

### Firebase Setup
```javascript
// src/firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};
```

---

## Project Structure

```
p2p-social/
├── index.html              # Entry point
├── src/
│   ├── core/
│   │   ├── p2p-network.js  # WebRTC mesh logic
│   │   ├── signaling.js    # Firebase integration
│   │   ├── storage.js      # IndexedDB wrapper
│   │   └── hamming.js      # Error correction codes
│   ├── crypto/
│   │   ├── identity.js     # Key generation
│   │   ├── signing.js      # Content signatures
│   │   └── encryption.js   # E2E encryption
│   ├── protocol/
│   │   ├── messages.js     # Protocol definitions
│   │   ├── gossip.js       # Content propagation
│   │   └── discovery.js    # Peer discovery
│   ├── ui/
│   │   ├── feed.js         # Main feed
│   │   ├── composer.js     # Post composer
│   │   ├── profile.js      # User profiles
│   │   └── settings.js     # Configuration
│   └── utils/
│       ├── hash.js         # Content addressing
│       ├── chunks.js       # Data chunking
│       └── validate.js     # Input validation
├── docs/
│   ├── ARCHITECTURE.md     # This document
│   ├── PROTOCOL.md         # Protocol specification
│   └── API.md              # Developer API
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
└── examples/
    ├── simple-chat/       # Basic chat example
    └── file-sharing/      # File sharing demo
```

---

## Contributing

We need help with:

**Core Development:**
- WebRTC optimization
- Hamming code implementation
- Network protocol design
- Performance tuning

**User Experience:**
- UI/UX design
- Mobile responsiveness
- Accessibility
- Documentation

**Infrastructure:**
- Firebase alternatives
- TURN server deployment
- Archive nodes
- Testing framework

**See CONTRIBUTING.md for guidelines**

---

## FAQ

**Q: Is this like BitTorrent?**
A: Similar concept, but for social networking. Content is distributed across users instead of centralized servers.

**Q: What happens if I close my tab?**
A: Content you've viewed is cached in other users' browsers. Hamming codes ensure redundancy.

**Q: Can content be deleted?**
A: You can stop distributing it, but others may cache it. This is by design (censorship resistance).

**Q: Is this anonymous?**
A: Pseudonymous. Your public key is your identity, but not linked to real identity unless you share it.

**Q: What about illegal content?**
A: Users control what they store/distribute. You're not legally liable for cached chunks of encrypted data you can't read. Block malicious users via web-of-trust.

**Q: How fast is it?**
A: Initial connection takes 1-2 seconds. After that, direct P2P is often faster than traditional servers.

**Q: Mobile support?**
A: Yes! WebRTC works in mobile browsers. PWA support coming.

**Q: Can governments block this?**
A: They can block Firebase, but the app can use alternative signaling servers. Once connected, traffic is P2P and harder to filter.

---

## Related Projects

- **Gun.js**: Graph database with P2P sync
- **IPFS**: Distributed file system
- **Nostr**: Minimal protocol for censorship-resistant social
- **Scuttlebutt**: Offline-first P2P social network
- **Matrix**: Federated messaging
- **Mastodon**: Federated microblogging

**How we're different:**
- Zero infrastructure (GitHub + Firebase free tiers)
- Pure browser-based (no installs)
- Hamming redundancy for reliability
- Focus on simplicity

---

## License

MIT License - Build whatever you want with this.

---

## Contact

- GitHub: https://github.com/yourproject/p2p-social
- Matrix: #p2p-social:matrix.org
- Email: hello@p2p-social.org

**Let's build the uncensorable web.**

---

## Acknowledgments

Inspired by John Sokol's vision of peer-to-peer social networking and decades of distributed systems research.

Special thanks to the WebRTC, IPFS, and Gun.js communities for pioneering this space.
