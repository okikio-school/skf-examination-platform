import { serve } from 'https://deno.land/std/http/server.ts';
import { acceptWebSocket, WebSocket } from 'https://deno.land/std/ws/mod.ts';

const server = serve({ port: 8000 });
console.log('Server started on port 8000');

for await (const req of server) {
  if (req.url === '/ws') {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    })
      .then(handleWebSocket)
      .catch((err) => {
        console.error(`Failed to accept WebSocket: ${err}`);
      });
  } else {
    req.respond({ body: 'WebSocket server is running' });
  }
}

async function handleWebSocket(socket: WebSocket) {
  console.log('WebSocket connected');

  for await (const event of socket) {
    if (typeof event === 'string') {
      console.log('Message received:', event);
      socket.send(`You said: ${event}`);
    } else if (event instanceof Uint8Array) {
      console.log('Binary data received:', event);
    } else if (event instanceof Deno.EOF) {
      console.log('WebSocket closed');
    }
  }
}