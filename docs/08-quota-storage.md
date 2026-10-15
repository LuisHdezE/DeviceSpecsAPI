# DSA-002B · Almacenamiento de cuotas

Estado: implementación parcial. Puerto de reserva atómica, guard de cuotas y ledger de memoria SOLO PARA PRUEBAS. No habilitar en Cloud Run ni conectar proveedores reales.

La implementación de producción necesitará almacén compartido transaccional (por ejemplo PostgreSQL), con bloqueo determinista de todas las ventanas por transacción, incremento atómico o rechazo completo, identidad estable de ventana, reset verificado y registros duraderos. Los contadores no deben disminuir ni reiniciarse por cambios de configuración. Tests de concurrencia deben utilizar al menos dos conexiones/instancias independientes.

Cada petición HTTP externa requiere reserva antes de llamar. Ante coste incierto se mantiene débito conservador. Se debe aplicar también rate limiting por segundo y cuotas de transferencia si corresponden. Ausencia de ventanas configuradas equivale a DENEGADO, nunca ilimitado.

Trabajo pendiente: adaptador transaccional real, configuración de conexiones/secretos, migraciones, tests de integración multi-instancia y verificación de la política contractual. No existe garantía de cuota persistente entre reinicios todavía.
