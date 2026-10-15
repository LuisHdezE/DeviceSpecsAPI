# DSA-002 · Evaluación de fuentes alternativas (2026-10-15)

## Hallazgo principal
La búsqueda del extractor `gsmarena-api@2.0.5` no es confiable: devolvió `[]` para búsquedas reales y una consulta independiente a GSMArena dio HTTP 429. No automatizar evasión de límites ni activar ese proveedor en producción.

## Candidatos

### TechAPI / GetTechAPI
- Repositorio: https://github.com/GetTechAPI/TechAPI
- Datos publicados bajo **CC BY-SA 4.0** (código separado bajo MIT).
- Organización: `data/smartphone/<brand>/<year>/<slug>.json`.
- Confirmada lectura de `data/smartphone/apple/2023/iphone-15-pro.json` en rama `develop`: nombre, SoC, RAM, almacenamiento, pantalla, cámaras, batería, conectividad y `source_urls`.
- Una consulta al árbol recursivo de GitHub fue truncada por límite de resultados, por lo que **no constituye conteo global de cobertura**.
- Próximo trabajo: descargar una revisión fija de datos permitidos, validar modelos de prueba Apple/Samsung/Xiaomi, calidad del contenido y atribución requerida; construir índice local de búsqueda y adaptador por puerto, sin hacer consultas a GSMArena.
- Verificar impactos de CC BY-SA en distribución de datos derivados: atribución, indicación de cambios y compartir adaptaciones bajo la licencia correspondiente. No confundir la licencia de datos con la del código.

### MobileAPI.dev
- Documentación: https://mobileapi.dev/docs/
- Declara registro sin tarjeta; búsquedas `GET /devices/search/` y detalle `GET /devices/{id}/` con API key.
- **La propia documentación indica 50 solicitudes/mes** en plan Free, 5/minuto, y **uso comercial reservado a Pro**. Una publicación promocional de GitHub menciona 200/mes: se considera inconsistencia, no un cupo confirmado.
- No integrar con FixPhone comercial sin aclarar licencia y condiciones; tampoco registrar tarjeta.

### Otros servicios públicos no seleccionados
APIs de scraping anónimas: arriesgan fallos/429 y ofrecen menor estabilidad. Servicios con planes RapidAPI: incompatibles con la decisión de no usar tarjetas/cargos por excedentes.

## Decisión provisional
**Priorizar prueba de TechAPI como dataset local versionado** para el microservicio en Cloud Run. Mantener la arquitectura de puertos para fuentes futuras. No importar automáticamente miles de registros ni imágenes al repositorio DeviceSpecsAPI: evaluar volumen, frescura, trazabilidad y licencia con un conjunto de prueba primero.

## Criterios antes de habilitar producción
1. Tres modelos verificables (iPhone 13, Galaxy S23 Ultra, Redmi Note 13), fichas completas y fuentes conservadas.
2. Búsqueda por nombre robusta, sin red externa durante cada búsqueda.
3. Datos atribuibles, aviso de cambios y compatibilidad de licencia revisados.
4. Tests de contrato, ausencia de secretos, CI verde, control de versiones y revisión manual.
5. Sin persistencia automática en FixPhone, sin showroom y sin deploy antes de autorización.
