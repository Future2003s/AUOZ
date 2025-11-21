type SSEClient = WritableStreamDefaultWriter<string>;

type OrderEventType = "created" | "updated";
export interface OrderEventPayload {
  type: OrderEventType;
  id?: string | null;
  status?: string;
  at: number;
  [key: string]: any;
}

const clients = new Set<SSEClient>();

export function addSSEClient(writer: SSEClient) {
  clients.add(writer);
}

export function removeSSEClient(writer: SSEClient) {
  clients.delete(writer);
}

function broadcast(eventName: string, payload: any) {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  const encoder = new TextEncoder();
  clients.forEach(async (writer) => {
    try {
      await writer.write(encoder.encode(`event: ${eventName}\ndata: ${data}\n\n`) as any);
    } catch {
      clients.delete(writer);
    }
  });
}

export function emitOrderEvent(payload: OrderEventPayload) {
  broadcast("order", payload);
}
