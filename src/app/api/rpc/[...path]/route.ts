import { createConnectRouter } from "@connectrpc/connect";
import { universalServerRequestFromFetch, universalServerResponseToFetch } from "@connectrpc/connect/protocol";
import { CaladoService } from "@/gen/calado/v1/calado_pb";
import { fetchReadings } from "@/lib/pegel";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const router = createConnectRouter({});
router.service(CaladoService, {
  async getHistory(req) {
    return { readings: await fetchReadings(req.days) };
  },
  async *replay(req) {
    for (const r of await fetchReadings(req.days)) {
      yield r;
      await new Promise((ok) => setTimeout(ok, 35));
    }
  },
});

const handlers = new Map(router.handlers.map((h) => [h.requestPath, h]));

export async function POST(req: Request) {
  const path = new URL(req.url).pathname.replace(/^\/api\/rpc/, "");
  const handler = handlers.get(path);
  if (!handler) return new Response("RPC no encontrado", { status: 404 });
  const res = await handler(await universalServerRequestFromFetch(req, {}));
  return universalServerResponseToFetch(res);
}
