import webConfig from '../config.js'
var apiUrl = 'http://www.testapi.com'

document.getElementById('copyright').innerHTML = `${webConfig.version} ${webConfig.copyright}`

// $.ajax('${apiUrl}/api/1', function (res) {
//   console.log('${apiUrl}/success')
// })