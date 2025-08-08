import express from 'express';
import ngrok from 'ngrok';

// Simple test server to verify webhook setup
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'test'
  });
});

app.post('/webhook', (req, res) => {
  console.log('✅ Webhook received:', {
    timestamp: new Date().toISOString(),
    body: req.body
  });
  res.status(200).json({ ok: true });
});

async function startTestServer() {
  try {
    console.log('🧪 Starting test webhook server...');
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`✅ Test server running on port ${PORT}`);
    });
    
    // Start ngrok tunnel
    console.log('🌐 Creating ngrok tunnel...');
    const url = await ngrok.connect(PORT);
    console.log(`✅ Public URL: ${url}`);
    console.log(`🔗 Webhook URL: ${url}/webhook`);
    console.log(`💚 Health check: ${url}/health`);
    
    console.log('\n📝 Instructions:');
    console.log('1. Copy the webhook URL above');
    console.log('2. Set it in your Telegram bot settings');
    console.log('3. Send a message to your bot to test');
    console.log('4. Press Ctrl+C to stop');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down test server...');
      server.close();
      await ngrok.disconnect();
      await ngrok.kill();
      console.log('✅ Test server stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error);
    process.exit(1);
  }
}

startTestServer();