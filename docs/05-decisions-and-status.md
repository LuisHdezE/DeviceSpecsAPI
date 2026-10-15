# Decisiones técnicas e historial verificable

## ADR-001 · Servicio independiente
**Aprobada · 2026-10-15.** Crear repositorio público `LuisHdezE/DeviceSpecsAPI`. Razón: desacoplamiento, reutilización y CI público. Consecuencia: la API no implementa lógica de ventas, inventario ni acceso a base de datos de FixPhone.

## ADR-002 · Persistencia opt-in en consumidor
**Aprobada · 2026-10-15.** Consultar no guarda. Solo FixPhone Laravel podrá persistir tras confirmación administrativa, con auditoría y protección frente a sobrescritura accidental. No publicar automáticamente en showroom.

## ADR-003 · Hexagonal ligera
**Aprobada · 2026-10-15.** TypeScript strict, Fastify, Zod, Vitest, Pino, adaptadores de proveedor y pruebas aisladas. Evitar microcapas innecesarias, ORM, Kubernetes o bases de datos propias sin necesidad.

## ADR-004 · Hosting
**Aprobada como destino previsto · 2026-10-15.** Google Cloud Run en proyecto independiente del de eFactura, escalado a cero. Aún no hay despliegue ni facturación verificados en este repositorio.

## ADR-005 · Proveedor
**Evaluación pendiente.** GSMArena será la primera preferencia del ranking, pero RapidAPI/GSMArena se mantiene deshabilitado hasta verificar acceso sin tarjeta ni cargos por excedentes; se evaluarán MobileAPI.dev y TechSpecs con el mismo criterio. Paquetes de scraping de código abierto son candidatos, **no** proveedores aprobados hasta probar respuestas, mantenimiento, licencias y condiciones de uso.

## ADR-006 · Seguridad y gobernanza
**Aprobada · 2026-10-15.** Público no significa sin controles. Autenticación backend-to-backend, secretos fuera del repositorio, tests y CI obligatorios, PR pequeñas; autorización expresa para merge y despliegue.

## ADR-007 · Ranking, cuotas y failover multi-proveedor
**Aprobada para diseño · 2026-10-15.** GSMArena es la primera preferencia, pero solo podrá habilitarse si se verifica ausencia de tarjeta y sobrecostos. El microservicio elegirá el proveedor habilitado de mayor ranking con cuota disponible, reservará 8 solicitudes cuando haya límite conocido, interpretará el 429 según su ventana real y restablecerá automáticamente el ranking tras vencimiento. Contadores compartidos atómicos, caché y tests de concurrencia obligatorios. Ver [especificación completa](07-provider-routing-and-quotas.md). Sin implementación todavía.

## Estado por bloque
| Bloque | Alcance | Estado |
|---|---|---|
| DSA-001 | Bootstrap, arquitectura, documentación, tests base y CI | En preparación; documentos creados en rama |
| DSA-002 | Evaluación/adaptación extractor real | No iniciado |
| DSA-003 | Autenticación, límites, contrato OpenAPI, hardening | No iniciado |
| DSA-004 | Docker y Cloud Run | No iniciado |
| DSA-005 | Cliente Laravel y vista administrativa FixPhone | No iniciado |

## Actualización continua
Cada PR deberá registrar: propósito, decisiones cambiadas, archivos o módulos afectados, pruebas realmente ejecutadas, estado de seguridad y, cuando aplique, resultado de despliegue con fecha, revisión e incidencias. Evitar afirmaciones de implementación o producción sin evidencia.
