# Flujo de Autenticación Actualizado

## Resumen de cambios implementados

### 1. Login secuencial en la home
- **Paso 1**: Login con Google (Firebase Auth)
- **Paso 2**: Login con Spotify (una vez autenticado con Google)

### 2. Almacenamiento en Firestore
Al hacer login con Google, se crea/actualiza el documento del usuario en la colección `users` con:
```javascript
{
  id: user.uid,                    // Firebase Auth UID
  googleId: user.uid,              // Mismo valor que 'id' para consultas directas
  isAnonymous: false,
  nombre: user.displayName,
  email: user.email,
  imageUrl: user.photoURL,
  spotifyId: null                  // Se llenará después del login de Spotify
}
```

Al conectar con Spotify, se actualiza el mismo documento preservando el `googleId`:
```javascript
{
  // ... datos existentes ...
  spotifyId: "spotify_user_id",
  topTracks_short: [...],
  topTracks_medium: [...],
  topTracks_long: [...],
  spotifyTokens: {...},
  googleId: user.uid               // Se preserva el valor original
}
```

### 3. Consultas simplificadas
Ahora se puede consultar el usuario directamente usando el Firebase Auth UID:

```javascript
// Método directo (recomendado)
const userData = await getUser(user.uid);

// Método alternativo por googleId (mismo resultado)
const userData = await getUserByGoogleId(user.uid);
```

### 4. Validaciones implementadas
- **Home**: Usuarios sin Google → Modal de Google login
- **Home**: Usuarios con Google pero sin Spotify → Modal de Spotify login
- **Host/Room**: Usuarios sin Spotify → Redirección a home

### 5. Beneficios
- ✅ Un solo punto de login (home)
- ✅ Consultas directas usando Firebase Auth UID
- ✅ Preservación de datos existentes
- ✅ Flujo de autenticación claro y consistente
- ✅ Validaciones automáticas en todas las rutas
