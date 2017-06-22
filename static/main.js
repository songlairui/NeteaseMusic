let mp3Url = 'http://118.193.228.119/tmpfile/yezi-live.mp3'
// let mp3Url = './野子 (Live).mp3'
let lrc = []
let audio = document.createElement('audio')
audio.src = mp3Url
audio.ok = false
audio.oncanplay = function() {
  audio.ok = true
}
audio.ontimeupdate = function() {
  // console.info('playing at: ' + audio.currentTime)
  activeLrc()
}

window.addEventListener('resize', function() {
  console.info('resize')
  // 节流函数？
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

function activeLrc() {
  let currentStamp = audio.currentTime
    // let lrcTimePool = 
  let current = lrc.filter(v => v[0]).reverse().filter(v => {
    let tmp = v[0].split(':')
    let stamp = +tmp[0] * 60 + tmp[1]
    return stamp < currentStamp
  })[0]

  let lrcEl = document.querySelector('.lyric ul')
  let target = lrcEl.querySelector(`[data-stamp='${current?current[0]:'00:00.00'}']`)
    // 所有元素移除 .current
  let currentActive = [].filter.call(lrcEl.querySelectorAll('li'), el => el.matches('.current'))

  if (target && currentActive.indexOf(target) === -1) {
    currentActive.forEach(el => el.classList.remove('current'))

    target.classList.add('current')
    lrcEl.style.transform = `translateY(${- target.offsetTop + 2 * target.offsetHeight}px)`

  }
}