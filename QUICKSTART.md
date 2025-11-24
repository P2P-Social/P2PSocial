# Quick Start - P2P Social

Get your decentralized social network running in **5 minutes**.

## Step 1: Create Firebase Project (2 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add Project"
3. Name it: `p2p-social-test`
4. Disable Google Analytics (not needed)
5. Click "Create Project"

## Step 2: Enable Realtime Database (1 minute)

1. In Firebase Console, click "Realtime Database" in left menu
2. Click "Create Database"
3. Choose location (closest to you)
4. Start in **Test Mode** (public access - fine for testing)
5. Click "Enable"

## Step 3: Get Firebase Config (1 minute)

1. Click the gear icon → "Project Settings"
2. Scroll to "Your apps" → Click web icon `</>`
3. Name it: `p2p-social-web`
4. Don't enable Firebase Hosting
5. Copy the `firebaseConfig` object

## Step 4: Clone and Setup (1 minute)

```bash
# Create project directory
mkdir p2p-social
cd p2p-social

# Create index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>P2P Social - Local Test</title>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js"></script>
</head>
<body>
  <h1>P2P Social Network</h1>
  <div id="status">Initializing...</div>
  <div id="peer-id"></div>
  <div id="connections"></div>
  
  <div>
    <textarea id="message" placeholder="Write a message..."></textarea>
    <button onclick="sendMessage()">Send to Network</button>
  </div>
  
  <div id="messages"></div>
  
  <script src="app.js"></script>
</body>
</html>
EOF

# Create app.js with your Firebase config
cat > app.js << 'EOF'
// REPLACE THIS with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Generate simple peer ID
const peerId = 'peer_' + Math.random().toString(36).substr(2, 9);
document.getElementById('peer-id').textContent = 'My ID: ' + peerId;

// Announce presence
database.ref('peers/' + peerId).set({
  online: true,
  timestamp: Date.now()
});

// Keep alive
setInterval(() => {
  database.ref('peers/' + peerId + '/timestamp').set(Date.now());
}, 10000);

// Listen for other peers
database.ref('peers').on('value', (snapshot) => {
  const peers = snapshot.val();
  const peerCount = Object.keys(peers || {}).length - 1;
  document.getElementById('connections').textContent = 
    'Connected peers: ' + peerCount;
});

// Send message
function sendMessage() {
  const text = document.getElementById('message').value;
  if (!text) return;
  
  database.ref('messages').push({
    from: peerId,
    text: text,
    timestamp: Date.now()
  });
  
  document.getElementById('message').value = '';
}

// Listen for messages
database.ref('messages').limitToLast(50).on('child_added', (snapshot) => {
  const msg = snapshot.val();
  const div = document.createElement('div');
  div.textContent = `[${msg.from}]: ${msg.text}`;
  document.getElementById('messages').appendChild(div);
});

document.getElementById('status').textContent = 'Connected!';
EOF
```

## Step 5: Update Firebase Config

Open `app.js` and replace the `firebaseConfig` object with yours from Step 3.

## Step 6: Run It!

```bash
# Start local server
python -m http.server 8000

# Open in browser
open http://localhost:8000

# Or manually go to:
# http://localhost:8000
```

## Step 7: Test It!

1. Open `http://localhost:8000` in TWO browser tabs
2. You should see "Connected peers: 1" in each tab
3. Type a message in one tab and hit "Send to Network"
4. You should see it appear in BOTH tabs!

**🎉 Congratulations! You just created a peer-to-peer network!**

---

## What Just Happened?

1. Each browser tab registered as a "peer" in Firebase
2. They discovered each other via Firebase's realtime database
3. Messages are distributed through Firebase (not ideal, but it works!)
4. Next step: Add WebRTC for TRUE peer-to-peer (no Firebase for content)

---

## Next Steps

### Add WebRTC for True P2P

See `example.js` for complete implementation with:
- Direct browser-to-browser connections
- Hamming code redundancy
- Cryptographic signatures
- Content addressing

### Improve UI

Add CSS, better UX, profile pictures, etc.

### Add Features

- User profiles
- Follow/unfollow
- Image uploads
- Encryption
- Groups

---

## Common Issues

### "Permission denied" error
→ Check Firebase database rules are set to public (test mode)

### "Cannot read property" error
→ Make sure you replaced the firebaseConfig with your own

### No peers showing up
→ Wait 30 seconds, Firebase can be slow initially

### Messages not appearing
→ Check browser console for errors (F12)

---

## Production Considerations

⚠️ **This quick start uses PUBLIC Firebase access!**

For production, you'll need:
1. Firebase Authentication
2. Proper security rules
3. WebRTC for actual P2P data transfer
4. Hamming codes for redundancy
5. Real UI/UX

See the full `ARCHITECTURE.md` for complete implementation.

---

## Resources

- **Architecture**: See `ARCHITECTURE.md`
- **Protocol**: See `PROTOCOL.md`
- **Example Code**: See `example.js`
- **Contributing**: See `CONTRIBUTING.md`

---

## Troubleshooting

**Q: Can I use this for real?**  
A: This is a proof-of-concept. See full docs for production setup.

**Q: Why is everything going through Firebase?**  
A: This quick start is simplified. WebRTC version is coming!

**Q: How do I add encryption?**  
A: See `example.js` for Web Crypto API implementation.

**Q: Can I deploy this?**  
A: Yes! Just push to GitHub Pages. See `README.md`

---

**Ready to build the real thing? Read `ARCHITECTURE.md`!**
