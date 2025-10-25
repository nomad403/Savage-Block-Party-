// Serveur DMX simulé pour les tests
// Ce fichier peut être utilisé avec Node.js pour simuler un serveur DMX

const WebSocket = require('ws');

class DMXServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.dmxUniverse = new Array(512).fill(0);
    this.fixtures = new Map();
    this.scenes = new Map();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    console.log(`🎛️ Serveur DMX démarré sur le port ${this.port}`);
    
    this.wss.on('connection', (ws) => {
      console.log('🎛️ Client DMX connecté');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('🎛️ Erreur parsing message DMX:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🎛️ Client DMX déconnecté');
      });
      
      ws.on('error', (error) => {
        console.error('🎛️ Erreur WebSocket DMX:', error);
      });
    });
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'init':
        console.log(`🎛️ Initialisation univers DMX ${message.universe}`);
        ws.send(JSON.stringify({
          type: 'init_success',
          universe: message.universe,
          fixtures: Array.from(this.fixtures.values())
        }));
        break;
        
      case 'dmx_data':
        this.updateDMXUniverse(message.universe, message.channels);
        this.broadcastDMXData(message.universe, message.channels);
        break;
        
      case 'add_fixture':
        this.fixtures.set(message.fixture.id, message.fixture);
        console.log(`🎛️ Fixture ajoutée: ${message.fixture.name}`);
        break;
        
      case 'trigger_scene':
        this.triggerScene(message.sceneId);
        break;
        
      default:
        console.log('🎛️ Message DMX non reconnu:', message.type);
    }
  }

  updateDMXUniverse(universe, channels) {
    if (universe === 1) {
      channels.forEach((value, index) => {
        if (index < 512) {
          this.dmxUniverse[index] = value;
        }
      });
    }
  }

  broadcastDMXData(universe, channels) {
    const broadcastMessage = JSON.stringify({
      type: 'dmx_update',
      universe: universe,
      channels: channels,
      timestamp: Date.now()
    });
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMessage);
      }
    });
  }

  triggerScene(sceneId) {
    const scene = this.scenes.get(sceneId);
    if (scene) {
      console.log(`🎛️ Scène déclenchée: ${scene.name}`);
      // Implémenter la logique de scène
    }
  }

  // Simuler des données DMX pour les tests
  simulateAudioReaction() {
    setInterval(() => {
      // Simuler des réactions audio
      const bass = Math.floor(Math.random() * 255);
      const mid = Math.floor(Math.random() * 255);
      const treble = Math.floor(Math.random() * 255);
      
      const channels = new Array(512).fill(0);
      
      // Simuler quelques fixtures
      channels[1] = bass;    // Dimmer
      channels[2] = bass;    // Rouge
      channels[3] = mid;     // Vert
      channels[4] = treble;  // Bleu
      
      this.broadcastDMXData(1, channels);
    }, 100); // 10 FPS
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('🎛️ Serveur DMX arrêté');
    }
  }
}

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  const server = new DMXServer();
  server.start();
  
  // Simuler des réactions audio pour les tests
  server.simulateAudioReaction();
  
  // Arrêt propre
  process.on('SIGINT', () => {
    console.log('\n🎛️ Arrêt du serveur DMX...');
    server.stop();
    process.exit(0);
  });
}

module.exports = DMXServer;
