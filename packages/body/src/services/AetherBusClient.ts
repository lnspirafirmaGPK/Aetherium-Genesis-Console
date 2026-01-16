export interface IntentPayload {
    vibe_state: {
      mood: string;
      energy_level: number;
      urgency: number;
    };
    render_params: {
      geometry: string;
      chroma_primary: string;
      chroma_secondary: string;
      pulse_frequency: number;
      bloom_factor: number;
    };
}

export class AetherBusClient {
    private ws: WebSocket;
    private messageHandler: ((payload: IntentPayload) => void) | null = null;

    constructor(url: string) {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('Connected to AetherBus');
        };

        this.ws.onmessage = (event) => {
            try {
                // MCP Payload Parsing
                const data = JSON.parse(event.data);

                // Validate MCP Structure
                if (data.jsonrpc === "2.0" && data.method && data.params) {
                    // Extract the Intent Payload from params.arguments
                    const intent = data.params.arguments;
                    if (this.messageHandler) {
                        this.messageHandler(intent);
                    }
                } else {
                    console.warn("Received non-MCP payload:", data);
                }
            } catch (e) {
                console.error('Failed to parse Intent:', e);
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected from AetherBus');
        };
    }

    public onMessage(handler: (payload: IntentPayload) => void) {
        this.messageHandler = handler;
    }

    public close() {
        this.ws.close();
    }
}
