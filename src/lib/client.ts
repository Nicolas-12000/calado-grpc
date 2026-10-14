import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { CaladoService } from "@/gen/calado/v1/calado_pb";

// useBinaryFormat: el cuerpo viaja en Protobuf binario, no en JSON.
export const calado = createClient(
  CaladoService,
  createConnectTransport({ baseUrl: "/api/rpc", useBinaryFormat: true }),
);
