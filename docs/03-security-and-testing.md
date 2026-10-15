# Seguridad, testing y CI

**Estado: políticas acordadas; controles por implementar.**

## Modelo de amenazas
API desplegada en Internet, llamada desde Laravel en hosting externo. Riesgos: invocación no autorizada, fugas de credenciales, denegación de servicio y consumo excesivo, SSRF, contaminación de logs, extracción de contenido malicioso, proveedores comprometidos y librerías vulnerables.

## Requisitos
1. **Acceso**: elegir y probar autenticación servidor-a-servidor (preferencia Cloud Run IAM con identidad de servicio y tokens de identidad si el entorno cPanel es compatible; alternativa token rotatorio fuerte validado del lado servidor). Nunca enviar credenciales al navegador. `/health` puede utilizar endpoint separado con mínima información si se requiere acceso público.
2. **Secretos**: Secret Manager o configuración protegida de despliegue; ningún secreto ni `.env` real en el repositorio público, workflows o logs. Gestión y rotación documentadas sin publicar valores.
3. **Entrada**: validación estricta con Zod, límites de longitud/tamaño, rate limit, sin URLs arbitrarias suministradas por clientes.
4. **Salidas**: respuestas JSON normalizadas; no devolver HTML crudo del proveedor, no permitir ejecución ni interpolación sin escape.
5. **Red**: lista explícita de dominios permitidos, redirecciones restringidas, timeout y máximo de bytes; evitar SSRF.
6. **Recursos**: caché y límites de concurrencia e instancias; presupuestos y alertas son señales, **no** barreras absolutas de cobro.
7. **Supply chain**: lockfile, versiones soportadas, revisión de licencias, npm audit y actualizaciones revisadas; imagen mínima no root, permisos mínimos de IAM y GitHub Actions.
8. **Observabilidad**: logs estructurados sin tokens, respuestas completas sensibles ni datos personales; códigos de error y duración, correlación de solicitudes.
9. **Datos de terceros**: verificar condiciones de extracción, atribución y derechos de reutilización antes de usar contenido o imágenes.

## Pruebas obligatorias
- **Unitarias:** casos de uso, normalización, validación, límites y errores.
- **Integración:** Fastify inject, middleware, autorización, dependencias simuladas, respuestas HTTP.
- **Contrato:** JSON y errores versionados; pruebas frente a fixtures.
- **Seguridad:** ausencia/invalidación de credenciales, entradas maliciosas, desbordes, redirecciones, secretos ocultos.
- **Smoke:** arranque contenedor y salud.
- **Pruebas reales del proveedor:** aisladas, controladas, no necesarias en CI rutinario.

## Gate de PR
`format/lint -> typecheck -> unit -> integration/contract -> build -> security scan`. Usar reportes verificables, sin afirmar éxito antes de completar un workflow real. Ningún merge sin revisión de HEAD y aprobación explícita del propietario.
