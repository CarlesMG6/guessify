# Documento de Requerimientos del Producto (PRD): Juego Social de Canciones
Este proyecto consiste en un juego tipo trivia musical social, similar a Kahoot, pero centrado en reproducir fragmentos de canciones. Varios jugadores (entre 1 y 12) se unen a una sala; se genera aleatoriamente una lista de canciones favoritas de los jugadores conectados, y en cada ronda se reproducen ~20 segundos de una canción. Durante la reproducción, cada jugador debe votar cuál de los jugadores presentes es el “dueño” de esa canción (a quién le gusta más). Al final de cada ronda y al término de la partida, se calcula y muestra la clasificación con las puntuaciones de cada jugador.
## Stack Tecnológico
    • Next.js (React Framework):[1] Usaremos Next.js (sin TypeScript) para la aplicación web, aprovechando su soporte nativo para CSS (incluyendo Tailwind) y API routes para la lógica backend.
    • Tailwind CSS v4: Tailwind es un framework CSS “utility-first” que facilita construir diseños rápidamente usando clases utilitarias en el HTML[2]. La versión 4.0 ofrece mejoras de rendimiento significativas (hasta 5× más rápido en compilación completa) y aprovecha las últimas características de CSS[3]. Tailwind agilizará el desarrollo de la interfaz (diseño responsivo, theming, animaciones, etc.) sin escribir CSS personalizado complejo.
    • Firebase (Firestore y Auth): Utilizaremos Firebase como backend en tiempo real. Firebase Authentication gestionará las identidades (usuarios registrados de la web) y también usaremos OAuth de Spotify para el login. La base de datos principal será Cloud Firestore, una base de datos NoSQL escalable y en tiempo real adecuada para sincronizar el estado del juego entre dispositivos[4]. Firestore asegurará alta disponibilidad de datos y notificaciones en tiempo real cuando se actualice el estado de la partida.
Adicionalmente, se integrará el Spotify Web Playback SDK para reproducir canciones. Este SDK permite transmitir música de Spotify directamente en el navegador web creando un dispositivo local de Spotify Connect[5]. Importante: Spotify exige que la cuenta utilizada para reproducir sea Premium[6], por lo que el host deberá autenticarse con una cuenta Premium. También usaremos la Spotify Web API para obtener datos de las canciones favoritas de los jugadores (top tracks de corto, medio y largo plazo).
## Estructura de Base de Datos en Firebase
Se diseñará una estructura de colecciones (tablas) en Firestore para guardar usuarios, salas de juego, configuración de partida, canciones seleccionadas y votos. A continuación se detallan las colecciones principales y sus campos:
   ### usuarios: Colección global de usuarios registrados en la web. Cada documento representa un usuario (jugador). Campos:
    • id (string, docId) – Identificador único del usuario (Firebase UID).
    • spotifyId (string) – ID de usuario en Spotify.
    • nombre (string) – Nombre que el jugador elige.
    • topTracks_short (array) – Lista de pistas preferidas (objeto pista) corto plazo.
    • topTracks_medium (array) – Lista de pistas preferidas medio plazo.
    • topTracks_long (array) – Lista de pistas preferidas largo plazo. Estos arrays se poblarán tras el login con Spotify (consultando la API /me/top/tracks[7]).
    • resto de datos de usuario que devuelve spotify (email, link imagen, etc.)
   ### salas: Colección de salas (partidas). Cada documento es una sala/juego activo. Campos:
    • id (string, docId) – Identificador de sala (también puede usarse como código para unirse).
    • hostUserId (string) – ID del usuario host (referencia a usuarios).
    • config (objeto) – Configuración inicial de la partida, con:
        ◦ numSongs (int) – Número total de canciones a adivinar.
        ◦ autoStart (bool) – Si las rondas avanzan automáticamente o el host debe iniciar cada ronda.
        ◦ delayStartTime (bool) – Tiempo (segundos) que se reproduce la canción antes de mostrar las opciones de votación (configurable de 0 a 30s, por defecto 5s)
        ◦ timePerRound (int) – Tiempo (segundos) total para votar en cada canción (por defecto 10).
        ◦ revealSongName (bool) – Si se mostrará el nombre de la canción al público.
        ◦ revealArtists (bool) – Si se mostrará el/los artista(s) de la canción.
        ◦ revealCover (bool) – Si se mostrará la imagen de portada.
    • state (objeto) – Estado de la partida en tiempo real:
        ◦ started (bool) – Si la partida ha comenzado.
        ◦ currentRound (int) – Ronda actual (índice de canción actual).
    • playlist (referencia) – (Opcional) subcolección o campo con lista de canciones asignadas.
Subcolecciones de salas/{salaId}: - players (jugadores en la sala): Cada doc contiene: - userId (string) – ID de usuario (ref a usuarios). - nombre (string) – Nombre que introdujo para esta partida. - score (int) – Puntuación acumulada en la partida (inicia en 0). - songs (lista de canciones de la partida): Cada doc representa una canción a adivinar: - trackId (string) – ID de Spotify de la canción. - title (string) – Nombre de la canción. - artists (array) – Lista de nombres de artistas. - coverUrl (string) – URL de la imagen de portada. - ownerUserId (string) – ID de usuario al que le gusta esta canción (dueño). - votes (votaciones): Cada doc es un voto emitido por un jugador en alguna ronda: - voterUserId (string) – ID del usuario que vota. - votedForUserId (string) – ID del jugador elegido (según votación). - trackId (string) – ID de la canción sobre la que se vota. - timestamp (timestamp) – Momento (Epoch) en que se registró el voto. - isCorrect (bool) – Si el voto fue correcto (votedForUserId == ownerUserId del track). Se puede calcular y almacenar.
Estas colecciones se relacionan de la siguiente manera: cada sala referencia al host y a múltiples jugadores (players) y canciones (songs). Los datos de usuario se guardan en usuarios y se referencian desde las salas. Al finalizar cada ronda se consultan los documentos de votes para calcular puntuaciones y luego se actualizan los campos score de los documentos en players. Esta estructura emula la forma en que se manejan tableros de puntuación en otras aplicaciones de juegos en tiempo real[8].

## Flujos y Fases de la Aplicación
A continuación se describen detalladamente los diferentes flujos y etapas desde la creación de la sala hasta el fin de la partida.
1. ### Creación de Sala (Host)
    1. El usuario host abre la web y crea una nueva sala de juego. Se genera un código único de sala (salaId) y se crea el documento correspondiente en la colección salas con el campo hostUserId. Inicialmente la lista de jugadores está vacía y started=false.
    2. Se define la configuración inicial de la partida. El host elige:
    3. Cantidad total de canciones a adivinar (numSongs).
    4. Tiempo por ronda (timePerRound), por ejemplo 10 segundos.
    5. Opciones de visualización: mostrar/ocultar el nombre de la canción, los artistas y la portada (revealSongName, revealArtists, revealCover).
    6. Modo de avance: partidas automáticas (autoStart=true) o avanzadas manualmente por el host (autoStart=false).
Esta configuración se almacena en el campo config del documento de sala en Firestore.
    7. Login de Spotify del Host: El host debe autenticarse con su cuenta de Spotify para poder reproducir canciones. Esta cuenta debe ser Premium para usar el SDK de reproducción[6]. Tras el login, se inicializa el Spotify Web Playback SDK para que la web del host pueda controlar la reproducción de pistas en la sala.
    8. El host mostrará en su pantalla el código de sala (y/o un código QR) para que otros jugadores se unan. El código QR puede apuntar a una URL como /join/{salaId}.
2. ### Unirse a la Sala (Jugadores)
    1. Cada jugador (dispositivo móvil) escanea el QR o ingresa manualmente el código de sala. Se conecta al endpoint /join/{salaId}.
    2. En el cliente jugador, se pide login con su propia cuenta de Spotify (requisito para participar y para extraer sus gustos musicales). Tras autenticarse, se obtiene el spotifyId y los datos de perfil. Se crea o actualiza un documento en usuarios con spotifyId y campos iniciales (si aún no existe).
    3. El jugador ingresa su nombre de jugador (nickname). Este nombre se almacena en el subdocumento correspondiente a ese jugador bajo salas/{salaId}/players junto con userId (referencia al doc de usuarios) y score = 0.
    • Nota: el ID de jugador en la sala se correlaciona con su documento en usuarios.
    4. Una vez logado, la web del jugador recupera sus canciones favoritas usando la API de Spotify. Se llama al endpoint Get User's Top Tracks con parámetros time_range=short_term, medium_term, long_term para obtener sus top 50 canciones de corto, medio y largo plazo[7]. Estos datos (track IDs, nombres, artistas, portadas) se almacenan en el documento usuarios o en el cliente para usar posteriormente.
    5. El jugador queda en estado “listo” a la espera de que el host inicie la partida.
3. ### Inicio de Partida
    1. Una vez que hay al menos 1 jugador conectado (máximo 12) y todos están preparados, el host comienza la partida. Se actualiza salas/{salaId}.state.started = true.
    2. La web calcula la lista de canciones aleatorias para la partida. Para ello, se mezclan los top tracks de cada jugador: por ejemplo, para cada usuario se puede tomar un subconjunto de sus canciones favoritas (recuperadas en el paso anterior) y luego escoger aleatoriamente numSongs entradas, asegurando variedad. Cada canción se guarda en salas/{salaId}/songs con sus metadatos (trackId, title, artists, coverUrl) y el ownerUserId correspondiente al jugador del cual proviene la recomendación.
    3. Si la partida se configuró en autoStart, automáticamente se pasa a la fase de la primera ronda. Si el host debe iniciar cada ronda manualmente, la interfaz muestra un botón “Iniciar Ronda” que el host presionará para avanzar.
4. ### Desarrollo de la Partida (por ronda)
Cada ronda consiste en las siguientes etapas:
    • Inicio de Ronda / Conteo Regresivo: Se prepara la canción en el dispositivo host, cuando está lista se empieza a reproducir y en los dispositivos de los jugadores se muestra una cuenta regresiva visual (5,4,3,2,1) antes de que aparezcan las opciones de votación. 5 segundos que tendrán para escuchar la canción antes de votar. (Este tiempo es configurable al inicio de partida)
    • Reproducción de la Canción: El host utiliza el Spotify Web Playback SDK para reproducir la canción actual (20 segundos, o según se defina). El SDK (que actúa como un dispositivo de Spotify Connect) maneja la reproducción de audio[5]. Durante estos segundos, en la pantalla del host se mostrará un efecto visual: la portada del álbum dentro de un vinilo girando, con un agujero central para simular un disco de vinilo. Debajo o encima del vinilo aparecerán el título de la canción y los artistas, solo si la configuración revealSongName/revealArtists lo permite. También se muestra un contador de segundos restante para votar y una barra de progreso.
Figura: Ejemplo conceptual de la visualización en el host durante la reproducción. El vinilo (imagen de portada con agujero central) gira mientras se reproduce la canción, y se muestra la información seleccionada (título y artista) según la configuración.
    • Votación de Jugadores: En cuanto inicia la reproducción, en las pantallas de los jugadores se muestran N botones (donde N es el número de jugadores). Cada botón está etiquetado con el nombre de un jugador en la partida. Los jugadores deberán pulsar el botón del supuesto “dueño” de la canción. Solo se permite un voto por jugador por ronda. Cuando el jugador hace su elección, se crea un documento en salas/{salaId}/votes con voterUserId, votedForUserId, trackId y la marca de tiempo (timestamp). También se calcula si la votación es correcta (isCorrect), comparando votedForUserId con el ownerUserId de la canción.
    • Puntuación: Al registrarse un voto, se calcula el puntaje obtenido por ese jugador en base al tiempo de su respuesta. Supongamos que el jugador tiene hasta n segundos para votar (por ejemplo n=10). Se otorga puntaje inversamente proporcional al tiempo transcurrido. Por ejemplo, con n=10 segundos, si alguien vota inmediatamente (tiempo=0) recibe 1000 puntos, mientras que si vota en el último segundo recibe ~200 puntos. Una fórmula lineal puede ser: puntaje = 1000 - 80*(t) (donde 80 = (1000-200)/10). En la práctica, el tiempo se computa restando la marca de inicio de ronda y la marca de timestamp del voto. Este valor de puntos se suma al campo score del jugador votante en la subcolección players de la sala. Se puede usar una transacción o un Cloud Function para evitar condiciones de carrera. Al estilo de un ranking en tiempo real, los puntajes se actualizan en Firestore y se reflejan inmediatamente en todos los clientes[8].
    • Fin de Ronda y Clasificación Parcial: Al finalizar el tiempo de votación (o haber recogido todos los votos), la web compila los resultados de la ronda. Se recuperan los datos de votos de Firestore; se suman los puntos ganados por cada jugador en esta ronda y se actualiza su puntuación acumulada. Luego en la pantalla de host (y opcionalmente en los jugadores) se muestra la clasificación de la ronda: una lista ordenada de mayor a menor puntuación actual.
      Figura: Ejemplo conceptual de tabla de puntuaciones al final de la ronda. Los jugadores se listan por orden descendente de puntaje total (1ro arriba).
    • Siguientes Rondas: Si quedan canciones pendientes (rondas restantes), se procede a la siguiente. Si se configuró autoStart=true, el conteo regresivo y reproducción de la siguiente canción se inician automáticamente tras un breve descanso. Si no, el host debe pulsar “Iniciar Ronda” nuevamente. Este ciclo continúa hasta completar numSongs rondas.
    • Fin de Partida: Una vez terminadas todas las rondas, la partida finaliza. Se muestra la clasificación final, similar al paso anterior (todos los puntos acumulados). Se puede ofrecer opción de reiniciar juego o salir.
## Consideraciones Adicionales
    • Cantidad de Jugadores: Se permite un mínimo de 1 jugador (útil para pruebas) y un máximo de 12 simultáneos. En práctica, con 1 jugador la partida sería trivial; lo normal es 3–6. Se asegura que la UI maneje dinámicamente el número de botones para votar.
    • Roles de Usuario: El host tiene controles adicionales (crear sala, iniciar rondas), mientras que los jugadores solo votan. La web debe diferenciar la interfaz según el rol.
    • Persistencia de Usuario: El nombre y preferencias de cada usuario se guardan en usuarios, de modo que en partidas futuras se recuerden (por ejemplo, su spotifyId permite cargar automáticamente sus top tracks).
    • Seguridad: Se implementarán reglas de Firestore que permitan solo a los usuarios apropiados leer/escribir datos de la sala (por ejemplo, solo los usuarios listados en players pueden votar en esa sala).
## Resumen de Tablas/Colecciones
    • usuarios: (id, spotifyId, nombre, topTracks_short, topTracks_medium, topTracks_long)
    • salas: (id, hostUserId, config, state)
    • subcolección salas/{id}/players: (userId, nombre, score)
    • subcolección salas/{id}/songs: (trackId, title, artists, coverUrl, ownerUserId)
    • subcolección salas/{id}/votes: (voterUserId, votedForUserId, trackId, timestamp, isCorrect)
Con esta definición, la aplicación podrá gestionar la creación de partidas sociales de adivinar canciones, con sincronización en tiempo real de estado y puntuaciones. Las referencias citadas respaldan el uso de la tecnología y la estructura de datos propuesta[1][2][3][4][7][6][8].

## Fases
### Fase 1
- Conexión a bbdd
- Creación de salas y conexión a salas de otros usuarios
- Autenticación firebase y spotify
- Creación usuario en bbdd con datos de canciones de spotify

### Fase 2
- Juego completo.


[1] Next.js by Vercel - The React Framework
https://nextjs.org/
[2] Tailwind CSS - Rapidly build modern websites without ever leaving your HTML.
https://tailwindcss.com/
[3] Tailwind CSS v4.0 - Tailwind CSS
https://tailwindcss.com/blog/tailwindcss-v4
[4] Power up your game development using Firebase  |  Firebase for Games
https://firebase.google.com/docs/games/setup
[5] [6] Web Playback SDK | Spotify for Developers
https://developer.spotify.com/documentation/web-playback-sdk
[7] Web API Reference | Spotify for Developers
https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
[8] Build a Multiplayer Gaming App with Next.js and Firebase
https://getstream.io/blog/multiplayer-gaming-nextjs/