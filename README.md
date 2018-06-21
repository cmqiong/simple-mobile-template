# simple-mobile-template
> 一套适合简单的移动端页面开发的脚手架，使用 gulp + bower 前端自动化工具，轻便好用！

## gulp 编译
- js 支持 es6 语法，模块化写法
- scss 实时监听编译成 css
- 实时监听刷新页面
- CDN 地址替换
- 图片压缩
- js、css 代码压缩
- 使用 bower 管理第三方插件库
- 文件名添加随机字符串防止前端缓存
- eslint 检查

## 启动项目
环境安装
```
cd src
npm install 或 yarn
npm install bower -g
bower install
```
启动项目
```
npm run dev // 开发环境，根目录下生成 dev 文件夹
npm run build // 部署环境，根目录下生成 build 文件夹
```

## 开发指南
- 全局配置文件 `./src/config.js`
  * UIDesignSize: 配置为设计稿的宽度尺寸，接下来你的 css 就可以使用和设计图一样的尺寸编写啦，单位 px，gulp 会自动转换为 rem。需要注意的是，只有 .css 文件才能自动编译哦，写在 html 文件里的样式是不会自动被编译成 rem 哦。
 
  * env: 在此配置不同环境下的 api 前缀，然后可以在 js 文件里动态切换环境（具体功能待实现）

## TODO
- 改成移动端和 web 端通用
- env api 可配置
- bower 管理的第三方组件库下文件变化操作等可再优化。是否更好的管理方案？