var gulp       = require("gulp"),
    browserify = require("gulp-browserify");
sass = require("gulp-sass"), //sass编译
  autoprefixer = require("autoprefixer"), //自动处理浏览器前缀
  postcss = require("gulp-postcss"), //postcss
  pxtorem = require("postcss-pxtorem"), //pxtorem
  fileinclude = require("gulp-file-include"), //include
  precompile = require("gulp-handlebars-precompile"), //提取handlebars模板
  del = require("del"), // del
  gulpSequence = require("gulp-sequence"), //同步异步执行代码
  gutil = require("gulp-util"), //util
  inlinesource = require("gulp-inline-source"), //内联
  replace = require("gulp-replace"),
  useref = require("gulp-useref"), //文件合并和替换
  gulpif = require("gulp-if"), //if
  gulpExpectFile = require("gulp-expect-file"),
  gulpFilter = require("gulp-filter"),
  uglify = require("gulp-uglify"), //js压缩
  minifyCss = require("gulp-minify-css"), //css压缩
  // imagemin = require('gulp-imagemin'), //图片压缩
  rev = require("gulp-rev-append-all"), //MD5戳
  eslint = require("gulp-eslint"), //eslint
  gulpBabel = require("gulp-babel"), // babel
  spritesmith = require("gulp.spritesmith"), //sprite
  plumber = require("gulp-plumber"),
  buffer = require("vinyl-buffer"),
  merge = require("merge-stream"),
  cheerio = require("gulp-cheerio"),
  args = require("yargs").argv,
  browserSync = require("browser-sync").create(),
  reload = browserSync.reload,
  config = require("./config.js"),
  vendorJson = require("./vendor.base.json");

var CDNUrl = config.CDNUrl,
    env    = (args.env || args.ENV || "").toLowerCase(); // 部署环境 (dev|qa|prod)

var path = {
  dirs : {
    src  : "./",
    dev  : "../dev/",
    build: "../build/"
  },
  src  : {
    static : "./static/",
    scss   : "./scss/",
    js     : "./js/",
    widget : "./widget/",
    font   : "./font/",
    include: "./include/",
    tpl    : "./tpl/",
    img    : "./img/",
    views  : "./views/"
  },
  dev  : {
    static: "../dev/static/",
    css   : "../dev/css/",
    js    : "../dev/js/",
    widget: "../dev/widget/",
    font  : "../dev/font/",
    img   : "../dev/img/",
    views : "../dev/views/"
  },
  build: {
    static: "../build/static/",
    css   : "../build/css/",
    js    : "../build/js/",
    widget: "../build/widget/",
    font  : "../build/font/",
    img   : "../build/img/",
    views : "../build/views/"
  }
};

/**
 * 开发
 * 1. sass编译
 * 2. 自动处理浏览器前缀
 * 3. pxtorem
 */

gulp.task("dev_sass", function () {

  var processors = [
    autoprefixer({
      browsers: ["last 5 versions"],
      cascade : false
    }),
    pxtorem({
      // 使用 flexible 适配方案时，将屏幕分成 10rem，设置 1rem = 设计稿宽度 / 10
      // https://www.npmjs.com/package/postcss-pxtorem
      // `Px` or `PX` is ignored by `postcss-pxtorem` but still accepted by browsers
      replace      : true,
      rootValue    : config.UIDesignSize / 10,
      minPixelValue: 2, // 小于 2px 不进行转换
      propList     : ["*", "!font-size"], // font-size 不进行转换
    })
  ];

  log("正在编译 scss 文件...");
  return gulp.src(path.src.scss + "*.scss")
             .pipe(sass().on("error", sass.logError))
             .pipe(postcss(processors))
             .pipe(gulp.dest(path.dev.css));

});

/**
 * 开发
 * 清除dev目录
 */

gulp.task("dev_clean", function () {

  return del([path.dirs.dev + "*"], {force: true});

});

/**
 * 开发
 * include
 */
gulp.task("dev_html", function () {

  log("正在编译 html 文件...");
  return gulp.src(path.src.views + "*.html")
             .pipe(fileinclude({
               prefix  : "@@",
               basepath: "@file"
             }))
             .on("error", handleErrors)
             .pipe(precompile({
               reg      : /<!\-\-hbs\s+"([^"]+)"\-\->/g,
               baseSrc  : "src/tpl/",
               dest     : "dev/tpl/",
               scriptSrc: "tpl/",
               inline   : true
             }))
             .pipe(gulp.dest(path.dev.views));

});

/**
 * 开发
 * 初始化dev,移动文件
 */
// 清除 static/js 目录，重新从 bower_components 里更新第三方库
gulp.task("dev_others:clearStaticJs", function () {

  return del([path.dirs.src.static + "js/*"], {force: true});

});

gulp.task("dev_others:bower2static", function () {

  log("正在从 bower_components 里拷贝文件到 static ...");
  var jsFilter = gulpFilter("**/*.js", {restore: true});
  var cssFilter = gulpFilter("**/*.css", {restore: true});
  return gulp.src(vendorJson, {base: "bower_components"})
             .pipe(gulpExpectFile(vendorJson))
             .pipe(jsFilter)
             .pipe(jsFilter.restore)
             .pipe(cssFilter)
             .pipe(cssFilter.restore)
             .pipe(gulp.dest(path.src.static + "js/"));

});

gulp.task("dev_others:static", function () {

  log("正在移动 static 目录文件...");
  return gulp.src(path.src.static + "**/*.*")
             .pipe(gulp.dest(path.dev.static));

});

gulp.task("dev_others:js", function () {

  log("正在移动 js 文件...");
  return gulp.src(path.src.js + "**/*.*")
             .pipe(gulpBabel())
             .pipe(browserify({
               insertGlobals: true,
               debug        : true // TODO: 生产环境为 false
             }))
             .pipe(gulp.dest(path.dev.js));

});

gulp.task("dev_others:widget", function () {

  log("正在移动 widget 文件...");
  return gulp.src(path.src.widget + "**/*.*")
             .pipe(gulp.dest(path.dev.widget));

});

gulp.task("dev_others:font", function () {

  log("正在移动 font 文件...");
  return gulp.src(path.src.font + "*.*")
             .pipe(gulp.dest(path.dev.font));

});

/**
 * 开发
 * imgmin
 */

gulp.task("dev_img", function () {

  log("正在压缩图片...");
  return gulp.src(path.src.img + "**/*.*")
             // .pipe(imagemin())
             .pipe(gulp.dest(path.dev.img));

});

/**
 * 开发
 * eslint
 */

gulp.task("dev_lint", function () {

  return gulp.src(path.src.js + "**/*.js")
             .pipe(eslint())
             .pipe(plumber())
             .pipe(eslint.format())
             .pipe(eslint.failAfterError())
             .on("error", function () {
               log("代码不规范，具体错误请查看终端", "red");
             });

});

/**
 * 开发
 * sprite
 */

gulp.task("dev_sprite", function () {

  // Generate our spritesheet
  var spriteData = gulp.src(path.src.img + "sprite/**/*.*").pipe(spritesmith({
    imgName    : "sprite.png",
    cssName    : "_sprite.scss",
    padding    : 20, // 图标之间的距离
    algorithm  : "binary-tree", // 图标的排序方式
    cssTemplate: "./gulp/sprite/handlebarsInheritance.scss.handlebars" // 模板
  }));

  // Pipe image stream through image optimizer and onto disk
  var imgStream = spriteData.img
                            // DEV: We must buffer our stream into a Buffer for `imagemin`
                            .pipe(buffer())
                            // .pipe(imagemin())
                            .pipe(gulp.dest(path.src.img));

  // Pipe CSS stream through CSS optimizer and onto disk
  var cssStream = spriteData.css
                            .pipe(gulp.dest(path.src.scss + "sprite"));

  // Return a merged stream to handle both `end` events
  return merge(imgStream, cssStream);

});

gulp.task("watch:html", function () {

  gulp.watch(path.src.views + "*.html", ["dev_html"]);

});

gulp.task("watch:include", function () {

  gulp.watch(path.src.include + "**/*.*", ["dev_html"]);

});

gulp.task("watch:tpl", function () {

  gulp.watch(path.src.tpl + "**/*.*", ["dev_html"]);

});

gulp.task("watch:scss", function () {

  gulp.watch(path.src.scss + "**/*.scss", ["dev_sass"]);

});

gulp.task("watch:js", function () {

  gulp.watch(path.src.js + "**/*.js", ["dev_lint"]);

});

gulp.task("watch:sprite", function () {

  gulp.watch(path.src.img + "sprite/**/*.*", ["dev_sprite"]);

});

gulp.task("watch:others", function () {

  gulp.watch([
    path.src.js + "**/*.*",
    path.src.static + "**/*.*",
    path.src.widget + "**/*.*",
    path.src.font + "*.*",
    path.src.img + "**/*.*"
  ], function (event) {

    switch (event.type) {

      case "deleted":

        //之所以删除再移动，是为了防止重命名文件只导致的文件删除的问题
        gutil.log(event.path + " deleted");

        var tmp = event.path.replace(/src/, "dev");
        del([tmp]);

        //获取所在的文件夹名称
        var target = event.path.match(/src[\/|\\](.*?)[\/|\\]/)[1];

        gulp.src(path.dirs.src + target + "/**/*.*")
            .pipe(gulp.dest(path.dirs.dev + target));

        break;

      case "added":

        gutil.log(event.path + " added");

        var target = event.path.match(/src[\/|\\](.*?)[\/|\\]/)[1];

        gulp.src(path.dirs.src + target + "/**/*.*")
            .pipe(gulp.dest(path.dirs.dev + target));

        break;

      case "changed":

        gutil.log(event.path + " changed");

        var target = event.path.match(/src[\/|\\](.*?)[\/|\\]/)[1];

        gulp.src(path.dirs.src + target + "/**/*.*")
            .pipe(gulp.dest(path.dirs.dev + target));

        break;

    }

  });

});

gulp.task("watch:dev", function () {

  gulp.watch(path.dirs.dev + "**/*.*").on("change", reload);

});

var allBuildTaskOnDev = [
      "dev_html",
      "dev_sass",
      "dev_others:bower2static",
      "dev_others:static",
      "dev_others:js",
      "dev_others:widget",
      "dev_others:font",
      "dev_img",
      "dev_sprite"
    ],
    allWatchTaskOnDev = [
      "watch:html",
      "watch:include",
      "watch:scss",
      "watch:others",
      "watch:dev",
      "watch:js",
      "watch:sprite",
      "watch:tpl"
    ];

/**
 * 开发
 * 静态服务器
 */

gulp.task("browser-sync", function () {

  return browserSync.init({
    server: {
      baseDir: path.dirs.dev
    },
    ui    : false
  });

});

gulp.task("default", function () {
  gulpSequence(
    ["dev_clean"],
    allBuildTaskOnDev,
    allWatchTaskOnDev,
    ["browser-sync"],
    function () {
      log("************", "yellow");
      log("* 开发环境(dev 目录)编译完成，可以开始愉快的开发咯(๑•̀ㅂ•́)و✧", "yellow");
      log("************", "yellow");
    }
  );
});

var condition = false;

if (!!config.CDNUrl) {

  var regstr = config.CDNUrl.replace(/(\$|\/)/g, function (str) {
    return "\\" + str;
  });

  var reg = new RegExp(regstr, "g");

  condition = true;

}

/**
 * 生产
 * 内联Css和Js
 * 合并js和css
 */

gulp.task("dist_html", function () {

  return gulp.src(path.dev.views + "*.html")
             // .pipe(replace(reg, ''))
             .pipe(gulpif(condition, replace(reg, "")))
             .pipe(inlinesource())
             .pipe(useref())
             .pipe(gulpif("*.js", uglify()))
             .pipe(gulpif("*.css", minifyCss()))
             .pipe(gulp.dest(path.build.views));

});

gulp.task("dist_html:CDNUrl", function () {

  return gulp.src(path.build.views + "*.html")
             .pipe(gulpif(condition, cheerio({

               run          : function ($, file) {

                 $("link").each(function () {
                   var link = $(this).attr("href");
                   if (link) {
                     $(this).attr("href", link.replace("../", CDNUrl + "/"));
                   }
                 });

                 $("script, img").each(function () {
                   var link = $(this).attr("src");
                   if (link) {
                     $(this).attr("src", link.replace("../", CDNUrl + "/"));
                   }

                 });

               },
               parserOptions: {
                 decodeEntities: false
               }
             })))
             .pipe(gulp.dest(path.build.views));

});

/**
 * 生产
 * 压缩CSS
 */

gulp.task("dist_css", function () {

  log("正在压缩移动 css 文件...");
  return gulp.src(path.dev.css + "**/*.css")
             .pipe(replace("../", CDNUrl))
             .pipe(minifyCss())
             .pipe(gulp.dest(path.build.css));
});

/**
 * 生产
 * 压缩js
 */

gulp.task("dist_js", function () {

  log("正在压缩移动 js 文件...");
  return gulp.src(path.dev.js + "**/*.js")
             .pipe(uglify({
               mangle  : false,//类型：Boolean 默认：true 是否修改变量名
               // mangle: {reserved: ['require' ,'exports' ,'module' ,'$','$super']},//排除混淆关键字
               compress: true,//类型：Boolean 默认：true 是否完全压缩
             }))
             .on("error", function (err) {
               log(err);
             })
             .pipe(gulp.dest(path.build.js));
});

/**
 * 生产
 * 移动static
 */

gulp.task("dist_static", function () {

  log("正在压缩移动 static 目录文件...");
  return gulp.src(path.dev.static + "**/*.*")
             .pipe(gulpif("*.js", uglify()))
             .pipe(gulpif("*.css", minifyCss()))
             .pipe(gulp.dest(path.build.static));
});

/**
 * 生产
 * 移动widget
 */

gulp.task("dist_widget", function () {

  log("正在移动 widget 目录文件...");
  return gulp.src(path.dev.widget + "**/*.*")
             .pipe(gulpif("*.js", uglify()))
             .pipe(gulpif("*.css", minifyCss()))
             .pipe(gulp.dest(path.build.widget));
});

/**
 * 生产
 * 移动font
 */

gulp.task("dist_font", function () {

  log("正在移动 font 文件...");
  return gulp.src(path.dev.font + "**/*.*")
             .pipe(gulp.dest(path.build.font));
});

/**
 * 生产
 * 移动img
 */

gulp.task("dist_img", function () {

  log("正在移动图片文件...");
  return gulp.src(path.dev.img + "**/*.*")
             .pipe(gulp.dest(path.build.img));
});

/**
 * 生产
 * 清除build目录
 */

gulp.task("dist_clean", function () {
  return del([path.dirs.build + "*"], {force: true});
});

/**
 * 生产
 * 添加版本号
 */

gulp.task("dist_rev", function () {
  return gulp.src(path.build.views + "*.html")
             .pipe(rev())
             .pipe(gulp.dest(path.build.views));
});

gulp.task("build", function () {
  gulpSequence(
    ["dev_others:clearStaticJs"],
    ["dev_clean"],
    allBuildTaskOnDev,
    ["dist_clean"],
    ["dist_html", "dist_css", "dist_js", "dist_static", "dist_widget", "dist_font", "dist_img"],
    ["dist_rev"],
    ["dist_html:CDNUrl"],
    function () {
      log("************", "yellow");
      log("* 部署环境(build 目录)编译完成，可以去部署咯🤘🤘🤘", "yellow");
      log("************", "yellow");
    }
  );
});

//build
gulp.task("browser-sync-build", function () {

  browserSync.init({
    server: {
      baseDir: path.dirs.build,
    },
    port  : "4000",
    ui    : false
  });

});


// 错误处理
function handleErrors(err) {
  log(err.toString());
  this.emit("end");
}

// 日志打印
function log(msg, color) {
  gutil.log(gutil.colors[color || "blue"](msg));
}
