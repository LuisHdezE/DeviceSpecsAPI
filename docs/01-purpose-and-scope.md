# Objetivo, contexto y límites

## Problema
FixPhone necesita consultar desde **su administración** un modelo de celular y visualizar características técnicas confiables (pantalla, chipset, memoria, cámara, batería, conectividad y otros campos disponibles) sin cargar los datos manualmente.

## Solución aprobada
Construir **DeviceSpecsAPI**, microservicio independiente en GitHub, reutilizable por otros consumidores. Responde consultas en JSON normalizado y **no conoce ni modifica** la base de datos de FixPhone.

Flujo previsto:
1. Administrador autorizado busca un modelo en FixPhone.
2. Backend Laravel valida autorización y solicita resultados a DeviceSpecsAPI.
3. Administrador selecciona un modelo y consulta detalles.
4. FixPhone muestra la ficha **sin guardarla automáticamente**.
5. Solo una acción explícita de guardar/asociar hará persistir datos en MySQL de FixPhone, con revisión de conflictos y auditoría.

## Límites
- El microservicio **no** tendrá escritura sobre inventario, catálogo, ventas ni base de datos de FixPhone.
- No habrá exposición de datos en showroom público por esta integración.
- La extracción de GSMArena depende de la disponibilidad, compatibilidad y condiciones de uso del proveedor; no garantizar datos completos ni disponibilidad sin pruebas.
- No utilizar RapidAPI GSMArenaParser, descartado porque su activación exigía tarjeta y su plan admitía cargos por excedentes.
- Primera integración administrativa asociada a [FixPhone Issue #96](https://github.com/LuisHdezE/FixPhone/issues/96).

## Calidad requerida
Proyecto público, con TypeScript estricto, CI, tests, análisis de dependencias, documentación de decisiones y revisiones de PR. No fusionar PR sin aprobación explícita del propietario.
