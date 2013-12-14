var fs = require('fs')
var path = require('path')
var pack = require('npmd-pack')
var shasum = require('shasum')
var concat = require('concat-stream')

var getReadme = require('./readme')
var readJSON = require('./read-json')

var prepare = module.exports = function (dir, config, cb) {
  if(!cb) cb = config, config = {}
  var n = 3
  var error, readme, readmeName, package, tarball
  getReadme(dir, function (err, _readme, _readmeFile) {
    error = error || err
    readme = _readme
    readmeFile = _readmeFile
    next()
  })
  readJSON(path.join(dir, 'package.json'), function (err, _package) {
    error = error || err
    package = _package
    next()
  })
  pack(dir)
    .on('error', next)
    .pipe(concat(function (_tarball) {
      tarball = _tarball
      next()
    }))

  function next () {
    if(n < 0) return
    if(error) return n = -1, cb(error)
    if(--n) return

    console.log('tarball?', tarball)
      
    package.readme = readme
    package.readmeFile = readmeFile
    package.dist = {shasum: shasum(tarball)}

    cb(null, package, tarball)
  }
}

if(!module.parent) {
  prepare(process.cwd(), function (err, package, tarball) {
    if(err) throw err
    console.log(package, shasum(tarball))
  })
}
