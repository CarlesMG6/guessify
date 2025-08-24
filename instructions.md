# Instrucciones de Configuración - Guessify Fase 1

## 🚀 Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Firebase

1. **Crear proyecto en Firebase:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto
   - Habilita Firestore Database
   - Habilita Authentication

2. **Configurar Authentication:**
   - En Firebase Console > Authentication > Sign-in method
   - Habilita "Anonymous" (para usuarios temporales)
   - Opcionalmente habilita "Google" si quieres login con Google

3. **Configurar Firestore:**
   - Ve a Firestore Database
   - Crea base de datos en modo de prueba
   - Configura las siguientes reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Salas son legibles por cualquier usuario autenticado
    match /salas/{salaId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.hostUserId || 
         request.auth.uid == request.data.hostUserId);
      
      // Players en salas
      match /players/{playerId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
      
      // Songs en salas
      match /songs/{songId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == resource.data.ownerUserId;
      }
      
      // Votes en salas
      match /votes/{voteId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == request.data.voterUserId;
      }
    }
  }
}
```

4. **Obtener credenciales:**
   - Ve a Project Settings > General
   - En la sección "Your apps", añade una aplicación web
   - Copia las credenciales y actualiza `.env.local`

### 3. Configurar Spotify

1. **Crear app en Spotify:**
   - Ve a [Spotify for Developers](https://developer.spotify.com/dashboard)
   - Crea una nueva aplicación
   - Añade `http://localhost:3000/api/auth/spotify/callback` en Redirect URIs
   - Copia Client ID y Client Secret (ya están en el .env.local)

### 4. Variables de Entorno

Actualiza el archivo `.env.local` con tus credenciales de Firebase:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 🎮 Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## ✅ Funcionalidades Implementadas - Fase 1

### Autenticación
- ✅ Login anónimo con Firebase Auth
- ✅ Integración con Spotify OAuth
- ✅ Obtención de top tracks del usuario
- ✅ Almacenamiento de datos de usuario en Firestore

### Gestión de Salas
- ✅ Creación de salas con configuración personalizable
- ✅ Códigos de sala únicos (8 caracteres)
- ✅ Unirse a salas existentes
- ✅ Sistema de lobby con lista de jugadores
- ✅ Roles diferenciados (host/jugador)

### Base de Datos
- ✅ Estructura de colecciones Firestore según PRD
- ✅ Funciones CRUD para usuarios y salas
- ✅ Subscripciones en tiempo real para actualizaciones
- ✅ Subcolecciones para players, songs, y votes

### Interfaz de Usuario
- ✅ Diseño responsive con Tailwind CSS
- ✅ Tema inspirado en Spotify
- ✅ Componentes reutilizables
- ✅ Estados de carga y error

## 🔧 Estructura del Proyecto

```
guessify/
├── app/
│   ├── api/auth/spotify/callback/
│   ├── room/[roomId]/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── CreateRoom.js
│   ├── JoinRoom.js
│   ├── UserProfile.js
│   ├── RoomLobby.js
│   ├── GameHost.js (placeholder)
│   └── GamePlayer.js (placeholder)
├── contexts/
│   └── AuthContext.js
├── lib/
│   ├── firebase.js
│   ├── spotify.js
│   └── firestore.js
└── .env.local
```

## 🧪 Cómo Probar

1. **Autenticación:**
   - Abre la aplicación
   - Haz clic en "Conectar con Spotify"
   - Autoriza la aplicación
   - Verifica que se muestre tu perfil

2. **Crear Sala:**
   - Una vez autenticado, haz clic en "Crear Sala"
   - Configura los parámetros del juego
   - Verifica que se genere un código de sala

3. **Unirse a Sala:**
   - En otra ventana/dispositivo, usa "Unirse a Sala"
   - Ingresa el código generado
   - Verifica que aparezca en la lista de jugadores

## 🚧 Próximos Pasos - Fase 2

- Implementar Spotify Web Playback SDK
- Sistema de reproducción y votación
- Lógica de puntuación
- Interfaz de juego completa
- Clasificaciones en tiempo real

## 🐛 Resolución de Problemas

### Firebase no conecta
- Verifica que las credenciales en `.env.local` sean correctas
- Asegúrate de que el proyecto Firebase tenga Firestore habilitado

### Spotify no autentica
- Verifica que la Redirect URI esté configurada correctamente
- Asegúrate de que el Client ID sea público (NEXT_PUBLIC_)

### Errores de compilación
- Ejecuta `npm install` para asegurar todas las dependencias
- Verifica que Node.js sea versión 18 o superior
