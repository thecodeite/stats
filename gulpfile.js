var gulp = require('gulp')
var nodemon = require('gulp-nodemon')

gulp.task('startServer', function() {
  nodemon({
    script: 'app.js',
    ext: 'html js',
    watch: [ 'server' ],
    env: {
      'NODE_ENV': 'development'
    }
  }).on('restart', function() {
    return console.log('restarted!');
  });

});

gulp.task('default', ['startServer'], function(){
  gulp.watch ['**/*.js']
});
