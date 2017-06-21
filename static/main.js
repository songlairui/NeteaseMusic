let mp3Url = 'http://118.193.228.119/tmpfile/zhanzhengshijie.mp3'
let lrc = []
let audio = document.createElement('audio')
audio.src = mp3Url
audio.ok = false
audio.oncanplay = function() {
  audio.ok = true
}
window.addEventListener('resize', function() {
  console.info('resize')
  setHtmlRem()
})
document.addEventListener('DOMContentLoaded', function() {
  setHtmlRem()
  loadLrc()
})

document.addEventListener('click', function(e) {
  if (searchEl('.disc', e.target)) {
    togglePlay()
  }
})

function setHtmlRem() {
  // document.documentElement.setAttribute('dpr') = window.devicePixelRatio
  let scale = document.querySelector('#app').clientWidth / 375
  console.info(scale)
  document.documentElement.style.fontSize = `${375 * scale}px`
}

function searchEl(selector, target, pool) {
  let el = target
  pool = pool || document.documentElement
  while (!el.matches(selector)) {
    if (el === pool) {
      el = null
      break
    }
    el = el.parentNode
  }
  return el
}

function togglePlay() {
  if (audio.ok) {
    document.querySelector('.disc').classList.toggle('playing')
    audio.paused ? audio.play() : audio.pause()
  }
}

function loadLrc() {
  let lrcUrl = './lrc.json'
  fetch(lrcUrl)
    .then(data => data.text())
    .then(result => {
      lrc = JSON.parse(result).lrc.replace(/(.{1})\[/g, '$1\n[').split('\n').map(v => {
        let first = /\[(.*)\]/.exec(v)[1]
        let lrc = /\](.*)/.exec(v)[1]
        let isTitle = !/^\d/.test(first)
        return isTitle ? ['', first] : [first, lrc]
      })
      return lrc
    })
    .then(lrc => {
      let oFrag = document.createDocumentFragment()
      lrc.reduce((prev, current) => {
        // console.info(prev[1],current[1])
        let item = document.createElement('li')
        current[0] ? item.dataset.stamp = current[0] : null
        item.textContent = current[1]
        oFrag.appendChild(item)
      }, '')
      document.querySelector('.lyric ul').appendChild(oFrag)
    })
}