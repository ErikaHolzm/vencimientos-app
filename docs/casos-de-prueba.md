# Casos de prueba — Vencimientos

Documento de pruebas de la app (API + app móvil). Tipo **Auto** = lo cubre un test automático (se corre en cada push con GitHub Actions); **Manual** = probado a mano en un iPhone (Expo Go) o en la demo web. Última revisión: 1 de noviembre de 2026.

Estados: **Pasó** (se comporta como se espera), **Corregido** (se encontró un error, se arregló y se volvió a probar), **Pendiente** (todavía no se probó).

## 1. Cuenta y sesión (API)

| ID | Caso | Pasos | Resultado esperado | Tipo | Estado |
| --- | --- | --- | --- | --- | --- |
| CP-01 | Registro correcto | Registrarse con email y contraseña válidos | Se crea la cuenta y devuelve un token, sin exponer la contraseña ni su hash | Auto | Pasó |
| CP-02 | Email repetido | Registrarse dos veces con el mismo email | 409 | Auto | Pasó |
| CP-03 | Contraseña corta | Registrarse con menos de 10 caracteres | 400 con mensaje claro | Auto | Pasó |
| CP-04 | Email inválido | Registrarse con `abc` como email | 400 | Auto | Pasó |
| CP-05 | Campos no esperados | Enviar un campo extra en el registro | 400 (el esquema es estricto) | Auto | Pasó |
| CP-06 | JSON roto | Enviar un cuerpo que no es JSON válido | 400, sin error interno | Auto | Pasó |
| CP-07 | Login con datos incorrectos | Contraseña mala / usuario inexistente | Mismo error en ambos casos (no revela si el email existe) | Auto | Pasó |
| CP-08 | Intentos de login excesivos | Más de 20 intentos seguidos | 429 | Auto | Pasó |
| CP-09 | Cerrar sesión | Cerrar sesión y reusar el token | El token viejo deja de servir; entrar de nuevo funciona | Auto | Pasó |
| CP-10 | Cambiar contraseña | Cambiarla con la actual correcta / incorrecta | Correcta: el token viejo se invalida y llega uno nuevo. Incorrecta: 403 y no cambia nada | Auto | Pasó |
| CP-11 | Eliminar cuenta | Eliminarla con contraseña correcta / incorrecta | Correcta: se borran cuenta y recordatorios. Incorrecta: 403 y no se borra nada. No toca datos de otros | Auto | Pasó |

## 2. Seguridad de acceso (API)

| ID | Caso | Pasos | Resultado esperado | Tipo | Estado |
| --- | --- | --- | --- | --- | --- |
| CP-12 | Sin token | Pedir recordatorios sin autenticarse | 401 | Auto | Pasó |
| CP-13 | Token basura | Enviar un token inventado | 401 | Auto | Pasó |
| CP-14 | Token firmado con otro secreto | Enviar un token válido pero de otro firmante | 401 | Auto | Pasó |
| CP-15 | Token vencido | Enviar un token expirado | 401 | Auto | Pasó |
| CP-16 | Token sin firma (`alg: none`) | Enviar un token sin firma | 401 | Auto | Pasó |
| CP-17 | Datos de otro usuario | Ver, editar o borrar el recordatorio de otra persona | 404, sin revelar si existe | Auto | Pasó |
| CP-18 | `userId` en el cuerpo | Enviar un `userId` ajeno al crear | Se rechaza por campo no permitido | Auto | Pasó |

## 3. Recordatorios y fechas (API)

| ID | Caso | Pasos | Resultado esperado | Tipo | Estado |
| --- | --- | --- | --- | --- | --- |
| CP-19 | Ciclo completo | Crear, listar, editar y borrar | Cada paso funciona; la lista viene ordenada por fecha | Auto | Pasó |
| CP-20 | Título vacío o de más de 120 caracteres | Guardar con esos títulos | 400 | Auto | Pasó |
| CP-21 | Fecha inexistente | Guardar `2026-02-31` | 400 | Auto | Pasó |
| CP-22 | Fecha extrema | Guardar año 1900 o 9999 | 400 | Auto | Pasó |
| CP-23 | Fecha de hace años | Guardar un vencimiento de 2023 | Se aceptaba cualquier fecha. **Error encontrado** → ahora solo se permite desde 1 año atrás hasta 50 años adelante | Auto | Corregido |
| CP-24 | Límite de un año atrás | Guardar justo la fecha límite | Se acepta | Auto | Pasó |
| CP-25 | Avisos repetidos | Enviar `[7, 7, 1]` | Se guardan sin duplicados | Auto | Pasó |
| CP-26 | Id inexistente | Pedir un id que no existe | 404 | Auto | Pasó |
| CP-27 | Inyección de operadores de MongoDB | Enviar un id de usuario con operadores | No se deja engañar | Auto | Pasó |

## 4. App móvil: pantallas y estados

| ID | Caso | Pasos | Resultado esperado | Tipo | Estado |
| --- | --- | --- | --- | --- | --- |
| CP-28 | Estados por color | Cargar recordatorios a distintos días de hoy | Vencido (< 0), Urgente (0–14), Próximo (15–60), Al día (> 60), con el color y el texto de cada uno | Auto + Manual | Pasó |
| CP-29 | Filtros de la pantalla principal | Tocar Todos, Urgentes, Próximos, Más adelante | Cada filtro muestra solo los suyos, sin solaparse | Auto + Manual | Pasó |
| CP-30 | Resumen de la tarjeta principal | Mirar los contadores | Cuenta Vencidos, Urgentes y "Al día". **Observación:** "Al día" también suma los "Próximos" | Manual | Observación (sin corregir) |
| CP-31 | Fecha por defecto del formulario | Abrir "Nuevo" | Arrancaba un mes adelante. **Error encontrado** → ahora arranca con la fecha de hoy | Manual | Corregido |
| CP-32 | Aviso que ya pasó | Elegir fecha 1 de diciembre con aviso "30 días antes" estando el 1 de noviembre | El formulario avisa en naranja que ese aviso no se va a enviar | Auto + Manual | Pasó |
| CP-33 | Renovar un vencimiento | Tocar "Renovar con nueva fecha" | Propone un año más (o desde hoy si ya venció) y permite ajustarlo | Auto | Pasó |

## 5. Notificaciones (iPhone con Expo Go)

| ID | Caso | Pasos | Resultado esperado | Tipo | Estado |
| --- | --- | --- | --- | --- | --- |
| CP-34 | Llega con la app cerrada | Programar un aviso y cerrar la app del todo | La notificación llega a la hora; el detalle marca el aviso como "Enviado" | Manual | Pasó |
| CP-35 | Tocar la notificación | Tocarla con la app abierta o en segundo plano | Abre el detalle de ese recordatorio | Manual | Pasó |
| CP-36 | Tocar con la app cerrada, en Expo Go | Tocarla con la app cerrada | Abre el lanzador de Expo Go en vez del proyecto. Es una limitación de Expo Go, no un error de la app | Manual | Limitación conocida |
| CP-37 | Sin duplicados | Crear y editar varios recordatorios seguidos | No se programan avisos repetidos (una cola ordena las operaciones) | Manual | Corregido |
| CP-38 | Falla la carga de la lista | La lista no carga al abrir la app | No se borran los avisos ya programados | Manual | Corregido |
| CP-39 | Permiso denegado | Negar el permiso de notificaciones | Aparece el aviso naranja "Notificaciones desactivadas" con botón a Ajustes, y el detalle marca "Sin permiso" | Manual | Pendiente |
| CP-40 | Máximo de notificaciones | Tener más de 60 avisos pendientes | Se programan los 60 más próximos (iOS permite 64) | Auto | Pasó |

## 6. Demo web

| ID | Caso | Pasos | Resultado esperado | Tipo | Estado |
| --- | --- | --- | --- | --- | --- |
| CP-41 | Registro e inicio de sesión en la demo | Entrar a la demo y crear una cuenta | Funciona y muestra los recordatorios | Manual | Pasó |
| CP-42 | Web local contra la API de Vercel | Abrir `localhost:8081` apuntando a la API en Vercel | Bloqueado por CORS. Es lo esperado (la API solo acepta el origen de la demo); desde el teléfono no aplica | Manual | Pasó (comportamiento esperado) |

## Resumen

- 42 casos: 32 tienen test automático (29 solo automáticos y 3 junto con prueba manual) y 13 se probaron a mano (10 solo manuales y 3 junto con test automático).
- Resultado: 35 pasaron (uno de ellos es un comportamiento esperado), 4 se corrigieron, 1 es una observación sin corregir, 1 es una limitación de Expo Go y 1 está pendiente de probar.
- Errores encontrados y corregidos: fechas de hace años aceptadas (CP-23), fecha por defecto un mes adelante (CP-31), avisos duplicados (CP-37) y avisos perdidos cuando fallaba la carga (CP-38).
