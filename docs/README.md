# Documentación oficial · DeviceSpecsAPI

Estado: **diseño aprobado, implementación pendiente**. Fecha de inicio: 2026-10-15.

DeviceSpecsAPI es un microservicio de **solo lectura** para consultar características técnicas de dispositivos móviles a partir de proveedores externos. Su consumidor inicial es el panel administrativo de [FixPhone](https://github.com/LuisHdezE/FixPhone). El showroom público queda fuera del alcance.

## Índice
- [01 · Propósito y alcance](01-purpose-and-scope.md)
- [02 · Arquitectura y estructura](02-architecture.md)
- [03 · Seguridad y pruebas](03-security-and-testing.md)
- [04 · Despliegue y operación Cloud Run](04-deployment-and-operations.md)
- [05 · Decisiones y registro de cambios](05-decisions-and-status.md)
- [07 · Routing de proveedores, cuotas y recuperación](07-provider-routing-and-quotas.md)

## Regla documental
No marcar una funcionalidad como implementada o desplegada sin evidencia concreta: commit, PR, workflow o revisión del servicio. Actualizar estos documentos en la misma PR de cada cambio relevante. Nunca almacenar claves, tokens, contraseñas, IDs sensibles ni configuración secreta en este repositorio público.
