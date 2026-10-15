# ADR-007 · Provider Router, cuotas y recuperación

**Estado:** aprobada para diseño, implementación pendiente · 2026-10-15  
**Alcance:** DeviceSpecsAPI, exclusivamente consulta de especificaciones. Consumidor inicial: administración de FixPhone.

## Decisión

Implementar una selección dinámica de adaptadores mediante `ProviderRouter`, ordenados por prioridad **configurable y estable**. GSMArenaParser ocupa el primer puesto de preferencia, seguido inicialmente de MobileAPI.dev y TechSpecs; estar en el ranking **no implica autorización para consumir una API**. Solo se habilita un proveedor tras verificar documentación contractual, credenciales, capacidad, licencias, permisos de uso y **ausencia de tarjeta/cargos por excedente** según la política del proyecto. Si GSMArena/RapidAPI requiere tarjeta o permite sobrecargos sin bloqueo vinculante, permanecerá DISABLED aunque sea #1.

## Secuencia de consulta

1. Validar solicitud y autorización backend-to-backend; normalizar nombre de dispositivo.
2. Consultar caché por clave canónica, esquema/version y política de frescura. Un hit válido evita cualquier llamada externa.
3. Ordenar proveedores **habilitados y elegibles** por ranking ascendente (empates con ID estable).
4. Adquirir una reserva atómica de cuota para la llamada **antes** de acceder a la red. Considerar que una búsqueda y un detalle pueden consumir **dos o más solicitudes**; contabilizar cada HTTP saliente, incluyendo intentos fallidos y, cuando corresponda, retries.
5. Invocar el adaptador con timeout, límite por segundo y respuesta validada. Normalizar el resultado y registrar su origen/fecha.
6. Ante agotamiento o indisponibilidad: elegir el siguiente elegible dentro de un **presupuesto acotado de intentos**; nunca ejecutar un bucle infinito ni saltarse la seguridad para obtener respuesta.
7. Si ninguno es elegible, devolver una respuesta tipada de agotamiento/no disponibilidad, sin consultas ni cargos. Guardar fichas en FixPhone **solo mediante acción administrativa explícita**.

## Cuotas conocidas y reserva preventiva

- Para cada ventana documentada `limit`, `consumed`, `window_start`, `reset_at`, `safety_reserve=8`, `operational_limit=max(0,limit-8)`.
- No enviar solicitudes si `consumed + estimated_cost > operational_limit`. Si el límite es 8 o menos, el presupuesto operativo es cero, salvo decisión explícita posterior que cambie la reserva.
- Si el proveedor aplica varias ventanas (segundo/día/mes/transferencia), **todas** deben permitir la llamada.
- El gasto se contabiliza por intento real según reglas verificadas del proveedor; usar contabilidad conservadora si no es posible saber si un intento fue facturable. Los procesos paralelos no pueden exceder la cuota mediante carrera.
- Al renovar una ventana documentada, el proveedor vuelve a ser elegible y recupera automáticamente su ranking original, sin intervención ni sondeos pagados.
- La ventana temporal/horaria es propiedad del proveedor; no asumir medianoche UTC, zona uruguaya ni mes calendario sin confirmación.

## Cuotas desconocidas y HTTP 429

- **No** significa permiso para arriesgar facturación: únicamente se habilita un proveedor con límite desconocido si el contrato/documentación confirma explícitamente un techo gratuito sin tarjeta ni cobro de overages, y se configura además un máximo conservador interno de uso.
- Interpretar `Retry-After` y, si están verificadas, cabeceras `RateLimit-*` / `X-RateLimit-*`; un 429 podría corresponder a límite por segundo y **no** a agotamiento mensual.
- Si el período es confiable, bloquear hasta `reset_at`; si es transitorio, establecer `cooldown_until` con backoff acotado y jitter. Sin indicios confiables, usar cooldown conservador y no inferir la fecha de renovación.
- Respuestas 401/403 invalidan el estado de credenciales/permiso (no rotar indefinidamente); 5xx/timeouts accionan circuit breaker temporal con recuperación limitada. Un 404/no encontrado debe tratarse según semántica del adaptador y no necesariamente consume un segundo proveedor.
- Nunca repetir automáticamente una misma solicitud contra el mismo proveedor si podría generar gasto o superar límites.

## Estados, datos y operación

Estados efectivos: `ACTIVE`, `RESERVED`, `RATE_LIMITED`, `QUOTA_EXHAUSTED`, `UNHEALTHY`, `DISABLED`. Mantener `next_available_at`/causa documentada, contadores, versión de configuración y observaciones por proveedor.
Persistir cuotas y locks atómicos en almacenamiento compartido compatible con múltiples instancias Cloud Run (a seleccionar y documentar antes de implementar); **no** depender de memoria del proceso o filesystem efímero. Evitar almacenamiento de secretos y datos personales en caché/logs.
Separar interfaces `SpecsProvider`, `ProviderRegistry`, `QuotaStore`, `ProviderPolicy`, `CacheStore` y `Clock` de implementaciones concretas. Adaptadores regresan resultados y errores tipados; normalizador no confunde modelos cercanos.
Configurar ranking, activación, límites confirmados, reserva y períodos desde entorno/configuración segura. Un eventual panel administrativo requerirá autenticación/autorización y auditoría; no exponer ajustes públicos.

## Condiciones de aceptación y pruebas

- Ranking 1→2→3, preferencia restablecida en siguiente consulta cuando #1 renueva, desactivado nunca seleccionado.
- `limit=15, reserve=8` permite 7 intentos, el octavo cambia a siguiente; `limit<=8` no consume.
- Cache hit sin llamadas externas; búsqueda+detalle contabilizados por separado.
- 429 con `Retry-After` y sin cabecera, reinicio diario/mensual, ventanas simultáneas, proveedor 5xx, 401/403, sin proveedores elegibles.
- 100+ solicitudes concurrentes no sobrepasan límite operativo; rollback/compensación conservadora de reservas, reinicios y múltiples instancias.
- Seguridad: llamadas únicamente desde servidor autorizado, secretos no expuestos, proveedores y URL externos en allowlist, sanitización, timeout, auditoría sin secretos.
- Tests unitarios con reloj falso y adaptadores fake, integración con almacén real, pruebas de contrato con fixtures autorizadas, CI antes de PR y aprobación explícita para merge/despliegue.

## Plan de entregas pequeñas (sin merges automáticos)

- **DSA-002A:** interfaces de proveedores, modelo de política y ranking, normalización de errores, tests.
- **DSA-002B:** almacenamiento duradero/atómico, cuotas multi-ventana y reserva 8, tests de concurrencia.
- **DSA-002C:** router, circuit breakers, 429 y renovación, pruebas de integración.
- **DSA-002D:** adaptadores externos **individuales**, solamente tras validar contrato/tarifas y respuestas reales; fichas normalizadas.
- **DSA-002E:** observabilidad, configuración segura, caché, pruebas end-to-end.
- **DSA-005:** integración de FixPhone bajo Issue #96 sin showroom público ni guardado automático.

**Nota:** documento de diseño: ningún endpoint, proveedor, cuota ni despliegue aquí descrito está implementado o validado en producción.
