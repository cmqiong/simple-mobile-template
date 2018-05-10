/**
 * Created by cmq on 2018/5/8
 * 全局配置文件
 */
module.exports = {
   version: "1.0.0", // 版本号
   copyright: "声连网信息科技有限公司", // 版权信息
   UIDesignSize: "750", // 网页 UI 设计图尺寸 750px
   CDNUrl: "http://www.testCDN.com",
   env: {
     dev: {
       baseURL: "http://www.testApi.com"
     },
     qa: {
       baseURL: "http://www.qaApi.com"
     },
     prod: {
       baseURL: "http://www.prodApi.com"
     }
   }
 }