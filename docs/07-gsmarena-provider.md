# DSA-002 · Adaptador GSMArena

Estado: **adaptador implementado y tests locales aprobados; búsqueda real bloqueada** (2026-10-15).

Se seleccionó de forma experimental `gsmarena-api@2.0.5` de nordmarin (MIT para el código, no necesariamente para los datos de GSMArena). Proyecto original: https://github.com/nordmarin/gsmarena-api.

## Diseño
`GsmarenaProvider` implementa `DeviceSpecificationsProvider`. Su cliente puede ser simulado en pruebas; los datos externos se transforman en `DeviceSummary` y `DeviceDetails`. Se filtran identificadores mediante un patrón estricto que impide suministrar URL arbitrarias. Se limitan las longitudes de campos y grupos y se rechazan formatos inesperados.

## Limitaciones y decisiones
- Sin endpoints HTTP de negocio hasta instalar la autenticación de DSA-003.
- La búsqueda y los detalles reales deben verificarse mediante consultas controladas a iPhone 13, Galaxy S23 Ultra y Redmi Note 13.
- La biblioteca es antigua y los selectores pueden romperse; pruebas offline no implican conectividad correcta.
- No se extraen ni redistribuyen imágenes; GSMArena requiere revisión adicional de condiciones y permiso de reutilización antes de habilitar el extractor en producción.
- Sin base de datos, caché ni persistencia automática.
- Futuros pasos: timeout efectivo de solicitudes externas, rate limit, gestión de errores red y autenticación servidor-servidor.

## Evidencias
Pruebas en Elena, 2026-10-15 con `gsmarena-api@2.0.5`:\n- `search.search('iPhone 13')`: `[]`, aunque el modelo existe.\n- `search.search('samsung')`: `[]`, resultado incorrecto para búsqueda general.\n- `catalog.getDevice('apple_iphone_13-11103')`: devuelve ficha real con grupos `detailSpec`, incluyendo conectividad.\n- `npm run lint`, `npm run typecheck`, `npm test` (10/10), `npm run build` y `npm audit --omit=dev --audit-level=high` (0 vulnerabilidades): OK.\n\n**Bloqueante:** reparar o sustituir el mecanismo de búsqueda antes de considerar operativo el proveedor. No habilitar endpoints públicos ni desplegar esta dependencia como funcionalidad completa.
