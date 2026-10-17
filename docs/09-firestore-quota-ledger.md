# DSA-002B2 · Cloud Firestore quota ledger

Decisión definitiva: Cloud Firestore en Cloud Run; no MySQL ni PostgreSQL.

`FirestoreQuotaLedger` reserva todas las ventanas dentro de `runTransaction`. Lee antes de escribir, hace fail-closed y conserva ocho consultas de seguridad por ventana. Las identidades de ventana deben corresponder a periodos documentados del proveedor. Nunca llamar a una API externa dentro del callback transaccional: Firestore puede reintentarlo.

## Estado verificable

- El adaptador de dominio funciona con un cliente inyectado compatible con el contrato estructural.
- Tests unitarios con fake comprueban contención simulada, denegación multi-ventana, políticas y errores.
- `tests/integration/firestore-emulator.test.ts` prepara una prueba real de contención con **dos clientes SDK distintos**; solo corre si `FIRESTORE_EMULATOR_HOST` está configurado. La prueba no conecta a Firestore de producción.
- **Pendiente**: declarar el SDK oficial `@google-cloud/firestore` en `package.json` y generar su `package-lock.json` con npm; este entorno no dispone de acceso npm. No declarar una instalación incompleta porque el CI emplea `npm ci`.
- **Pendiente**: verificar integración real de tipos, ejecutar el emulador, configurar ADC/identidad de Cloud Run y validar costes/cuotas gratuitas. No se ha ejecutado todavía el test de emulador.

## Ejecución futura de integración local

Con el emulador de Firestore escuchando en `127.0.0.1:8080`, el SDK oficial instalado y lockfile sincronizado:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm test -- tests/integration/firestore-emulator.test.ts
```

Usar siempre un proyecto `demo-*` para pruebas, sin credenciales reales, y no habilitar el test en CI antes de arrancar el emulador. La PR no despliega ni habilita proveedores.

## Riesgos pendientes

Los SDK transaccionales pueden reintentar frente a alta contención y devolver errores. Tratar esos errores como denegación de nueva llamada externa, nunca como una autorización. Verificar tiempos y límites del plan gratuito antes de desplegar. No almacenar claves privadas.
