// P2P Social - Core Implementation Example
// This demonstrates the key concepts in ~200 lines of code

// ============================================
// 1. CRYPTOGRAPHIC IDENTITY
// ============================================

class Identity {
  static async generate() {
    const keypair = await crypto.subtle.generateKey(
      { name: "Ed25519" },
      true,
      ["sign", "verify"]
    );
    
    const publicKey = await crypto.subtle.exportKey("raw", keypair.publicKey);
    const peer_id = this.bufferToHex(publicKey);
    
    return {
      keypair,
      peer_id,
      publicKey: publicKey
    };
  }
  
  static async sign(message, privateKey) {
    const canonical = JSON.stringify(message, Object.keys(message).sort());
    const signature = await crypto.subtle.sign(
      "Ed25519",
      privateKey,
      new TextEncoder().encode(canonical)
    );
    return this.bufferToHex(signature);
  }
  
  static async verify(message) {
    const { signature, peer_id, ...messageToVerify } = message;
    const canonical = JSON.stringify(
      messageToVerify, 
      Object.keys(messageToVerify).sort()
    );
    
    const publicKey = await crypto.subtle.importKey(
      "raw",
      this.hexToBuffer(peer_id),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    
    return await crypto.subtle.verify(
      "Ed25519",
      publicKey,
      this.hexToBuffer(signature),
      new TextEncoder().encode(canonical)
    );
  }
  
  static bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  static hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}

// ============================================
// 2. HAMMING (7,4) ERROR CORRECTION
// ============================================

class HammingCode {
  static encode(data) {
    // Split data into 4 equal chunks
    const chunkSize = Math.ceil(data.length / 4);
    const d1 = data.slice(0, chunkSize);
    const d2 = data.slice(chunkSize, chunkSize * 2);
    const d3 = data.slice(chunkSize * 2, chunkSize * 3);
    const d4 = data.slice(chunkSize * 3);
    
    // Calculate parity chunks using XOR
    const p1 = this.xor(this.xor(d1, d2), d3);
    const p2 = this.xor(this.xor(d1, d2), d4);
    const p3 = this.xor(this.xor(d1, d3), d4);
    
    return [d1, d2, d3, d4, p1, p2, p3];
  }
  
  static decode(chunks) {
    // Verify we have at least 5 of 7 chunks
    const available = chunks.filter(c => c !== null);
    if (available.length < 5) {
      throw new Error('Need at least 5 of 7 chunks to recover data');
    }
    
    // If all data chunks are present, just concatenate them
    if (chunks[0] && chunks[1] && chunks[2] && chunks[3]) {
      return this.concatenate([chunks[0], chunks[1], chunks[2], chunks[3]]);
    }
    
    // Reconstruct missing data chunks
    const [d1, d2, d3, d4, p1, p2, p3] = chunks;
    
    // Example: If D2 is missing, reconstruct it
    // D2 = D1 ⊕ D3 ⊕ P1 (because P1 = D1 ⊕ D2 ⊕ D3)
    if (!d2 && d1 && d3 && p1) {
      chunks[1] = this.xor(this.xor(d1, d3), p1);
    }
    
    // Similarly for other missing chunks...
    // (Full implementation would handle all cases)
    
    return this.concatenate([chunks[0], chunks[1], chunks[2], chunks[3]]);
  }
  
  static xor(buf1, buf2) {
    const maxLen = Math.max(buf1.length, buf2.length);
    const result = new Uint8Array(maxLen);
    
    for (let i = 0; i < maxLen; i++) {
      result[i] = (buf1[i] || 0) ^ (buf2[i] || 0);
    }
    
    return result;
  }
  
  static concatenate(chunks) {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }
}

// ============================================
// 3. FIREBASE SIGNALING
// ============================================

class SignalingService {
  constructor(firebaseConfig) {
    firebase.initializeApp(firebaseConfig);
    this.database = firebase.database();
    this.peer_id = null;
    this.onOffer = null;
    this.onAnswer = null;
    this.onIceCandidate = null;
  }
  
  async announce(peer_id, capabilities) {
    this.peer_id = peer_id;
    
    await this.database.ref(`/peers/${peer_id}`).set({
      online: true,
      last_seen: Date.now(),
      capabilities: capabilities
    });
    
    // Listen for incoming offers
    this.database.ref(`/signals/${peer_id}/offers`).on('child_added', (snapshot) => {
      const offer = snapshot.val();
      if (this.onOffer) {
        this.onOffer(offer);
      }
    });
    
    // Listen for answers
    this.database.ref(`/signals/${peer_id}/answers`).on('child_added', (snapshot) => {
      const answer = snapshot.val();
      if (this.onAnswer) {
        this.onAnswer(answer);
      }
    });
    
    // Listen for ICE candidates
    this.database.ref(`/signals/${peer_id}/ice`).on('child_added', (snapshot) => {
      const candidate = snapshot.val();
      if (this.onIceCandidate) {
        this.onIceCandidate(candidate);
      }
    });
  }
  
  async sendOffer(target_peer_id, offer) {
    await this.database.ref(`/signals/${target_peer_id}/offers`).push({
      from: this.peer_id,
      offer: offer,
      timestamp: Date.now()
    });
  }
  
  async sendAnswer(target_peer_id, answer) {
    await this.database.ref(`/signals/${target_peer_id}/answers`).push({
      from: this.peer_id,
      answer: answer,
      timestamp: Date.now()
    });
  }
  
  async sendIceCandidate(target_peer_id, candidate) {
    await this.database.ref(`/signals/${target_peer_id}/ice`).push({
      from: this.peer_id,
      candidate: candidate,
      timestamp: Date.now()
    });
  }
  
  async discoverPeers() {
    const snapshot = await this.database.ref('/peers')
      .orderByChild('last_seen')
      .startAt(Date.now() - 60000)
      .once('value');
    
    const peers = [];
    snapshot.forEach((child) => {
      if (child.key !== this.peer_id) {
        peers.push({
          peer_id: child.key,
          ...child.val()
        });
      }
    });
    
    return peers;
  }
  
  startHeartbeat() {
    setInterval(() => {
      this.database.ref(`/peers/${this.peer_id}/last_seen`).set(Date.now());
    }, 30000); // Every 30 seconds
  }
}

// ============================================
// 4. WEBRTC P2P CONNECTION
// ============================================

class P2PConnection {
  constructor(peer_id, signaling) {
    this.peer_id = peer_id;
    this.signaling = signaling;
    this.connections = new Map();
    
    // WebRTC configuration with Google's STUN servers
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    // Set up signaling callbacks
    signaling.onOffer = this.handleOffer.bind(this);
    signaling.onAnswer = this.handleAnswer.bind(this);
    signaling.onIceCandidate = this.handleIceCandidate.bind(this);
  }
  
  async connectToPeer(remote_peer_id) {
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    // Create data channel
    const dataChannel = pc.createDataChannel('data', {
      ordered: true
    });
    
    this.setupDataChannel(dataChannel, remote_peer_id);
    
    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // Send offer via signaling
    await this.signaling.sendOffer(remote_peer_id, offer);
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(remote_peer_id, event.candidate);
      }
    };
    
    this.connections.set(remote_peer_id, { pc, dataChannel });
    
    return dataChannel;
  }
  
  async handleOffer(offerData) {
    const remote_peer_id = offerData.from;
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    // Handle incoming data channel
    pc.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannel(dataChannel, remote_peer_id);
      this.connections.set(remote_peer_id, { pc, dataChannel });
    };
    
    // Set remote description
    await pc.setRemoteDescription(offerData.offer);
    
    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // Send answer via signaling
    await this.signaling.sendAnswer(remote_peer_id, answer);
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(remote_peer_id, event.candidate);
      }
    };
  }
  
  async handleAnswer(answerData) {
    const remote_peer_id = answerData.from;
    const connection = this.connections.get(remote_peer_id);
    
    if (connection) {
      await connection.pc.setRemoteDescription(answerData.answer);
    }
  }
  
  async handleIceCandidate(candidateData) {
    const remote_peer_id = candidateData.from;
    const connection = this.connections.get(remote_peer_id);
    
    if (connection) {
      await connection.pc.addIceCandidate(candidateData.candidate);
    }
  }
  
  setupDataChannel(dataChannel, remote_peer_id) {
    dataChannel.onopen = () => {
      console.log(`Connected to ${remote_peer_id}`);
    };
    
    dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message, remote_peer_id);
    };
    
    dataChannel.onerror = (error) => {
      console.error(`Error with ${remote_peer_id}:`, error);
    };
    
    dataChannel.onclose = () => {
      console.log(`Disconnected from ${remote_peer_id}`);
      this.connections.delete(remote_peer_id);
    };
  }
  
  sendMessage(peer_id, message) {
    const connection = this.connections.get(peer_id);
    if (connection && connection.dataChannel.readyState === 'open') {
      connection.dataChannel.send(JSON.stringify(message));
    }
  }
  
  broadcast(message) {
    for (const [peer_id, connection] of this.connections) {
      if (connection.dataChannel.readyState === 'open') {
        connection.dataChannel.send(JSON.stringify(message));
      }
    }
  }
  
  handleMessage(message, from_peer_id) {
    // Verify signature
    Identity.verify(message).then(isValid => {
      if (!isValid) {
        console.warn('Invalid signature from', from_peer_id);
        return;
      }
      
      // Handle different message types
      switch (message.type) {
        case 'POST':
          this.handlePost(message);
          break;
        case 'REQUEST':
          this.handleRequest(message, from_peer_id);
          break;
        case 'RESPONSE':
          this.handleResponse(message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    });
  }
  
  handlePost(message) {
    console.log('New post from', message.peer_id);
    // Store and display post
  }
  
  handleRequest(message, from_peer_id) {
    console.log('Content request from', from_peer_id);
    // Look up content and send chunks
  }
  
  handleResponse(message) {
    console.log('Received content chunk', message.payload.chunk_number);
    // Reconstruct content
  }
}

// ============================================
// 5. USAGE EXAMPLE
// ============================================

async function example() {
  // 1. Generate identity
  const identity = await Identity.generate();
  console.log('My peer ID:', identity.peer_id);
  
  // 2. Initialize signaling
  const signaling = new SignalingService({
    apiKey: "YOUR_FIREBASE_API_KEY",
    databaseURL: "https://your-project.firebaseio.com"
  });
  
  // 3. Announce presence
  await signaling.announce(identity.peer_id, {
    storage: true,
    relay: true,
    max_connections: 6
  });
  
  signaling.startHeartbeat();
  
  // 4. Initialize P2P connections
  const p2p = new P2PConnection(identity.peer_id, signaling);
  
  // 5. Discover and connect to peers
  const peers = await signaling.discoverPeers();
  console.log('Found peers:', peers.length);
  
  for (const peer of peers.slice(0, 5)) {
    await p2p.connectToPeer(peer.peer_id);
  }
  
  // 6. Create and publish content
  const content = "Hello, decentralized world!";
  const contentBuffer = new TextEncoder().encode(content);
  
  // Encode with Hamming
  const chunks = HammingCode.encode(contentBuffer);
  console.log('Content encoded into', chunks.length, 'chunks');
  
  // Calculate content hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', contentBuffer);
  const contentHash = Identity.bufferToHex(hashBuffer);
  
  // Create post message
  const post = {
    version: "0.1.0",
    type: "POST",
    timestamp: Date.now(),
    peer_id: identity.peer_id,
    payload: {
      content_hash: contentHash,
      content_type: "text/plain",
      content: content
    }
  };
  
  // Sign and broadcast
  post.signature = await Identity.sign(post, identity.keypair.privateKey);
  p2p.broadcast(post);
  
  console.log('Post broadcasted!');
}

// Run the example
// example();

// ============================================
// 6. BROWSER STORAGE
// ============================================

class Storage {
  constructor() {
    this.dbName = 'p2p-social';
    this.db = null;
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('chunks')) {
          db.createObjectStore('chunks', { keyPath: 'chunk_id' });
        }
        
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content', { keyPath: 'content_hash' });
        }
      };
    });
  }
  
  async storeChunk(chunk_id, data) {
    const transaction = this.db.transaction(['chunks'], 'readwrite');
    const store = transaction.objectStore('chunks');
    
    await store.put({
      chunk_id: chunk_id,
      data: data,
      timestamp: Date.now()
    });
  }
  
  async getChunk(chunk_id) {
    const transaction = this.db.transaction(['chunks'], 'readonly');
    const store = transaction.objectStore('chunks');
    
    return new Promise((resolve, reject) => {
      const request = store.get(chunk_id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Identity,
    HammingCode,
    SignalingService,
    P2PConnection,
    Storage
  };
}
