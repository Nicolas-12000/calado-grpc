# Calado · el Rin en Kaub, por gRPC

**Demo:** [calado-grpc.vercel.app](https://calado-grpc.vercel.app/) · **Código:** [github.com/Nicolas-12000/calado-grpc](https://github.com/Nicolas-12000/calado-grpc)

Taller de **Programación Web** (gRPC). Caso de estudio: nivel del Rin en **Kaub** (Alemania), el punto
del río que frena barcazas cuando el calado baja. Datos públicos de [Pegelonline (WSV)](https://www.pegelonline.wsv.de/), sin API key.

**Autor:** Nicolás Alejandro García Pasmiño

## Caso de estudio: por qué Kaub y por qué gRPC

En el Rin, **Kaub** no es un punto cualquiera: es el cuello de botella entre los puertos del norte (ARA) y la industria del sur de Alemania, Suiza y Francia. Cuando el **calado** baja, las barcazas no desaparecen de un día para otro: primero **cargan menos** (a veces una fracción de la capacidad), suben los fletes y el río deja de ser la vía barata para químicos, combustibles, acero o contenedores. En la práctica, operadores y compradores miran la **misma referencia** que publica el WSV en [Pegelonline](https://www.pegelonline.wsv.de/) — y la frontera operativa que usamos en la UI (~**78 cm**) es el orden de magnitud en el que la logística empieza a apretar (investigación del [Kiel Institute](https://www.ifw-kiel.de/) y cobertura reciente en [DW](https://www.dw.com/en/rhine-river-drought-germany-economy-recovery-shipping-climate-change/a-78300076) lo enlazan con producción industrial y costos de transporte).

**Qué problema “resuelve” el taller (a nivel de software):** no predecimos el clima ni sustituimos a Pegelonline. Lo que modelamos es cómo una **aplicación web** consume una serie temporal **con contrato fijo**, **tipos fuertes** y **dos patrones de lectura** distintos:

1. **Histórico del mes (unario)** — un dashboard quiere la serie completa de una vez, con pocos round-trips y payload compacto (Protobuf vs JSON).
2. **Semana en streaming** — el mismo contrato, pero el servidor **emite medición a medición**: útil para ver cómo baja o sube el nivel en el tiempo, parecido a un monitor que va pintando puntos sin mandar un JSON gigante de golpe.

Elegimos **datos reales y públicos** para que el demo no sea un `Hello World`: los valores vienen con huecos (sentinelas negativos en la API), hay que **normalizarlos** antes de serializar `uint32` en el `.proto`, y eso justifica hablar de **validación en el borde del servicio RPC**. La temática del río hace memorable la sustentación; gRPC/Connect explica **por qué** no basta un `fetch` anónimo a un JSON sin contrato cuando crece el número de consumidores o de campos.

En una frase para el profe: *“Kaub convierte un problema logístico real en un caso donde importan el `.proto`, el binario y la diferencia entre pedir el mes entero o recibir el stream hora a hora.”*

## Qué demuestra el proyecto (rúbrica típica)

| Requisito | Cómo se cumple |
|-----------|----------------|
| Contrato **IDL** | `proto/calado/v1/calado.proto` — `CaladoService` con `GetHistory` (unario) y `Replay` (server streaming) |
| **Protobuf** binario | Cliente con `useBinaryFormat: true` (`src/lib/client.ts`); comparación de tamaño PB vs JSON en la UI |
| **RPC unario** | Un mensaje con ~30 días de mediciones |
| **RPC streaming** | El servidor emite cada `Reading` en secuencia (time-lapse de la semana) |
| Cliente tipado | Código generado con `buf generate` → `@/gen/...` |
| Despliegue | Next.js en Vercel; API en `src/app/api/rpc/[...path]/route.ts` |

## Connect-RPC vs gRPC “de libro”

No es contradictorio: el **modelo** es gRPC (servicio, métodos, tipos, streaming). El **transporte** en web + Vercel es **Connect** sobre HTTP, no un listener `grpc://` con HTTP/2 gRPC nativo (lo habitual entre microservicios en K8s).

- **Sí:** mismo `.proto`, rutas `/calado.v1.CaladoService/GetHistory`, cuerpo Protobuf, unario + server stream.
- **No:** no esperes `grpcurl` contra un puerto 50051 en Vercel; ahí haría falta un segundo host (p. ej. Cloud Run) con `@connectrpc/connect-node` o gRPC clásico.

En sustentación: *“Contrato y semántica gRPC; Connect por restricciones del navegador y serverless.”*

## Correr en local

```bash
pnpm install   # o npm install
pnpm run dev   # buf generate + Next en :3000
```

## Desplegar en Vercel

1. Importar el repo; framework **Next.js**.
2. Build: `pnpm run build` (o `npm run build`) — ya incluye `buf generate`.
3. Sin variables de entorno obligatorias.
4. Si usas pnpm, activarlo en el proyecto de Vercel (lockfile `pnpm-lock.yaml`).

## Mapa del código

- Contrato: `proto/calado/v1/calado.proto` (también en la app: `/api/contract`)
- Servidor RPC: `src/app/api/rpc/[...path]/route.ts`
- Origen de datos: `src/lib/pegel.ts` (caché ~2 días para el mes; fetch fresco para streaming)
- Caché del mes en navegador: `src/lib/month-cache.ts`
- Cliente: `src/lib/client.ts`
- UI: `src/components/Dashboard.tsx`

## Nota sobre “tiempo real”

Las mediciones en Kaub se publican cada **15 minutos** en Pegelonline. **Streaming** = una consulta a Pegel + reproducción hora a hora por gRPC; no es telemetría continua segundo a segundo.
