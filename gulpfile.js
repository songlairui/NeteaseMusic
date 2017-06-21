var gulp = require('gulp')
var browserSync = require('browser-sync')
var reload = browserSync.reload

// 正在工作的目录
var working_target = 'static'

gulp.task('serve', function(){
  browserSync({
    server: {
      baseDir: working_target
    }
  })
 gulp.watch(['*.html', '*.css', '*.js'], {cwd: working_target}, reload)
})
