var fs = require('fs')

module.exports = function readJSON(file, cb) {
  fs.readFile(file, 'utf-8', function (err, data) {
    if(err) return cb(err)
    try {
      data = JSON.parse(data)
    } catch (err) { return cb(err) }
    cb(null, data)
  })
}

