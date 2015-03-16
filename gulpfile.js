//------------------- TheRealMaN_ 19.02.2015 ------------------------

var gulp            = require('gulp'),

    autoprefixer    = require('gulp-autoprefixer'),
    gutil           = require('gulp-util'),
    less            = require('gulp-less'),
    minifyCSS       = require('gulp-minify-css'),
    open            = require('gulp-open'),
    rename          = require('gulp-rename'),
    reporter        = require('gulp-less-reporter'),
    sftp            = require('gulp-sftp'),
    sourcemaps      = require('gulp-sourcemaps'),
    watch           = require('gulp-watch'),
    gzip            = require('gulp-gzip'),
    gunzip          = require('gulp-gunzip'),
    uncss           = require('gulp-uncss'),
    zip             = require('gulp-zip'),

    imagemin        = require('gulp-imagemin'),
    pngquant        = require('imagemin-pngquant'),

    browserSync     = require("browser-sync"),
    del             = require('del'),
    exec            = require('gulp-exec'),
    path            = require('path'),
    runSequence     = require('run-sequence');
  

var domain          = "molgvar.net",
    domains_folder  = "/../../domains",
    project         = "molgvar.net/www/templates/yoo_master2/",
    project_path    = path.join(__dirname, domains_folder, project),

    db_export_user  = "root",
    db_export_pass  = "root",
    db_export_name  = "s2000996_mol",
    db_export_path  = "d:/My documents/downloads/",
    db_export_file  = db_export_path + db_export_name + ".sql",
    
    db_import_remote_link   = "https://shared.alleanza.ru:2222/CMD_FILE_MANAGER/domains/molgvar.com/public_html",
    site_import_remote_link = "https://shared.alleanza.ru:2222/CMD_DB?DOMAIN=molgvar.com",
    
    ftp_host        = "sftp.molgvar.com",
    ftp_port        = "2021",
    ftp_user        = "s2000996",
    ftp_pass        = "",
    ftp_remote_path = "/domains/molgvar.com/public_html/",

    db_import_user  = "root",
    db_import_pass  = "root",
    db_import_name  = "s2001023_amber",
    db_import_file  = "d:/My documents/downloads/" + db_import_name;

    
    
//------- browsersync, process changed LESS files with map, minify ---------

gulp.task('browser-sync', function() {
    
  var files = [
      project_path + 'css/*.css',
      project_path + 'images/*.*',
      project_path + 'js/*.js',
      project_path + 'layouts/*.*'
   ];
   
  browserSync.init(files, {
        proxy: domain
    });
   
});


//---------------- process .LESS files with map, minify -------------------
gulp.task('less', function() {
  
  return gulp.src(project_path + 'css/uikit.less')
    .pipe(sourcemaps.init())
    .pipe(less({
      sourceMapRootpath: './css'
    }))
    .on('error', function (err) {
       gutil.log(err);
       this.emit('end');
    })
    .on('error', reporter)
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(project_path + 'css'))
    .pipe(minifyCSS( {keepBreaks:true} ))
    .pipe(rename( {suffix: '.min'} ))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(project_path + 'css'));
  
});


//------------------- export site, run all tasks  ------------------------
gulp.task('export:all', function(callback) {
  runSequence('export:files', 'export:upload', 'export:db', callback);
});


//------ export zip archive of all site files except 'config.php' -------
gulp.task('export:files', ['export:files.clean'], function () {
  return gulp.src( [

    project_path + '../../**/*',
    '!' + project_path + '../../configuration.php'

    ], {dot: true} )

    .pipe(zip('archive.zip'))
    .pipe(gulp.dest(project_path + '../../'));
});

gulp.task('export:files.clean', function (cb) {
  return del([
    project_path + '../../archive.zip'
  ],{ force: true }, cb);
});

//------ upload to sFTP -------
gulp.task('export:upload', function (cb) {
  return gulp.src( [
    project_path + '../../archive.zip'
    ])
  .pipe(sftp( {
        host: ftp_host,
        port: ftp_port,
        user: ftp_user,
        pass: ftp_pass,
        remotePath: ftp_remote_path
    }))
  .on('error', function (err) {
       gutil.log(err);
       this.emit('end');
    });
});


//--------- export DB from localhost to "downloads" folder --------------
gulp.task('export:db', ['export:db.export'], function () {

  gulp.src(db_export_file)
  .pipe(gzip())
  .pipe(open('', {url: site_import_remote_link}))
  .pipe(open('', {url: db_import_remote_link}))
  .pipe(gulp.dest(db_export_path));
  
})
//---- call mysql msqldum utility ----
gulp.task('export:db.export', function (cb) {
  process.chdir('./mysql components/');

  return gulp.src('./**/**')
    .pipe(exec('mysqldump -u ' + db_export_user + ' -p' + db_export_pass + ' ' + db_export_name + ' > "' + db_export_file + '"'), function(err) {
    cb(err);
  });

})


//------ import gzipped DB from "downloads" folder to localhost DB -------
gulp.task('import:db', ['import:db.unzip'], function (cb) {
  process.chdir('./mysql components/');

  return gulp.src('./**/**')
    .pipe(exec('mysql -u ' + db_import_user + ' -p' + db_import_pass + ' ' + db_import_name + ' < "' + db_import_file + '"'), function(err) {
    cb(err);
  });

})

gulp.task('import:db.unzip', function () {
  return gulp.src(db_import_file + '.gz')
    .pipe(gunzip())
    .pipe(rename( {suffix: '.sql'} ))
    .pipe(gulp.dest('./'))
})


//------------------------- image optimization ------------------------
gulp.task('images', function () {
    return gulp.src(project_path + 'src/images/*/**', {base: project_path + 'src/images/'})
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(project_path + 'src/dist'));
});


//------------------------- uncss optimization ------------------------
gulp.task('uncss', function() {
    return gulp.src(project_path + 'css/uikit.css')
        .pipe(uncss({
            html: [
            'http://molgvar.net',
            'http://molgvar.net/отзывы',
            'http://molgvar.net/наши-клиенты',
            'http://molgvar.net/наши-достижения',
            'http://molgvar.net/контакты',
            'http://molgvar.net/направления/malina-good/'
            ]
        }))
        .pipe(gulp.dest(project_path + 'css/uncss'));
});


//------------------------ default task -------------------------------
gulp.task('default', ['less', 'browser-sync'], function() {
  
  gulp.watch(project_path + 'css/*.less', ['less']);
  
});
