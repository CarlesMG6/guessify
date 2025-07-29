# 🚀 Configuración Rápida de Guessify

## 📋 Pasos para configurar la aplicación

### 1. Configurar Spotify Developer App

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Haz clic en "Create an App"
3. Llena el formulario:
   - **App name**: Guessify
   - **App description**: Juego de adivinanzas musical
   - **Website**: http://localhost:3000 (para desarrollo)
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/spotify`
4. Acepta los términos y crea la app
5. Copia el **Client ID** y **Client Secret**

### 2. Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` con tus datos:
   ```bash
   # Spotify App Configuration
   SPOTIFY_CLIENT_ID=tu_client_id_aqui
   SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=clave_secreta_aleatoria_aqui
   ```

### 3. Generar NEXTAUTH_SECRET

Ejecuta en terminal:
```bash
openssl rand -base64 32
```
O usa cualquier generador de claves aleatorias.

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Iniciar la Aplicación

```bash
npm run dev
```

### 6. Probar la Aplicación

1. Ve a http://localhost:3000
2. Haz clic en "Iniciar sesión con Spotify"
3. Autoriza la aplicación
4. ¡Disfruta de tu música!

## 🔧 Solución de Problemas

### Error: "Invalid client"
- Verifica que el Client ID y Client Secret sean correctos
- Asegúrate de que no haya espacios extra en las variables de entorno

### Error: "Invalid redirect URI"
- Verifica que la Redirect URI en Spotify sea exactamente: `http://localhost:3000/api/auth/callback/spotify`
- Asegúrate de que NEXTAUTH_URL coincida con tu dominio

### Error: "No se encontraron canciones"
- Tu cuenta de Spotify necesita historial de escucha
- Escucha música durante algunos días y vuelve a intentar

### Error de CORS
- Verifica que estés accediendo desde la URL correcta
- En desarrollo usa siempre `http://localhost:3000`

## 📝 Notas Importantes

- Las variables de entorno deben empezar con `NEXT_PUBLIC_` solo si necesitas accederlas desde el cliente
- Reinicia el servidor de desarrollo después de cambiar las variables de entorno
- Asegúrate de que tu cuenta de Spotify tenga historial de reproducción

## 🌟 ¡Listo!

Tu aplicación Guessify debería estar funcionando. Si tienes problemas, revisa los logs en la consola del navegador y del terminal.
