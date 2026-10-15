# Despliegue y operación · Google Cloud Run

**ESTADO ACTUAL: NO DESPLEGADO. Este documento describe el procedimiento previsto y sus razones. No hay URL ni proyecto de producción verificados.**

## Por qué Google Cloud Run
- El propietario ya utiliza Google Cloud para otro proyecto (eFactura); DeviceSpecsAPI será **independiente**, sin modificar eFactura.
- Tráfico administrativo poco frecuente: escalado a cero reduce instancias ociosas.
- Contenedores reproducibles, HTTPS gestionado y controles IAM/observabilidad.
- Capa gratuita de Cloud Run sujeta a límites, región y facturación; el crédito temporal de prueba de Google Cloud **no equivale** a gratuidad garantizada para siempre.

## Infraestructura deseada
- Proyecto de Google Cloud independiente de eFactura (ID pendiente de elegir y registrar).
- Servicio sugerido: `fixphone-device-specs`; región por elegir según precio, disponibilidad y latencia desde Uruguay.
- Contenedor Node.js (compilado TypeScript), usuario no root.
- Inicial: 1 vCPU, 512 MiB RAM, **min instances 0**, **max instances 1**, concurrencia 1; medir y ajustar según realidad y límites operativos.
- Autenticación comprobada para Laravel cPanel; denegar invocaciones anónimas de rutas de negocio.
- Secretos en Secret Manager/configuración protegida y servicio con permisos mínimos.
- Sin conexión directa a MySQL de FixPhone.

## Procedimiento planificado (no ejecutado)
1. Verificar pruebas, lockfile, `Dockerfile`, contrato JSON y adaptador externo.
2. Elegir proyecto y región; comprobar cuenta de facturación, cuotas gratuitas y riesgos de costo.
3. Configurar IAM, identidad CI/CD (preferentemente Workload Identity Federation, sin claves JSON persistentes), y servicio de ejecución con permisos mínimos.
4. Configurar límites de recursos, instancias, concurrencia, CPU bajo demanda, timeout, presupuestos y alertas.
5. Construir imagen con pipeline controlado; publicar en Artifact Registry teniendo en cuenta su propio costo y política de retención.
6. Desplegar primero a entorno de prueba; verificar salud, autenticación, bloqueos y respuestas reales.
7. Promocionar una revisión versionada a producción mediante aprobación expresa; registrar imagen digest, revisión, fecha, proyecto/región, URL y workflow.
8. Configurar llamada Laravel de backend, verificar flujos de consulta y guardado explícito.
9. Monitorear fallos, latencia, solicitudes, cuota y facturación; planificar rollback de revisión.

## Registro de despliegue real (rellenar tras ejecutar)
| Campo | Valor |
|---|---|
| Estado | PENDIENTE |
| Proyecto de Google Cloud | Por definir |
| Región | Por definir |
| Nombre de servicio | `fixphone-device-specs` (propuesto) |
| URL | No asignada |
| Imagen/digest y revisión | No existentes |
| Fecha de despliegue | No ejecutado |
| Workflow/commit | Pendiente |
| Evidencia de smoke y costos | Pendiente |

## Operación
Documentar en cada despliegue procedimientos probados de rollback, rotación de credenciales, diagnóstico de 401/403/429/5xx, fallas del proveedor y revisión de facturación. **Una alerta de presupuesto no suspende automáticamente los servicios ni impide cargos**. La decisión de pasar de prueba gratuita a facturación completa requiere autorización específica.
