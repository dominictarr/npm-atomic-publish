var fs = require('fs')

module.exports = function readme (pkgdir, cb) {
  fs.readdir(pkgdir, function (err, files) {
    var rfile = files.filter(function (file) {
      return /^readme(\.(md|markdown|txt))?$/i.test(file)
    }).sort()[0]
    if (!rfile) cb()
    else fs.readFile(rfile, 'utf8', function (err, src) {
      cb(err, src, rfile)
    })
  })
}

