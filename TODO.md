# TODO

## Modo mantenimiento controlado por Admin (persistente)
- [ ] Agregar tabla/ajuste de configuración en `server/database/schema.sql` (maintenance enabled)

- [ ] Crear endpoints en `server/routes/admin.js` para leer/actualizar el estado (GET/PUT)

- [ ] Exponer endpoint público para que el frontend consulte el estado
- [ ] Actualizar `src/routes/AppRouter.jsx` para reemplazar `MAINTENANCE_MODE` hardcodeado por estado consultado del backend y lógica: admin no ve mantenimiento

- [ ] Agregar switch en `src/modules/settings/pages/SettingsPage.jsx` que llame al endpoint admin

- [ ] Probar flujo: admin no ve mantenimiento; usuarios sí

