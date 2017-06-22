# NeteaseMusic
前端仿网易云音乐。

## 使用方法  

```shell  
npm install
gulp serve
```

访问 http://localhost:3000/static/index.html

## 第一，静态页面版前端

[+] 动态REM保持页面元素比例一致。

- 对wrapper设置max-width，并以其为基准，更改rem值。监听window onresize

[x] 高亮显示并移动到正在播放的歌词

- 根据歌词json获取时间信息数组，并创建DOM
- 根据audio的currentTime，判断当前歌词。使用了filter，reverse，逻辑上取时间小于currentTime，距其最近的歌词。  
- 为歌词dom和父元素添加transition，平滑变化样式。
- audio.ontimeupdate 逻辑处理上添加状态对比，减少多余的DOM操作。


## 其他  
一些手机自带浏览器运行不正常。  