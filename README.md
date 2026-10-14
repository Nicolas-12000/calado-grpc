# Calado · el Rin en Kaub, por gRPC

Taller gRPC (Programación Web). Caso de estudio: nivel del Rin en **Kaub** (Alemania), el punto del río
que decide si las barcazas cargan completo. Datos reales de Pegelonline, sin clave.

## Correr
    npm install
    npm run dev      # genera código desde el .proto y arranca en :3000

## Desplegar en Vercel
Sube el repo y ya: `npm run build` ejecuta `buf generate` antes de `next build`.

## Por qué Connect y no un servidor gRPC "puro"
Vercel (funciones serverless) no expone HTTP/2 gRPC nativo. **Connect-RPC** usa el mismo `.proto`,
serializa en **Protobuf binario**, soporta **server streaming** y funciona sobre Next. Si el taller exige
el protocolo gRPC estricto, el mismo servicio se puede montar en Cloud Run/Fly con `@connectrpc/connect-node`.

## Mapa del taller
- Contrato: `proto/calado/v1/calado.proto`
- Servidor: `src/app/api/rpc/[...path]/route.ts` (unario + streaming)
- Cliente tipado: `src/lib/client.ts`
- UI: `src/components/Dashboard.tsx`
