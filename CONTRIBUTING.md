# Contributing to P2P Social

Thank you for your interest in contributing! This project aims to build a truly decentralized social network, and we need all the help we can get.

## 🎯 Project Vision

We're building a social network that:
- Cannot be censored by any authority
- Runs without central servers
- Costs nothing to host
- Gives users full control of their data
- Is simple enough for anyone to fork and modify

## 🚀 Getting Started

### Prerequisites

- Basic knowledge of JavaScript
- Understanding of WebRTC (we have resources!)
- Familiarity with Firebase (optional, easy to learn)
- A passion for decentralization

### Setting Up Your Environment

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/p2p-social
cd p2p-social

# Install dependencies (if any)
npm install

# Run locally
python -m http.server 8000
# Open http://localhost:8000
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Realtime Database
3. Copy your config to `src/firebase-config.js`
4. Set database rules to public for testing:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## 📋 How to Contribute

### Finding Issues

Check our [issue tracker](https://github.com/p2p-social/p2p-social/issues) for:
- 🟢 **Good First Issues** - Perfect for newcomers
- 🟡 **Help Wanted** - We need expertise here
- 🔴 **Critical** - High priority bugs

### Types of Contributions

#### 1. Code Contributions
- **Core Features**: WebRTC, Hamming codes, crypto
- **UI/UX**: Make it beautiful and intuitive
- **Performance**: Optimize for speed and efficiency
- **Testing**: Write unit and integration tests
- **Documentation**: Code comments and examples

#### 2. Documentation
- Improve README clarity
- Write tutorials and guides
- Create video walkthroughs
- Translate documentation

#### 3. Design
- UI mockups
- Logo and branding
- User flow diagrams
- Animation concepts

#### 4. Research
- P2P networking strategies
- Error correction algorithms
- Security improvements
- Scaling solutions

#### 5. Community
- Answer questions in discussions
- Help debug issues
- Review pull requests
- Spread the word

## 🔧 Development Workflow

### 1. Pick an Issue

Comment on an issue to claim it:
```
I'd like to work on this! Expected timeline: 1 week
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes

Follow our [code style guide](#code-style-guide) below.

### 4. Test Your Changes

```bash
# Run tests (when available)
npm test

# Test manually
python -m http.server 8000
# Test in multiple browsers
```

### 5. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git commit -m "Add Hamming code encoder implementation"
git commit -m "Fix WebRTC connection timeout issue"
git commit -m "Improve UI responsiveness on mobile"
```

**Good commit messages:**
- Start with a verb (Add, Fix, Update, Remove)
- Be specific about what changed
- Reference issue numbers: "Fix #123"

**Bad commit messages:**
- "fixed stuff"
- "asdf"
- "changes"

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Go to GitHub and create a pull request with:
- **Clear title**: What does this PR do?
- **Description**: Why is this change needed?
- **Testing**: How did you test it?
- **Screenshots**: For UI changes

## 📝 Code Style Guide

### JavaScript

**Use modern ES6+ syntax:**

```javascript
// Good
const peers = await discoverPeers();
const activePeers = peers.filter(p => p.online);

// Avoid
var peers = discoverPeers();
peers.then(function(result) {
  var activePeers = result.filter(function(p) {
    return p.online;
  });
});
```

**Keep functions small and focused:**

```javascript
// Good
async function connectToPeer(peerId) {
  const connection = await createConnection(peerId);
  await exchangeSignaling(connection);
  return setupDataChannel(connection);
}

// Avoid - too much in one function
async function connectToPeer(peerId) {
  // 100 lines of mixed concerns...
}
```

**Use clear variable names:**

```javascript
// Good
const contentHash = calculateHash(data);
const availableChunks = chunks.filter(c => c !== null);

// Avoid
const h = calc(d);
const x = chunks.filter(c => c !== null);
```

**Add comments for complex logic:**

```javascript
// Calculate parity chunk P1 using XOR of data chunks D1, D2, D3
// This allows recovery of any single missing data chunk
const p1 = xor(xor(d1, d2), d3);
```

### HTML/CSS

**Use semantic HTML:**

```html
<!-- Good -->
<article class="post">
  <header>
    <h2>Post Title</h2>
  </header>
  <p>Content...</p>
</article>

<!-- Avoid -->
<div class="post">
  <div class="title">Post Title</div>
  <div>Content...</div>
</div>
```

**CSS: Use BEM naming or similar:**

```css
/* Good */
.post { }
.post__title { }
.post__content { }
.post--highlighted { }

/* Avoid */
.post { }
.title { }
.content { }
```

## 🧪 Testing Guidelines

### What to Test

1. **Unit Tests**: Individual functions
```javascript
describe('HammingCode', () => {
  it('should encode data into 7 chunks', () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const chunks = HammingCode.encode(data);
    expect(chunks.length).toBe(7);
  });
  
  it('should recover data with 2 missing chunks', () => {
    const chunks = [d1, null, d3, d4, p1, null, p3];
    const recovered = HammingCode.decode(chunks);
    expect(recovered).toEqual(originalData);
  });
});
```

2. **Integration Tests**: Component interactions
```javascript
describe('P2PConnection', () => {
  it('should establish connection between peers', async () => {
    const peer1 = new P2PConnection('peer1', signaling1);
    const peer2 = new P2PConnection('peer2', signaling2);
    
    await peer1.connectToPeer('peer2');
    // Wait for connection
    await waitForConnection();
    
    expect(peer1.connections.has('peer2')).toBe(true);
  });
});
```

3. **Manual Testing Checklist**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on mobile
- [ ] Works with slow network
- [ ] Works with 10+ peers
- [ ] Handles connection failures gracefully

## 🐛 Reporting Bugs

### Before Reporting

1. Search existing issues
2. Check if it's already fixed in `main` branch
3. Try to reproduce in different browsers

### Bug Report Template

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- Browser: Chrome 119
- OS: macOS 14.1
- Version: main branch, commit abc123

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

We love new ideas! Use this template:

```markdown
## Feature Description
Clear description of the feature

## Problem It Solves
What pain point does this address?

## Proposed Solution
How would you implement it?

## Alternatives Considered
Other approaches you thought about

## Additional Context
Mockups, examples, etc.
```

## 📚 Resources

### Learning WebRTC
- [WebRTC for Beginners](https://webrtc.org/getting-started/overview)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### P2P Networking
- [IPFS Documentation](https://docs.ipfs.io/)
- [Gun.js Guide](https://gun.eco/docs/)
- [LibP2P Concepts](https://docs.libp2p.io/concepts/)

### Cryptography
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Practical Cryptography](https://cryptobook.nakov.com/)

### Error Correction
- [Hamming Codes Explained](https://en.wikipedia.org/wiki/Hamming_code)
- [Reed-Solomon Codes](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction)

## 🏆 Recognition

We recognize contributors in several ways:

- **README**: All contributors listed
- **Releases**: Credited in release notes
- **Website**: Featured on project website
- **Swag**: Stickers/shirts for major contributors (when we have budget!)

## 📜 Code of Conduct

### Our Pledge

We're committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

✅ **Do:**
- Be respectful and constructive
- Welcome newcomers
- Focus on what's best for the community
- Accept constructive criticism gracefully
- Credit others for their work

❌ **Don't:**
- Harass or discriminate
- Use inappropriate language
- Make personal attacks
- Publish others' private information
- Engage in trolling or inflammatory behavior

### Enforcement

Violations will result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report issues to: conduct@p2p-social.org

## ❓ Questions?

### Where to Ask

- **General questions**: [GitHub Discussions](https://github.com/p2p-social/p2p-social/discussions)
- **Technical questions**: [Stack Overflow](https://stackoverflow.com) with tag `p2p-social`
- **Private matters**: hello@p2p-social.org

### Response Times

- Critical bugs: Within 24 hours
- Feature discussions: Within 3 days
- General questions: When maintainers are available

We're a volunteer project, so please be patient!

## 🎖️ Current Maintainers

- **@maintainer1** - Core architecture
- **@maintainer2** - UI/UX
- **@maintainer3** - Networking
- **@maintainer4** - Documentation

Want to become a maintainer? Contribute consistently for 3+ months!

## 📊 Project Roadmap

### Phase 1: MVP (Current)
- [x] Basic architecture
- [ ] WebRTC mesh networking
- [ ] Firebase signaling
- [ ] Hamming code implementation
- [ ] Simple UI

### Phase 2: Social Features
- [ ] User profiles
- [ ] Follow/unfollow
- [ ] Feeds
- [ ] Search
- [ ] Notifications

### Phase 3: Polish
- [ ] Media support
- [ ] Mobile app
- [ ] Performance optimization
- [ ] Comprehensive tests

### Phase 4: Advanced
- [ ] E2E encryption
- [ ] Communities
- [ ] Moderation tools
- [ ] Analytics

## 🎉 First Contribution Ideas

Not sure where to start? Try these:

### Easy (< 2 hours)
- Fix typos in documentation
- Add code comments
- Improve error messages
- Write unit tests

### Medium (2-8 hours)
- Implement UI components
- Add input validation
- Improve mobile responsiveness
- Write integration tests

### Hard (8+ hours)
- Optimize WebRTC connection management
- Implement Hamming decoder
- Build peer discovery algorithm
- Create comprehensive testing framework

## 🙏 Thank You!

Every contribution, no matter how small, helps build a better internet.

**Let's decentralize social media together!**

---

*Remember: The best way to predict the future is to invent it.*

Got questions? Open a discussion or reach out!
