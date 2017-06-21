window.addEventListener('resize',function(){
  console.info('resize')
  setHtmlRem()
})
document.addEventListener('DOMContentLoaded',function(){
  setHtmlRem()
})

document.addEventListener('click',function(e){
  if(searchEl('.disc',e.target)){
    togglePlay()
  }
})

function setHtmlRem(){
  // document.documentElement.setAttribute('dpr') = window.devicePixelRatio
  let scale = document.querySelector('#app').clientWidth / 375
  console.info(scale)
  document.documentElement.style.fontSize = `${375 * scale}px`
}
function searchEl(selector,target, pool){
  let el = target
  pool = pool || document.documentElement
  while(!el.matches(selector)){
    if(el === pool){
      el = null 
      break
    }
    el = el.parentNode
  }
  return el
}

function togglePlay(){
  document.querySelector('.disc').classList.toggle('playing')
}