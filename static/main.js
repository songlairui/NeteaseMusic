// let mp3Url = 'http://118.193.228.119/tmpfile/yezi-live.mp3'
let mp3Url = './野子 (Live).mp3'
  // let mp3Url = 'https://og1zqhijc.qnssl.com/tmp/file/yezi-live.mp3'
let lrc = []
let audio = document.createElement('audio')
audio.style.display = 'none'
audio.src = mp3Url
audio.ok = false
audio.playbackRate = 30
  //  音频可以播放时，标示变量变为true
audio.oncanplay = function() {
    audio.ok = true
  }
  // 音频播放过程中，跟随进度激活歌词
audio.ontimeupdate = function() {
    console.info('playing at: ' + audio.currentTime)
    activeLrc()
  }
  // 音频播放完成，不再旋转
audio.onended = function endPlay() {
  togglePlay(false)
  let lrcEl = document.querySelector('.lyric ul')
  lrcEl.style.display = 'none'
  lrcEl.style.transform = 'translateY(0px)'
  void lrcEl.clientWidth
  lrcEl.style.display = 'flex'
}


window.addEventListener('resize', function() {
  console.info('resize')
    // 节流函数？
  setHtmlRem()
})
document.addEventListener('DOMContentLoaded', function() {
  setHtmlRem()
  loadLrc()
    // alert(`${window.devicePixelRatio}、${document.documentElement.clientWidth}`)
    // let tip = document.createElement('div')
    // tip.textContent = `${window.devicePixelRatio}、${document.documentElement.clientWidth}`
    // document.documentElement.appendChild(tip)
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

function togglePlay(option) {
  if (audio.ok) {
    let el = document.querySelector('.disc');
    (
      typeof option !== 'undefined' ?
      option :
      audio.paused
    ) ?
    (el.classList.add('playing'), audio.play()) : (el.classList.remove('playing'), audio.pause())
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
      // 修复计算错误，添加括号，优先进行隐式类型转换
    let stamp = +tmp[0] * 60 + (+tmp[1])
    return stamp < currentStamp
  })[0]

  let lrcEl = document.querySelector('.lyric ul')
  let target = lrcEl.querySelector(`[data-stamp='${current?current[0]:'00:00.00'}']`)
  let currentActive = [].filter.call(lrcEl.querySelectorAll('li'), el => el.matches('.current'))

  // 当能获取到target，并且处于正在激活状态的dom元素中不包含target时，才进行更改dom的操作  
  // onTimeUpdate 时间频次较高，做这样的处理，能够避免过多的dom操作。
  if (target && currentActive.indexOf(target) === -1) {
    // 所有元素移除 .current
    currentActive.forEach(el => el.classList.remove('current'))

    target.classList.add('current')
    lrcEl.style.transform = `translateY(${- target.offsetTop + 2 * target.offsetHeight}px)`
  }
}