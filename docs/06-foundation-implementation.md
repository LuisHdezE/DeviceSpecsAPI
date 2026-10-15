# DSA-001 · Implementación de fundamentos

Estado: **PR pendiente de integración y validación CI** (2026-10-15).

## Incluido
- Node.js 22+, TypeScript strict, Fastify y Zod.
- Separación explícita de dominio (contrato de proveedor), aplicación (caso de uso), infraestructura (configuración) y presentación HTTP.
- Únicamente `GET /health` funcional. Los endpoints de negocio aún no se implementaron y devuelven 404.
- Tests unitarios para configuración y puerto del caso de uso, integración Fastify inject para salud.
- Lint, typecheck, tests, build, auditoría de dependencias en GitHub Actions.

## Ejecución local propuesta
```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
# GET http://localhost:8080/health
```

## Verificación y pendientes
No se ejecutaron tests locales en el entorno de autoría porque el registro npm no estaba accesible. Los resultados de CI deben verificarse antes de aprobar el merge. Esta etapa no configura autenticación para rutas de negocio porque dichas rutas no existen. No se desplegó Cloud Run.

**Seguridad:** nada de secretos; logging sin datos de credenciales; límite de cuerpo de petición y timeout; gestión de errores genérica. No confundirlo con hardening completo DSA-003.
