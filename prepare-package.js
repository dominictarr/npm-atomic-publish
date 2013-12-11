var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')

var shasum = require('shasum')

var readme = require('./readme')
var readJSON = require('./read-json')

var prepare = module.exports = function (dir, cb) {
  var n = 3
  var error, readmeSource, readmeFile, package
  readme(dir, function (err, src, file) {
    error = error || err
    readmeSource = src
    readmeFile = file
    next()
  })
  readJSON(path.join(dir, 'package.json'), function (err, pkg) {
    error = error || err
    package = pkg
    next()
  })
  var cp = spawn('npm', ['pack'], {cwd: dir})
  cp.stdout.pipe(process.stdout)
  cp.stderr.pipe(process.stderr)
  cp.on('exit', function (code) {
    if(code) error = new Error('non-zero exit on npm pack:' + code)
    next()
  })

  function next () {
    if(n < 0) return
    if(error) return n = -1, cb(err)
    if(--n) return
    fs.readFile(path.join(dir, package.name + '-' + package.version + '.tgz'),
    function (err, tarball) {
      if(err) return cb(err)
      
      package.readme = readmeSource
      package.readmeFile = readmeFile
      package.dist = {shasum: shasum(tarball)}
      cb(null, package, tarball)
    })
  }
}

if(!module.parent) {
  prepare(process.cwd(), function (err, package, tarball) {
    console.log(package, shasum(tarball))
  })
}
