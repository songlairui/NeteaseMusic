// let mp3Url = 'http://118.193.228.119/tmpfile/yezi-live.mp3'
// let mp3Url = './野子 (Live).mp3'
let mp3Url = 'https://og1zqhijc.qnssl.com/tmp/file/yezi-live.mp3'
let lrcFunc = 'settimeout'
let timer = null
let lrc = []
let audio = null
// cache for 激活的歌词
let activedLrcEl = new Set()

window.addEventListener('resize', function() {
  console.info('resize')
    // 节流函数？
  setHtmlRem()
})
document.addEventListener('DOMContentLoaded', function() {
  // 设置html的Rem
  setHtmlRem()
    // 加载歌词
  loadLrc()
    // 加载音乐
  loadAudio()
    // 设置 audio 的ontimeUpdate事件
  setAudioOntimeupdateFunc()
    // 设置setTimeout 序列
  setSettimeoutQueue()

  // alert(`${window.devicePixelRatio}、${document.documentElement.clientWidth}`)
  // let tip = document.createElement('div')
  // tip.textContent = `${window.devicePixelRatio}、${document.documentElement.clientWidth}`
  // document.documentElement.appendChild(tip)
})

document.addEventListener('click', function(e) {
  if (searchEl('.disc', e.target)) {
    togglePlay()
  }
  // 选择播放速度
  if (e.target.matches('input[name=playRate]') && audio) {
    // console.info(e.target.value, document.querySelector('input[name=playRate]:checked').value)
    audio.playbackRate === e.target.value ? null : (
      audio.playbackRate = e.target.value,
      // 切换速度时，更新 延迟序列
      setSettimeoutQueue()
    )
  }
  // 更改 lrcFunc 
  if (e.target.matches('input[name=lrcFunc]')) {
    // console.info(e.target.value, document.querySelector('input[name=playRate]:checked').value)
    lrcFunc === e.target.value ? null : (
      lrcFunc = e.target.value,
      // 切换歌词策略时，更新ontimeupdate，更新延迟序列
      setAudioOntimeupdateFunc(),
      setSettimeoutQueue()
    )
  }
})

/**
 * 设置动态REM
 */
function setHtmlRem() {
  // document.documentElement.setAttribute('dpr') = window.devicePixelRatio
  let scale = document.querySelector('#app').clientWidth / 375
  console.info(scale)
  document.documentElement.style.fontSize = `${375 * scale}px`
}

/**
 * 事件委托辅助函数
 */
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
/**
 * 切换播放状态
 */
function togglePlay(option) {
  if (audio.ok) {
    let el = document.querySelector('.disc');
    (
      typeof option !== 'undefined' ?
      option :
      audio.paused
    ) ?
    (el.classList.add('playing'), audio.play()) : (el.classList.remove('playing'), audio.pause())
    setSettimeoutQueue()
  }
}
/**
 * 加载歌词，使用了fetch。并在DOM中插入
 */
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

/**
 * 根据播放时间，激活指定歌词。配合ontimeupdate使用
 */
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

/**
 * 创建 audio dom
 */
function loadAudio() {
  // 创建音乐
  audio = document.createElement('audio')
  audio.style.display = 'none'
  audio.src = mp3Url
  audio.ok = false
  audio.playbackRate = 1
    //  音频可以播放时，标示变量变为true
  audio.oncanplay = function() {
    audio.ok = true
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
}
/**
 * 设置audio的ontimeupdate事件
 */
function setAudioOntimeupdateFunc() {
  // 音频播放过程中，跟随进度激活歌词
  // 如果lrcFunc 不是ontimeupdate,则ontimeupdate为null
  audio.ontimeupdate = lrcFunc === 'ontimeupdate' ? function() {
    console.info('playing at: ' + audio.currentTime)
    activeLrc()
  } : null
}

/**
 * 迭代进行播放歌词，配合 settimeoutQueue 方式使用
 */
function playLrc() {
  if (audio.paused) {
    console.info('歌曲是暂停状态，清空定时器，并return')
    clearTimeout(timer)
    timer = null
    return
  }
  if (timer) return
  console.info('播放歌词')
  let currentStamp = audio.currentTime
    // 获取当前激活的歌词，和下一个要激活的歌词
    // TODO: 使用缓存优化，减少reduce的执行次数
  let interval = 0
  let { currentLrc, nextLrc } = lrc.filter(v => v[0]).reduce((prev, current) => {
      // 如果传入的值有了nextLrc，说明取到了想要的值
      // console.info(`reduce 得到的上一个的返回值：${JSON.stringify(prev)}`)
      let { currentLrc, nextLrc } = prev
      if (nextLrc) return prev

      return lrcTime2Second(current[0]) > currentStamp ? { currentLrc, nextLrc: current[0] } : { currentLrc: current[0], nextLrc: '' }
    }, { currentLrc: '', nextLrc: '' })
    // console.info(`当前歌词，以及下一个歌词：${currentLrc}, ${nextLrc}`)
  timer = setTimeout(function() {
    clearTimeout(timer)
    timer = null
    activeLrcItem(currentLrc, nextLrc)
    playLrc()
  }, (lrcTime2Second(nextLrc) - (+currentStamp)) * 1000 / audio.playbackRate)
}

/**
 * 激活指定歌词 ，在playLrc方法中使用了。
 * @param {当前歌词} currentLrc 
 * @param {目标歌词} nextLrc 
 */
function activeLrcItem(currentLrc, nextLrc) {
  let lrcEl = document.querySelector('.lyric ul')
  let currentEl = lrcEl.querySelector(`[data-stamp='${currentLrc}']`)
  let targetEl = lrcEl.querySelector(`[data-stamp='${nextLrc}']`)
  // 如果选到了DOM，就操作
  currentEl ? currentEl.classList.remove('current') : null
  if (targetEl) {
    targetEl.classList.add('current')
    lrcEl.style.transform = `translateY(${- targetEl.offsetTop + 2 * targetEl.offsetHeight}px)`
  }
}
/**
 * 设置 settimeout 序列，即启动playLrc(). 同时，切换不同速率的情况
 */
function setSettimeoutQueue() {
  console.info('设置settimeout序列')
  clearTimeout(timer), timer = null
  lrcFunc === 'settimeout' ? playLrc() : null
}

/**
 * 辅助函数，根据歌词中的时间戳，返回秒数
 * @param {lrc 歌词中的时间戳} lrcTime 
 */
function lrcTime2Second(lrcTime) {
  let tmp = lrcTime.split(':')
  return 60 * (+tmp[0]) + (+tmp[1])
}