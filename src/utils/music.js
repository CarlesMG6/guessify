/**
 * Mezcla un array usando el algoritmo Fisher-Yates
 */
export function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Selecciona N elementos aleatorios de un array
 */
export function getRandomTracks(tracks, count = 10) {
  if (tracks.length === 0) return []
  
  const shuffled = shuffleArray(tracks)
  return shuffled.slice(0, Math.min(count, tracks.length))
}

/**
 * Formatea la duración de milisegundos a mm:ss
 */
export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Obtiene la mejor imagen de un album
 */
export function getBestImage(images) {
  if (!images || images.length === 0) return null
  
  // Buscar imagen de 300x300, si no existe, la primera disponible
  const preferredImage = images.find(img => img.width === 300) || images[0]
  return preferredImage.url
}
