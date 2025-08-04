# Product Requirements Document (PRD)

## 1. Resumen

Guessify es una aplicación web social construída con Next.js y Tailwind CSS v4, que sincroniza una cuenta de Spotify de un usuario para crear un juego de adivinanzas basado en sus hábitos de escucha. En la primera fase (MVP), se implementará únicamente el login con Spotify y la obtención de las 50 canciones más escuchadas del usuario en los últimos 6 meses. A partir de ahí se generará una lista aleatoria de esos temas.

La interfaz mostrará el nombre de la canción, la portada y reproducirá la canción. Más adelante, añadirán múltiples usuarios en una sala y mezclarán su top 50 para el juego social.

---

## 2. Objetivos del producto

* **Principal:** Validar el concepto de juego musical social integrando la API de Spotify con tech stack moderno.
* **Secundarios:**

  * Probar flujo de OAuth con Spotify en Next.js.
  * Verificar rendimiento de llamadas a la API (top 50 tracks).

---

## 3. Público objetivo

* Usuarios de Spotify (cuentas Free o Premium) que quieran probar una experiencia musical interactiva.

---

## 4. Stack tecnológico

* **Frontend:** Next.js
* **Estilos:** Tailwind CSS v4
* **Backend/Autenticación:** Next.js API Routes
* **Base de datos (opcional):** Firebase Firestore (para fases posteriores)

---

## 5. Funcionalidades clave (requisitos funcionales)

### 5.1 Autenticación con Spotify

* Login mediante OAuth 2.0 (Authorization Code Flow).
* Solicitar únicamente los scopes mínimos:

  * `user-read-private` (perfil básico)
  * `user-top-read` (top tracks)
* Almacenar temporalmente `access_token` y `refresh_token` en sesión segura.

### 5.2 Obtención de datos de usuario

* Llamada a `GET https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term`.
* Almacenar respuesta en memoria o en Firebase (opcional).

### 5.3 Generación de lista aleatoria

* Seleccionar aleatoriamente N canciones (configurable) de las 50 top tracks.
* Guardar el array de URIs para renderizar.

### 5.4 Interfaz de reproducción

* Mostrar en pantalla:

  * Nombre de la canción
  * Artista
  * Portada (`album.images`)

---

## 6. Requisitos de negocio

* Validar que la integración con Spotify y la UI funcionan sin fricción.
* Medir tiempo medio de autenticación y carga de top tracks (<3s).
* KPI inicial: número de logins exitosos.

---

## 7. Requisitos no funcionales

* **Performance:** llamadas a API y renderizado en <3 s.
* **Seguridad:** gestión segura de tokens (HTTPS, HTTP-only cookies).
* **Escalabilidad:** diseño modular con API Routes.
* **Compatibilidad:** responsive mobile + desktop.

---

## 8. Roadmap (MVP)

1. **MVP 1 (fase actual):**

   * Login con Spotify en Next.js
   * Fetch top 50 tracks últimos 6 meses
   * Generar lista aleatoria
   * Mostrar nombre, portada
2. **MVP 2:**

   * Permitir múltiples usuarios en una sala
   * Fusionar top 50 de cada uno
   * Lógica de rondas y puntuaciones
   * Reproducción de la canción completa via SDK o Spotify Connect
3. **MVP 3:**

   * Estadísticas finales y ranking
   * Guardar playlist en Spotify
   * Compartir en redes

---

## 10. Diseño Frontend (UI/UX)

### 10.1 Principios de diseño

* **Simplicidad:** Interfaz limpia y minimalista para centrar la atención en la música.
* **Consistencia:** Uso de componentes reutilizables con Tailwind v4.
* **Accesibilidad:** Contrastes adecuados y etiquetas ARIA donde sea necesario.
* **Responsividad:** Adaptable a móviles, tablets y escritorio.

### 10.2 Paleta de colores y tipografía

* **Primario:** Verde Spotify (#1DB954) para botones y elementos activos.
* **Secundario:** Gris oscuro (#191414) y blanco para fondos y textos.
* **Tipografía:** Fuente sans-serif moderna (ej. Inter o Roboto).

### 10.3 Estructura de pantallas

1. **Pantalla de Login**

   * **Header:** Logo de Guessify centrado.
   * **Botón principal:** “Iniciar sesión con Spotify” (color primario, icono de Spotify).
   * **Footer:** Créditos y enlaces a Términos/Privacidad.

2. **Dashboard / Playlist Aleatoria**

   * **Navbar superior:** Icono de menú (hamburguesa) y avatar del usuario.
   * **Título:** “Tu lista aleatoria” con subtítulo explicativo.
   * **Grid de tarjetas de canción:**  Listado en cuadrícula responsiva (2 columnas en móvil, 4 en desktop).

     * Cada **Card** muestra:

       * Portada en cuadro 1:1 con borde redondeado.
       * Nombre de la canción y artista debajo.
   * **Control centrado:** Botón flotante para regenerar lista (ícono refresh).

4. **Responsividad y estado móvil**

   * Menu lateral deslizante para navegación en móvil.
   * Tarjetas apiladas en 1 columna con scroll vertical.
   * Player bottom fijo con tamaño compacto.

### 10.4 Componentes clave

* **ButtonPrimary:** color primario, hover y focus states.
* **CardSong:** imagen, texto, botón play, sombra suave.
* **ModalPlayer:** overlay semitransparente, animación de fade in/out.
* **Navbar:** sticky top, fondo semitransparente.
* **Loader:** spinner centrado al cargar datos.

### 10.5 Animaciones y transiciones

* **Hover cards:** elevación suave y aumento de escala (scale 1.02).
* **Transición modal:** easing suave (ease-in-out) de 200 ms.
* **Carga inicial:** placeholder shimmer en tarjetas mientras se obtienen datos.

---
