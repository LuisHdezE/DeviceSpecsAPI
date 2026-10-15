# DSA-002 · Adaptador GSMArena

Estado: **implementación propuesta; validación real pendiente**.

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
Registrar aquí resultados de las pruebas reales, fecha, versión de biblioteca y fallos; no afirmar que GSMArena funciona hasta verificarlo.
