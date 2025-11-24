# 🌐 P2P Social - The Uncensorable Social Network

> **Social networking without the middleman. No servers. No censorship. No corporate overlords.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Early Development](https://img.shields.io/badge/Status-Early%20Development-orange)]()
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen)]()

---

## 🎯 The Vision

Imagine a social network where:

- ✅ **No one can ban you** - No central authority
- ✅ **No algorithmic feeds** - See what your friends actually post
- ✅ **No data mining** - Your data stays in your browser
- ✅ **No hosting costs** - Runs on GitHub Pages + Firebase (free)
- ✅ **No ads** - No business model = no incentive to exploit
- ✅ **Open source** - Fork it, modify it, own it

**This isn't a dream. The technology exists today.**

---

## 🚀 How It Works

```
You write a post → Splits into chunks → Distributed across friend's browsers
                        ↓
                  Everyone sees it
                        ↓
                  No server involved
```

### Three Simple Components

1. **GitHub Pages** - Hosts the static web app (free forever)
2. **Firebase** - Helps browsers find each other (free tier is plenty)
3. **WebRTC** - Browser-to-browser connections (peer-to-peer magic)

**After connecting, Firebase is out of the picture. All data flows directly between users.**

---

## 🎬 Demo

**Live Demo:** [Coming Soon]

**Screenshots:**

```
┌─────────────────────────────────────┐
│  P2P Social                    [⚙️] │
├─────────────────────────────────────┤
│                                     │
│  📝 What's on your mind?            │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  └─────────────────────────────┘   │
│           [Post] 🔐 Encrypted      │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  👤 Alice                     2m ago│
│  ┌─────────────────────────────┐   │
│  │ Just set up my node!        │   │
│  │ Running purely P2P 🚀       │   │
│  └─────────────────────────────┘   │
│  💬 3 replies  🔄 12 shares         │
│                                     │
│  👤 Bob                       5m ago│
│  ┌─────────────────────────────┐   │
│  │ No more censorship! 🎉      │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🏗️ Architecture

### High Level

```
┌──────────┐     Signaling      ┌──────────┐
│  User A  │ ←──────────────→  │ Firebase │
│ (Browser)│                    │          │
└────┬─────┘                    └────┬─────┘
     │                               │
     │         Signaling             │
     │    ←──────────────────────────┘
     │
     │  WebRTC (Direct P2P)
     ↓
┌──────────┐
│  User B  │
│ (Browser)│
└──────────┘
```

### Data Redundancy

Posts are split using **Hamming (7,4) codes**:

```
Original Post (1 MB)
    ↓
Split into 4 chunks (250 KB each)
    ↓
Generate 3 parity chunks (error correction)
    ↓
= 7 total chunks distributed across 7 peers
    ↓
Can lose ANY 2 chunks and still recover the post
```

**This means content survives even if users close their browsers.**

---

## 🔒 Security & Privacy

### Your Identity
- **Public key** = Your username (shareable)
- **Private key** = Your password (never leaves your browser)
- No email, no phone number, no real name required

### Content Authenticity
- Every post is cryptographically signed
- Recipients verify signatures before displaying
- Impossible to impersonate another user

### Optional Encryption
- End-to-end encrypted direct messages
- Only sender and recipient can read
- Network only sees encrypted gibberish

### What About Illegal Content?

**You control what you store:**
- Only cache content from users you follow
- Block malicious users instantly
- You're not a server, you're a peer
- Legal precedent: caching != distribution

---

## 💻 Getting Started

### As a User

**Just visit the site:**
```
https://p2p-social.github.io
```

No installation. No signup. Just start posting.

### As a Developer

**Clone and run locally:**
```bash
git clone https://github.com/p2p-social/p2p-social
cd p2p-social
python -m http.server 8000
open http://localhost:8000
```

**Firebase Setup (5 minutes):**
```bash
# 1. Create Firebase project at console.firebase.google.com
# 2. Enable Realtime Database
# 3. Copy config to src/firebase-config.js
# 4. Done!
```

**Deploy to GitHub Pages:**
```bash
npm run deploy
# Your site is now live at username.github.io/p2p-social
```

---

## 🛠️ Tech Stack

**Frontend:**
- Pure JavaScript (no frameworks... yet)
- Web Crypto API
- IndexedDB
- WebRTC Data Channels

**Backend (ish):**
- Firebase Realtime Database (signaling only)
- GitHub Pages (static hosting)

**Protocols:**
- WebRTC for P2P connections
- Hamming codes for redundancy
- Ed25519 for signatures
- SHA-256 for content addressing

---

## 📚 Documentation

- **[Architecture Document](ARCHITECTURE.md)** - Complete technical design
- **[Protocol Specification](PROTOCOL.md)** - Wire protocol details
- **[Contributing Guide](CONTRIBUTING.md)** - How to help
- **[API Reference](docs/API.md)** - Developer documentation

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Current)
- [x] WebRTC mesh networking
- [x] Firebase signaling
- [ ] Basic text posts
- [ ] Public key authentication
- [ ] Simple UI

### 📅 Phase 2: Redundancy (Next)
- [ ] Hamming code implementation
- [ ] Chunk distribution
- [ ] Automatic recovery
- [ ] Network health monitoring

### 📅 Phase 3: Social Features
- [ ] User profiles
- [ ] Follow/unfollow
- [ ] Chronological feed
- [ ] Search & discovery
- [ ] Notifications

### 📅 Phase 4: Polish
- [ ] Image/video support
- [ ] Markdown formatting
- [ ] Threading & comments
- [ ] Mobile PWA
- [ ] Dark mode 🌙

### 📅 Phase 5: Advanced
- [ ] E2E encrypted DMs
- [ ] Groups & communities
- [ ] Content moderation tools
- [ ] Native mobile apps
- [ ] Browser extension

---

## 🤝 Contributing

**We need help!**

- 🎨 **Designers** - Make it beautiful and intuitive
- 💻 **Developers** - Build features and fix bugs
- 📝 **Writers** - Documentation and tutorials
- 🧪 **Testers** - Break things and report issues
- 🌍 **Translators** - Make it accessible worldwide

**See [CONTRIBUTING.md](CONTRIBUTING.md) for details.**

### Quick Contribution Ideas

**Good First Issues:**
- [ ] Implement basic chat UI
- [ ] Add emoji picker
- [ ] Create user profile cards
- [ ] Write unit tests for Hamming codes
- [ ] Design a logo

**Advanced Challenges:**
- [ ] Optimize WebRTC connection management
- [ ] Implement efficient gossip protocol
- [ ] Build NAT traversal fallback system
- [ ] Create mobile-responsive layouts
- [ ] Write comprehensive protocol tests

---

## 🌟 Why This Matters

### The Problem

Modern social media is broken:

- **Censorship** - Platforms ban users for arbitrary reasons
- **Manipulation** - Algorithms optimize for engagement, not truth
- **Privacy violations** - Your data is the product
- **Monopolies** - A handful of companies control discourse
- **Deplatforming** - One ban = locked out of digital life

### The Solution

**Take back control:**

- Own your data
- Own your identity
- Own your connections
- Own your platform

**No company can:**
- Ban you
- Censor you
- Mine your data
- Manipulate your feed
- Sell your attention

---

## 🎓 Inspiration

This project stands on the shoulders of giants:

- **John Sokol** - Original vision for P2P social networking
- **Jack Dorsey** - Bluesky initiative
- **Gun.js** - Graph database synchronization
- **IPFS** - Content-addressed storage
- **WebTorrent** - P2P in the browser
- **Nostr** - Minimal censorship-resistant protocol

---

## ⚖️ Philosophy

### Core Principles

1. **User Sovereignty** - You own your data and identity
2. **Simplicity** - Technology should be understandable
3. **Openness** - Code and protocols are public
4. **Resilience** - No single point of failure
5. **Freedom** - Communicate without permission

### Non-Goals

- ❌ Anonymity (use Tor for that)
- ❌ Perfect privacy (use Signal for that)
- ❌ Scalability to billions (use BitTorrent for that)
- ❌ Professional polish (we'll get there)

**We're building a *tool*, not a *product*.**

---

## 📊 Comparison

| Feature | P2P Social | Facebook | Mastodon | Nostr |
|---------|------------|----------|----------|-------|
| Censorship Resistant | ✅ | ❌ | Partial | ✅ |
| No Servers | ✅ | ❌ | ❌ | ✅* |
| Free Hosting | ✅ | ✅ | ❌ | Partial |
| Open Source | ✅ | ❌ | ✅ | ✅ |
| Browser-Only | ✅ | ✅ | ✅ | Partial |
| Data Redundancy | ✅ | ✅ | ❌ | ❌ |
| E2E Encryption | ✅ | Partial | ✅ | ✅ |

\* Nostr uses relay servers, not fully P2P

---

## 🐛 Known Issues

**Current Limitations:**

- ⚠️ **Bootstrap problem** - Need seed peers for first users
- ⚠️ **NAT traversal** - Some networks require TURN servers
- ⚠️ **Data persistence** - Content disappears if all peers offline
- ⚠️ **Discovery** - Hard to find new users without directory
- ⚠️ **Mobile** - WebRTC support varies on mobile browsers

**We're working on all of these!**

---

## 📜 License

**MIT License** - Do whatever you want with this code.

```
Copyright (c) 2024 P2P Social Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, modify, distribute, and sell without restriction.

See LICENSE file for full terms.
```

---

## 🔗 Links

- **Website:** [Coming Soon]
- **GitHub:** https://github.com/p2p-social/p2p-social
- **Docs:** https://docs.p2p-social.org
- **Discord:** [Coming Soon]
- **Twitter:** [Coming Soon]

---

## 🙏 Acknowledgments

Built with ❤️ by developers who believe the internet should be free and open.

**Special Thanks:**
- John Sokol for the original vision
- The WebRTC team at Google
- Firebase for generous free tier
- GitHub for free hosting
- Every contributor who makes this possible

---

## 💬 Get Involved

**Join the conversation:**

- 💬 [GitHub Discussions](https://github.com/p2p-social/p2p-social/discussions)
- 🐛 [Report Issues](https://github.com/p2p-social/p2p-social/issues)
- 🔧 [Submit PRs](https://github.com/p2p-social/p2p-social/pulls)
- 📧 Email: hello@p2p-social.org

**Let's build the social network we actually want.**

---

<div align="center">

**⭐ Star this repo if you believe in a free and open internet ⭐**

Made with ☕ and determination to fix social media.

</div>
