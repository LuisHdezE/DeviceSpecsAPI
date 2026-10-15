# DSA-002B · Almacenamiento de cuotas

Decisión vigente: **Google Cloud Firestore** como contador duradero y compartido para Cloud Run. Ver [09 · FirestoreQuotaLedger](09-firestore-quota-ledger.md). PostgreSQL y MySQL quedaron descartados.

El puerto `QuotaLedger` y `QuotaGuard` preservan la separación del dominio. La implementación en memoria es exclusivamente para pruebas. `FirestoreQuotaLedger` reserva atómicamente todas las ventanas en una transacción de Firestore, mantiene ocho consultas reservadas y rechaza políticas no coincidentes. Los errores de persistencia se propagan: denegar solicitudes externas ante fallas, sin fallback a memoria.

Pendiente antes de producción: configurar SDK/credenciales por identidad de servicio, crear la base, confirmar permisos y cuotas gratuitas, probar contra emulador/Firestore real y comprobar concurrencia entre clientes distintos. No habilitar proveedores externos ni desplegar en esta PR.
