import { PALETTES, paletteById } from './palettes.js'

const DEFAULTS = {
  enabled: true,
  follow: true,
  paletteId: 'aurora',
  palette: null,
  accent: '',
  wallpaper: '',
  blur: 6,
  dim: 35,
  panelOpacity: 78,
  reactive: true,
  syncedAt: 0,
}
const MAX_EDGE = 2560

const $ = id => document.getElementById(id)
let settings = DEFAULTS

async function save(patch) {
  settings = { ...settings, ...patch }
  await chrome.storage.local.set({ mantle: settings })
  render()
}

// Downscale big photos so storage and the page stay light.
function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.86))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function render() {
  const p = settings.palette ?? paletteById(settings.paletteId)
  document.documentElement.style.setProperty('--accent', settings.accent || p.accent)
  $('enabled').checked = settings.enabled
  $('follow').checked = settings.follow
  $('reactive').checked = settings.reactive
  $('accent').value = settings.accent || p.accent
  for (const key of ['blur', 'dim', 'panelOpacity']) {
    $(key).value = settings[key]
    $(key).nextElementSibling.textContent = key === 'blur' ? `${settings[key]}px` : `${settings[key]}%`
  }
  $('wall-preview').style.backgroundImage = settings.wallpaper ? `url("${settings.wallpaper}")` : ''
  $('wall-preview').style.display = settings.wallpaper ? 'block' : 'none'
  for (const button of document.querySelectorAll('.preset')) {
    button.setAttribute('aria-pressed', String(button.dataset.id === p.id))
  }
}

function buildPresets() {
  const host = $('presets')
  for (const p of PALETTES) {
    const button = document.createElement('button')
    button.className = 'preset'
    button.dataset.id = p.id
    const swatch = document.createElement('span')
    swatch.className = 'swatch'
    for (const color of [p.bg, p.surface, p.accent, p.accent2, p.info, p.success]) {
      const chip = document.createElement('i')
      chip.style.background = color
      swatch.append(chip)
    }
    const name = document.createElement('span')
    name.textContent = p.name
    button.append(swatch, name)
    button.addEventListener('click', () => save({ paletteId: p.id, palette: null, accent: '' }))
    host.append(button)
  }
}

async function init() {
  const { mantle } = await chrome.storage.local.get('mantle')
  settings = { ...DEFAULTS, ...mantle }
  buildPresets()

  $('enabled').addEventListener('change', e => save({ enabled: e.target.checked }))
  $('follow').addEventListener('change', e => save({ follow: e.target.checked, syncedAt: 0 }))
  $('reactive').addEventListener('change', e => save({ reactive: e.target.checked }))
  $('accent').addEventListener('change', e => save({ accent: e.target.value }))
  $('accent-reset').addEventListener('click', () => save({ accent: '' }))
  $('wall-clear').addEventListener('click', () => save({ wallpaper: '' }))
  $('wall-file').addEventListener('change', async e => {
    const file = e.target.files?.[0]
    if (file) await save({ wallpaper: await shrink(file) })
  })
  $('wall-url').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return
    const url = e.target.value.trim()
    if (/^https:\/\//i.test(url)) void save({ wallpaper: url })
  })
  for (const key of ['blur', 'dim', 'panelOpacity']) {
    $(key).addEventListener('input', e => save({ [key]: Number(e.target.value) }))
  }
  render()
}

void init()
