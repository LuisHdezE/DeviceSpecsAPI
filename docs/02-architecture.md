# Arquitectura y organización

**Estado: diseño aprobado, NO implementado.**

## Estilo
Arquitectura **hexagonal ligera (Ports & Adapters)** con principios de Clean Architecture. El dominio y los casos de uso no importan Fastify, bibliotecas de scraping ni dependencias de Google Cloud. Inyección explícita de dependencias sin framework DI inicialmente.

```text
FixPhone admin -> Laravel (autorización/persistencia opcional)
                        |
                    HTTPS JSON
                        v
               Cloud Run (DeviceSpecsAPI)
                        |
            Fastify presentation adapter
                        |
                  Application uses
                        |
               Domain provider ports
                        |
           Provider Router / QuotaManager
                  /      |      \
            GSMArena  MobileAPI  TechSpecs
                  \      |      /
             Fuentes externas (solo lectura)
```

## Tecnología seleccionada
Node.js LTS, TypeScript strict, Fastify, Zod, Vitest, Pino, Docker multi-stage, GitHub Actions, Google Cloud Run. El paquete extractor definitivo debe validarse antes de adoptarlo: funcionamiento, mantenimiento, licencia, compatibilidad y condiciones de uso.

## Árbol proyectado, sujeto a revisión en implementación
```text
src/
  domain/
    entities/
    ports/
  application/
    use-cases/
    dto/
  infrastructure/
    providers/gsmarena/
    cache/
    config/
  presentation/
    routes/
    schemas/
    middleware/
  main.ts
tests/
  unit/
  integration/
  contract/
  fixtures/
docs/
Dockerfile
.github/workflows/
.env.example
tsconfig.json
package.json
README.md
```
**Nota:** esta estructura es un objetivo arquitectónico, no una descripción del árbol actualmente existente.

## Contratos REST propuestos, NO disponibles todavía
- `GET /health`: salud básica, sin realizar llamadas externas.
- `GET /api/v1/brands`: marcas soportadas si el proveedor lo permite.
- `GET /api/v1/models?search=...`: búsqueda explícita con longitud y volumen acotados.
- `GET /api/v1/devices/{id}`: características de un resultado seleccionado.

Todos los endpoints de negocio estarán autenticados, sujetos a validación, límites y errores normalizados. Formato JSON y OpenAPI se congelarán mediante pruebas de contrato antes de la integración de FixPhone.

## Responsabilidades
- **DeviceSpecsAPI:** búsqueda y normalización, selección de proveedor por ranking, contadores atómicos de cuotas, failover/cooldown, errores, observabilidad y caché no sensible. Ver [ADR-007](07-provider-routing-and-quotas.md).
- **FixPhone Laravel:** autenticación de usuario/permiso, vínculo con catálogo, decisión de guardar, persistencia y auditoría, showroom fuera del alcance.
- **Google Cloud Run:** ejecución bajo demanda y controles de recursos, no base de datos principal.

Registrar cambios de dependencias y decisiones estructurales en `05-decisions-and-status.md`.
