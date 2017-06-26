// let mp3Url = 'http://118.193.228.119/tmpfile/yezi-live.mp3'
// let mp3Url = './野子 (Live).mp3'
let mp3Url = 'https://og1zqhijc.qnssl.com/tmp/file/yezi-live.mp3'

let lrcFunc = 'settimeout' // 歌词策略方法
let timer = null // settimeout需要使用的timer
let lrc = [] // 存储歌词的数组
let audio = null // 创建audio Element的变量
let activedLrcEl = new Set() // cache for 激活的歌词

window.addEventListener('resize', function() {
  console.info('resize')
    // 节流函数？
  setHtmlRem()
})
document.addEventListener('DOMContentLoaded', function() {
  setHtmlRem() // 设置html的Rem
  loadLrc() // 加载歌词
  loadAudio() // 加载音乐
  setAudioOntimeupdateFunc() // 设置 audio 的ontimeUpdate事件
  setSettimeoutQueue() // 设置setTimeout 序列
})

document.addEventListener('click', function(e) {
  if (searchEl('.disc', e.target)) {
    togglePlay()
  }
  // 选择播放速度
  if (e.target.matches('input[name=playRate]') && audio) {
    // 丧病的使用三元操作符
    audio.playbackRate === e.target.value ? null : (
      audio.playbackRate = e.target.value,
      setSettimeoutQueue() // 切换速度时，更新 延迟序列
    )
  }
  // 更改 lrcFunc 
  if (e.target.matches('input[name=lrcFunc]')) {
    // 丧病的使用三元操作符
    lrcFunc === e.target.value ? null : (
      lrcFunc = e.target.value,
      // 切换歌词策略时，更新ontimeupdate，更新延迟序列
      setAudioOntimeupdateFunc(),
      setSettimeoutQueue()
    )
  }
})

// ========== 主要页面逻辑完 , 下边是具体使用的函数===========//
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
 * 设置audio的ontimeupdate事件
 */
function setAudioOntimeupdateFunc() {
  // 音频播放过程中，跟随进度激活歌词
  // 如果lrcFunc 不是ontimeupdate,则ontimeupdate为null
  audio.ontimeupdate = lrcFunc === 'ontimeupdate' ? function() {
    console.info('playing at: ' + audio.currentTime)
    updateLrc()
  } : null
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
 * 【歌词策略-ontimeupdate】
 *  根据播放时间，激活指定歌词。配合ontimeupdate使用
 */
function updateLrc() {
  let currentStamp = audio.currentTime
    // filter需要的方法做成辅助函数，使用省略大括号的形式，代码变得太简洁了
    // 此处 负向获取，因为要立即设为激活状态，所以需要取的是最后一个正在播放的歌词
  let lastLrcArr = lrc.filter(v => v[0])
    .reverse()
    .filter(v => lrcTime2Second(v[0]) < currentStamp)[0]

  if (lastLrcArr) {
    activeLrcItem(lastLrcArr[0])
  }
}
/**
 * 【歌词策略-迭代】
 *  迭代进行播放歌词，配合 settimeoutQueue 方式使用
 */
function playLrc() {
  if (audio.paused) {
    console.info('歌曲是暂停状态，清空定时器，并return')
    clearTimeout(timer)
    timer = null
    return
  }
  if (timer) return
  let currentStamp = audio.currentTime

  // 获取当前激活的歌词，和下一个要激活的歌词， 此处正向获取。因为下一个歌词还没有播放，等待setTimeout延迟激活，
  let nextLrc = lrc.filter(v => v[0]).filter(v => {
    let tmp = v[0].split(':')
      // 修复计算错误，添加括号，优先进行隐式类型转换
    let stamp = +tmp[0] * 60 + (+tmp[1])
    return stamp > currentStamp
  })[0][0]
  console.info(`下一歌词时间： ${nextLrc}`)
  timer = setTimeout(function() {
    clearTimeout(timer)
    timer = null
    activeLrcItem(nextLrc)
    playLrc()
  }, (lrcTime2Second(nextLrc) - (+currentStamp)) * 1000 / audio.playbackRate)
}

/**
 * 【bit操作】激活指定歌词 ，在playLrc, updateLrc 方法中使用了。
 * @param {目标歌词的时间} targetLrc 
 */
function activeLrcItem(targetLrcTime) {
  let lrcEl = document.querySelector('.lyric ul')
  let target = lrcEl.querySelector(`[data-stamp='${targetLrcTime}']`)

  // 当能获取到target，并且处于正在激活状态的dom元素中不包含target时，才进行更改dom的操作  
  // onTimeUpdate 时间频次较高，做这样的处理，能够避免过多的dom操作。
  if (target && !activedLrcEl.has(target)) {
    activedLrcEl.forEach(el => {
      el.classList.remove('current')
      activedLrcEl.delete(el)
    })
    target.classList.add('current')
    activedLrcEl.add(target)
    // 令激活的歌词，位于第三行位置
    lrcEl.style.transform = `translateY(${- target.offsetTop + 2 * target.offsetHeight}px)`
  }
}

/**
 * 【按钮】切换播放状态
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
 * 【辅助函数】用于事件委托
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
 * 【辅助函数】根据歌词中的时间戳，返回秒数
 * @param {lrc 歌词中的时间戳} lrcTime 
 */
function lrcTime2Second(lrcTime) {
  let tmp = lrcTime.split(':')
    // 修复计算错误，添加括号，优先进行隐式类型转换
  return 60 * (+tmp[0]) + (+tmp[1])
}



// 使用reduce的方法，获得当前的歌词和下一句歌词。 使用混存变量，不需要使用这个方法了
// 写的时候挺费脑子的，不舍得删，注释掉吧。
// let { currentLrc, nextLrc } = lrc.filter(v => v[0]).reduce((prev, current) => {
//   // 如果传入的值有了nextLrc，说明取到了想要的值
//   // console.info(`reduce 得到的上一个的返回值：${JSON.stringify(prev)}`)
//   let { currentLrc, nextLrc } = prev
//   if (nextLrc) return prev

//   return lrcTime2Second(current[0]) > currentStamp ? { currentLrc, nextLrc: current[0] } : { currentLrc: current[0], nextLrc: '' }
// }, { currentLrc: '', nextLrc: '' })