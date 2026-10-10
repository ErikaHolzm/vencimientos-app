# Vencimientos

[![CI](https://github.com/ErikaHolzm/vencimientos-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ErikaHolzm/vencimientos-app/actions/workflows/ci.yml)

App móvil para no olvidarte de lo que vence: la libreta de conducir, el seguro del auto, la cédula, el carné de salud. Cargás un recordatorio con su fecha de vencimiento y la app te avisa con notificaciones antes de que venza.

Proyecto full stack hecho con TypeScript de punta a punta:

- **App móvil** — React Native + Expo (iPhone y Android)
- **API REST** — Node.js + Express
- **Base de datos** — MongoDB (Atlas) con Mongoose

## Qué hace

- Registro e inicio de sesión (cada persona ve solo sus recordatorios).
- Crear, editar y borrar recordatorios con categoría, fecha y avisos (30, 15, 7, 1 días antes o el mismo día).
- Mi cuenta: cambiar la contraseña y eliminar la cuenta (con todos sus datos).
- Renovar un vencimiento: la app propone una nueva fecha (un año más) que se puede ajustar, y los avisos se reprograman solos.
- Pantalla principal con el próximo vencimiento, un resumen y filtros (urgentes, próximos, más adelante).
- Estados por colores según cuánto falta: vencido, urgente (≤ 14 días), próximo (≤ 60 días), al día.
- Notificaciones locales programadas a las 9:00 en el teléfono.

## Arquitectura

```
┌──────────────────────┐   HTTPS + JWT    ┌──────────────────────┐        ┌────────────┐
│  App móvil (Expo)    │ ───────────────► │  API (Express)       │ ─────► │  MongoDB   │
│  - pantallas         │                  │  - validación (zod)  │        │  (Atlas)   │
│  - estado (contexto) │ ◄─────────────── │  - auth (bcrypt/JWT) │ ◄───── │            │
│  - notificaciones    │      JSON        │  - repositorios      │        └────────────┘
└──────────────────────┘                  └──────────────────────┘
```

La app **nunca** habla directo con la base de datos: todo pasa por la API.

```
vencimientos/
├── server/                 API
│   ├── src/
│   │   ├── routes/         endpoints (auth, reminders)
│   │   ├── repositories/   acceso a datos (MongoDB y versión en memoria para tests)
│   │   ├── middleware/     autenticación y manejo de errores
│   │   ├── schemas.ts      validación de entradas con zod
│   │   └── app.ts          arma la app Express
│   └── tests/              tests de integración (Jest + Supertest)
└── mobile/                 app React Native + Expo (pantallas, estado, notificaciones, tests)
```

## Cómo correrlo

Necesitás Node.js 20 o más, una cuenta gratuita de [MongoDB Atlas](https://www.mongodb.com/atlas) (o un MongoDB local) y, para probar en el celular, la app **Expo Go** instalada en el iPhone.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # en Windows: copy .env.example .env
```

Completá `.env`:

- `MONGODB_URI`: la cadena de conexión de tu cluster de Atlas. En Atlas creá un usuario de base de datos con permisos mínimos (solo lectura/escritura sobre esta base) y agregá tu IP a la lista de accesos.
- `JWT_SECRET`: un secreto aleatorio de 32+ caracteres. Generalo con
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Después:

```bash
npm run dev                 # API en http://localhost:4000
npm test                    # tests (no tocan tu base de Atlas; la primera vez descargan un MongoDB temporal de ~100 MB)
npm run typecheck           # revisión de tipos
```

### 2. App móvil

Con la API del paso anterior corriendo, en otra terminal:

```bash
cd mobile
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npx expo start
```

Abrí `mobile/.env` y poné la IP de tu computadora en la red local (ver abajo). Después escaneá el código QR con la cámara del iPhone para abrirla en **Expo Go** (hay que iniciar sesión con la misma cuenta de Expo en el teléfono y en la computadora con `npx expo login`).

**Importante:** en el teléfono, `localhost` es el propio teléfono. En `mobile/.env` poné la IP de tu computadora (por ejemplo `EXPO_PUBLIC_API_URL=http://192.168.1.20:4000`). El teléfono y la computadora tienen que estar en la misma red. Si tu computadora tiene redes virtuales (Hyper-V, Docker) y el QR no conecta, arrancá Expo indicando la IP correcta, por ejemplo en PowerShell: `$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.1.20"; npx expo start`.

Tests de la lógica de la app (fechas, estados y avisos):

```bash
cd mobile
npm test
npm run typecheck
```

## Demo en línea (Vercel)

La app también corre en el navegador (Expo para web) y la API se publica como función de Vercel, ambas desde este mismo repositorio. Son **dos proyectos de Vercel** que apuntan al mismo repo:

| Proyecto | Root Directory | Cómo se construye | Variables de entorno |
| --- | --- | --- | --- |
| API | `server` | Vercel detecta `server/server.ts` (Express) sin configuración | `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS` (la URL de la web), `TRUST_PROXY=1` |
| Web | `mobile` | `mobile/vercel.json` (`npx expo export -p web`, salida en `dist`) | `EXPO_PUBLIC_API_URL` (la URL de la API) |

Para probarla localmente en el navegador: `cd mobile`, `npx expo install react-dom react-native-web @expo/metro-runtime` (una sola vez) y `npx expo start --web`.

Diferencias de la versión web respecto al teléfono:

- **Sin notificaciones**: las programa el sistema del teléfono y el navegador no puede hacerlo sin la pestaña abierta. Las funciones quedan desactivadas en la web.
- **Sesión en `sessionStorage`**: el almacén seguro (Keychain) no existe en la web. El token se borra al cerrar la pestaña.
- **Calendario del navegador** (`<input type="date">`) y diálogos del navegador para confirmar y avisar (`lib/dialogs.ts`).

Notas de seguridad de la demo pública:

- En Atlas hay que permitir el acceso desde cualquier IP (`0.0.0.0/0`), porque Vercel usa direcciones dinámicas. Por eso el usuario de base de datos tiene permisos solo de lectura y escritura sobre `vencimientos` (no administrador), una contraseña larga y aleatoria, y un `JWT_SECRET` propio de producción.
- El límite de intentos guarda sus contadores en memoria de cada instancia. En una función serverless, con varias instancias, es una barrera parcial: para producción real haría falta un almacén compartido (Redis o Mongo) o el firewall de la plataforma.
- El registro está abierto: cualquiera puede crear una cuenta en la demo.

## API

Todas las rutas de `/api/reminders` requieren el header `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Crea la cuenta. Devuelve `{ token, user }` |
| POST | `/api/auth/login` | Inicia sesión. Devuelve `{ token, user }` |
| POST | `/api/auth/logout` | Cierra sesión: el token deja de servir (requiere token) |
| POST | `/api/auth/change-password` | Cambia la contraseña con `{ currentPassword, newPassword }`; cierra las demás sesiones y devuelve un token nuevo |
| DELETE | `/api/auth/account` | Elimina la cuenta y sus recordatorios; pide `{ password }` |
| GET | `/api/reminders` | Lista los recordatorios del usuario, ordenados por fecha |
| POST | `/api/reminders` | Crea un recordatorio |
| PUT | `/api/reminders/:id` | Reemplaza un recordatorio |
| DELETE | `/api/reminders/:id` | Borra un recordatorio |
| GET | `/health` | Estado del servicio |

Ejemplo de cuerpo para crear un recordatorio:

```json
{
  "title": "Renovar libreta de conducir",
  "category": "licencia",
  "dueDate": "2026-12-15",
  "remindDaysBefore": [30, 7, 1]
}
```

Los errores tienen siempre la forma `{ "error": { "message": "...", "details": [...] } }`.

## Decisiones de seguridad

- **Contraseñas** guardadas con hash bcrypt (nunca en texto). Largo mínimo de 10 y máximo de 72 caracteres (el límite de bcrypt, para no truncar en silencio).
- **JWT** firmado con HS256, con el algoritmo fijado al verificar (se rechazan tokens `alg: none` o firmados con otro secreto) y con vencimiento.
- **Sin enumeración de usuarios**: login responde igual si el email no existe o si la contraseña está mal, y tarda lo mismo en ambos casos.
- **Sesiones revocables**: cada usuario tiene una versión de token que viaja dentro del JWT. Cerrar sesión o cambiar la contraseña la incrementa, así que los tokens anteriores dejan de funcionar aunque no hayan vencido (el servidor lo comprueba en cada pedido autenticado). Un token robado deja de servir al cambiar la contraseña.
- **Acciones sensibles piden la contraseña**: cambiar la contraseña y eliminar la cuenta exigen la actual. Si es incorrecta responde 403 (no 401, para no confundirlo con "sesión vencida").
- **Aislamiento entre usuarios**: el `userId` sale siempre del token, nunca del cuerpo ni de la URL. Pedir el recordatorio de otro usuario devuelve 404.
- **Validación estricta** de toda entrada con zod (`.strict()` rechaza campos extra) y límite de 10 KB por petición.
- **Inyección NoSQL**: filtros con tipos fijos, ids validados y `sanitizeFilter` activado en Mongoose.
- **Límite de intentos**: global y más estricto en login/registro (contra fuerza bruta).
- **Cabeceras de seguridad** con Helmet, CORS cerrado por defecto y errores internos sin detalles hacia afuera.
- **Secretos** solo en variables de entorno; el servidor no arranca si falta alguno o es débil.
- **En el teléfono**, el token se guarda en SecureStore (Keychain en iOS), no en almacenamiento común.

## Decisiones técnicas y límites conocidos

- **Repositorios con interfaz**: las rutas dependen de `UserRepo` y `ReminderRepo`, no de MongoDB. Los tests de la API usan una versión en memoria (rápidos) y producción usa Mongoose. Para que esa réplica sea confiable, hay tests de contrato que corren las mismas pruebas contra las dos versiones, la segunda sobre un MongoDB real temporal (`mongodb-memory-server`): índice único de email, aislamiento entre usuarios, ids inválidos e intentos de inyección de operadores.
- **Notificaciones locales** en lugar de push desde el servidor: las programa el propio sistema del teléfono, así que no necesitan conexión, ni que el servidor esté encendido, ni cuenta de desarrollador de Apple. Se reprograman cada vez que cambia la lista. iOS permite ~64 pendientes, por eso se programan las 60 más próximas. Límite: si creás un recordatorio desde otro dispositivo, este se entera (y programa el aviso) la próxima vez que abrís la app.
- **Fechas como texto `AAAA-MM-DD`**: un vencimiento es un día de calendario, no un instante; así se evitan errores de zona horaria.
- **Un solo token de sesión (7 días)**, sin refresh tokens. La revocación se resuelve con la versión de token (un dato más en el usuario y una lectura por pedido); a cambio no hace falta una lista de tokens revocados.

## Pruebas de calidad

Además de los tests automáticos, se probaron a mano casos límite desde la app y la API. Algunos hallazgos:

| Caso probado | Resultado | Estado |
| --- | --- | --- |
| Fecha de vencimiento de hace años (2023) | Se aceptaba cualquier fecha existente | Corregido: solo se permite desde 1 año atrás hasta 50 años adelante. Se valida en el servidor (con test) y el selector de fecha de la app ya no deja elegir fuera de ese rango |
| Fecha inexistente (`2026-02-31`) | Rechazada con 400 | Cubierto por test |
| Fecha del año 1900 o 9999 | Rechazada con 400 | Cubierto por test |
| Título vacío o de más de 120 caracteres | Rechazado con 400 | Cubierto por test |
| Pedir, editar o borrar el recordatorio de otro usuario | 404, sin revelar si existe | Cubierto por test |
| Token vencido, firmado con otro secreto o sin firma (`alg: none`) | 401 | Cubierto por test |
| Más de 20 intentos de login seguidos | 429 | Cubierto por test |

Límite conocido: como el rango se cuenta desde hoy, un recordatorio que lleva más de un año vencido ya no se puede editar sin cambiar su fecha (se puede borrar o marcar como renovado).

## Qué mejoraría después

- Refresh tokens con rotación (hoy la sesión dura 7 días y se revoca en bloque).
- Bloqueo temporal por cuenta tras varios intentos fallidos (hoy el límite es por IP) y rechazo de contraseñas comunes.
- Notificaciones push desde el servidor (APNs/FCM) para sincronizar varios dispositivos.
- Modo sin conexión con cola de cambios pendientes.
- Tests de extremo a extremo de la app (Detox o Maestro).
- Adjuntar foto del documento y recordar el costo del trámite.
