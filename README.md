# Guessify

Guessify es una aplicación web construida con Next.js que se conecta con Spotify para crear un juego de adivinanzas basado en tu música favorita. Muestra tus 50 canciones más escuchadas de los últimos 6 meses y genera listas aleatorias para que puedas escuchar previews de 30 segundos.

## 🚀 Características

- **Autenticación con Spotify**: Login seguro usando OAuth 2.0
- **Top Tracks**: Obtiene tus 50 canciones más escuchadas
- **Lista Aleatoria**: Genera selecciones aleatorias de tus canciones favoritas
- **Reproductor Integrado**: Escucha previews de 30 segundos
- **Diseño Responsivo**: Optimizado para móvil, tablet y escritorio
- **UI Moderna**: Diseñado con Tailwind CSS v4

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS v4
- **Autenticación**: NextAuth.js
- **API**: Spotify Web API
- **Iconos**: Lucide React

## 📋 Prerrequisitos

1. **Node.js** (versión 18 o superior)
2. **Cuenta de Desarrollador de Spotify**
3. **Git**

## 🔧 Configuración de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicación
3. Configura las URIs de redirección:
   - Para desarrollo: `http://localhost:3000/api/auth/callback/spotify`
   - Para producción: `https://tu-dominio.com/api/auth/callback/spotify`
4. Guarda el **Client ID** y **Client Secret**

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/guessify.git
   cd guessify
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales:
   ```bash
   SPOTIFY_CLIENT_ID=tu_client_id_de_spotify
   SPOTIFY_CLIENT_SECRET=tu_client_secret_de_spotify
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=tu_clave_secreta_aleatoria
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador**
   Ve a [http://localhost:3000](http://localhost:3000)

## 🏗️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia la aplicación en modo producción
- `npm run lint` - Ejecuta el linter

## 📱 Uso

1. **Inicia sesión** con tu cuenta de Spotify
2. **Autoriza** la aplicación para acceder a tu música
3. **Explora** tu lista aleatoria generada
4. **Reproduce** previews de 30 segundos haciendo clic en las canciones
5. **Genera** nuevas listas aleatorias con el botón de refresh

## 📁 Estructura del Proyecto

```
guessify/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── spotify/top-tracks/
│   │   ├── dashboard/
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── AudioPlayer.js
│   │   ├── AuthProvider.js
│   │   ├── Navbar.js
│   │   └── SongCard.js
│   └── utils/
│       └── music.js
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Diseño

La aplicación sigue el PRD (Product Requirements Document) incluido en el proyecto:

- **Colores**: Verde Spotify (#1DB954) como color primario
- **Tipografía**: Inter como fuente principal
- **Responsive**: Diseño móvil-first
- **Animaciones**: Transiciones suaves y efectos hover

## 🔒 Seguridad

- Las credenciales de Spotify se almacenan como variables de entorno
- Los tokens de acceso se manejan de forma segura con NextAuth.js
- Solo se solicitan los permisos mínimos necesarios de Spotify

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube tu código a GitHub
2. Conecta tu repositorio en [Vercel](https://vercel.com)
3. Configura las variables de entorno en Vercel
4. Actualiza `NEXTAUTH_URL` con tu dominio de producción
5. Actualiza las URIs de redirect en Spotify Developer Dashboard

### Otros Proveedores

La aplicación es compatible con cualquier proveedor que soporte Next.js:
- Netlify
- AWS Amplify
- Railway
- Digital Ocean

## 🗓️ Roadmap

### MVP 1 (Actual)
- ✅ Login con Spotify
- ✅ Obtener top 50 tracks
- ✅ Lista aleatoria
- ✅ Reproductor de previews

### MVP 2 (Próximamente)
- 🔄 Múltiples usuarios en sala
- 🔄 Lógica de puntuación
- 🔄 Reproducción completa via Spotify Connect

### MVP 3 (Futuro)
- ⏳ Estadísticas y ranking
- ⏳ Guardar playlists en Spotify
- ⏳ Compartir en redes sociales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa las [Issues existentes](https://github.com/tu-usuario/guessify/issues)
2. Crea un nuevo Issue si no encuentras solución
3. Asegúrate de incluir información detallada sobre el problema

## 📊 API de Spotify

Esta aplicación utiliza:
- **Spotify Web API**: Para obtener datos del usuario
- **Scopes utilizados**:
  - `user-read-private`: Información básica del perfil
  - `user-top-read`: Top tracks del usuario

## 🔧 Solución de Problemas

### Error: "No autorizado"
- Verifica que las credenciales de Spotify sean correctas
- Asegúrate de que las URIs de redirect estén configuradas correctamente

### Error: "No se encontraron canciones"
- Asegúrate de tener historial de reproducción en Spotify
- Algunos tracks pueden no tener preview disponible

### Error de CORS
- Verifica que `NEXTAUTH_URL` esté configurado correctamente
- En producción, debe coincidir con tu dominio

---

Hecho con ❤️ para los amantes de la música
