const cache = {}

function canPlayOgg() {
  const a = document.createElement('audio')
  return a.canPlayType('audio/ogg') !== ''
}

export function playSound(name) {
  if (!name || name === 'mute') return
  if (cache[name] === null) return // previously confirmed missing — stay silent

  const ext = canPlayOgg() ? 'ogg' : 'mp3'
  const src = `/sounds/${ext}/${name}.${ext}`

  try {
    const audio = new Audio(src)
    audio.onerror = () => { cache[name] = null } // mark as missing, never retry
    audio.play().catch(() => {}) // autoplay blocked — ignore silently
    cache[name] = true
  } catch {
    cache[name] = null
  }
}
