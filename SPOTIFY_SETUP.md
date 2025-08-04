# Configuración del Spotify Web Playback SDK

## Actualización de la aplicación de Spotify

Para que funcione la reproducción completa de canciones, necesitas actualizar la configuración de tu aplicación en el Dashboard de Spotify.

### Pasos a seguir:

1. **Ve al Dashboard de Spotify**
   - Visita: https://developer.spotify.com/dashboard
   - Inicia sesión con tu cuenta de Spotify

2. **Edita tu aplicación**
   - Haz clic en tu aplicación "Guessify" (o como la hayas llamado)
   - Haz clic en "Settings"

3. **Actualiza las URLs de redirección**
   - En "Redirect URIs", asegúrate de tener:
     - `http://localhost:3000/api/auth/callback/spotify`
     - `http://localhost:3001/api/auth/callback/spotify` (por si usas el puerto 3001)

4. **Configura el Web Playback SDK**
   - En la sección "Settings", busca "Web Playback SDK"
   - **IMPORTANTE**: Agrega tu dominio (o localhost para desarrollo)
   - Para desarrollo local, agrega:
     - `http://localhost:3000`
     - `http://localhost:3001`

5. **Guarda los cambios**
   - Haz clic en "Save" en la parte inferior

## Variables de entorno actualizadas

Tu archivo `.env.local` debe tener:

```bash
SPOTIFY_CLIENT_ID=tu_client_id_actual
SPOTIFY_CLIENT_SECRET=tu_client_secret_actual
NEXTAUTH_URL=http://localhost:3001  # O el puerto que uses
NEXTAUTH_SECRET=una_clave_secreta_aleatoria_muy_larga
```

## Nuevas funcionalidades

Con esta actualización, la aplicación ahora puede:

- ✅ Reproducir canciones completas (no solo previews de 30s)
- ✅ Controlar la reproducción desde la interfaz web
- ✅ Mostrar información en tiempo real de la canción actual
- ✅ Control de volumen integrado
- ✅ Barra de progreso interactiva

## Requisitos de Spotify

Para usar la reproducción completa, el usuario debe tener:
- **Spotify Premium** (requerido para el Web Playback SDK)
- Una sesión activa de Spotify (puede ser en cualquier dispositivo)

## Cómo probar

1. Inicia sesión en la aplicación
2. Ve al dashboard
3. Haz clic en cualquier canción
4. Si tienes Spotify Premium, deberías ver el reproductor completo en la parte inferior
5. La canción completa se reproducirá a través del navegador web

## Solución de problemas

### El reproductor no aparece
- Verifica que tengas Spotify Premium
- Asegúrate de que el dominio esté configurado en el Dashboard de Spotify
- Revisa la consola del navegador para errores

### "No se puede reproducir"
- Verifica que tengas una sesión activa de Spotify
- Algunos tracks pueden no estar disponibles en tu región
- Cierra y abre Spotify para refrescar la sesión

### Token expirado
- Cierra sesión y vuelve a iniciar sesión en la aplicación
- Los tokens se refrescan automáticamente, pero a veces es necesario reiniciar la sesión
