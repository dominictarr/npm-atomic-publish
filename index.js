//FIRST STEP, get atomic posts to couchdb.
//SECOND STEP, get npm format working.

//request a package, to get the current version.

var fs = require('fs')
var path = require('path')
var url = require('url')

var request   = require('request')
var npmClient = require('npm-registry-client')
var shasum    = require('shasum')
var mkdirp    = require('mkdirp')

var readJSON = require('./read-json')


function isSuccess(res) {
  return !(res.statusCode < 200 || res.statusCode >= 300)
}


module.exports = function (package, tarball, config, cb) {

  function saveDoc (data, cb) {
    var dir = path.join(config.cache, data._id)
    mkdirp(dir, function () {
      fs.writeFile(path.join(dir, '.cache.json'), JSON.stringify(data), cb)
    })
  }


  function defaults (package) {
    return { _id : package.name
      , name : package.name
      , description : package.description
      , "dist-tags" : {}
      , versions : {}
      , readme: package.readme || ""
      , maintainers :
        [ { name : config.username
          , email : config.email
          }
        ]
      }
 
  }

  var method = 'PUT', self = this
  if(!cb) cb = config, config = null

  var tbName = package.name + "-" + package.version + ".tgz"
  var tbURI = package.name + "/-/" + tbName

  config = config || {
    cache    : this.conf.get('cache'),
    registry : this.conf.get('registry'),
    _auth     : this.conf.get('_auth'),
    username : this.conf.get('username'),
    email    : this.conf.get('email'),
    _token   : this.conf.get('_token'),
    cert     : this.conf.get('cert'),
    ca       : this.conf.get('ca'),
    key      : this.conf.get('key'),
  }
  //if we have read this before, we should have this in our cache!
  //with the correct _rev and all (unless another maintainer has published)
  //or this is a fresh os install, and we havn't installed our package either.

  readJSON(path.join(config.cache, package.name, '.cache.json'), function (err, data) {
    //if there was no file, assume a new publish
    next(err ? defaults(package) : data)
  })

  function next (data, abortIfFail) {
    if(data.versions[package.version] && !config.force)
      return cb(new Error(package.name + '@' + package.version + ' already exists'))

    var attachments = data._attachments = data._attachments || {}

    attachments[tbName] = {
      content_type: 'application/octet-stream',
      data: tarball.toString('base64')
    }

    package.dist = package.dist || {}
    package.dist.tarball = url.resolve(config.registry, tbURI)
                              .replace(/^https:\/\//, 'http://')
    package.dist.shasum = shasum(tarball)

    data.versions[package.version] = package
    data['dist-tags'].latest = package.version

    // keys matching /^_/ are handled specially by couch,
    // so we have to remove it before sending it to couch.
    delete data._etag

    var pkgUrl = url.resolve(config.registry,
      encodeURIComponent(package.name))

    console.error(method, pkgUrl, package.dist.shasum)

    request({
      method    : method,
      url       : pkgUrl,
      json      : true,
      body      : data,
      headers   : {cookie: 'AuthSession='+config._token.AuthSession},
      ca        : config.ca,
      strictSSL : true
    },
    function (err, res, json) {
      console.error(res && res.statusCode, pkgUrl, package.dist.shasum)
      if(err) return cb(err)
      if(res.statusCode == 409) { // get the current value, and try again.
        //throw new Error('not implemented yet')
        if(abortIfFail)
          return cb(new Error('not attempting to publish twice'))
        console.error('GET', pkgUrl)
        return request({url: pkgUrl, json: true, ca: config.ca, strictSSL: true},
        function (err, res, data) {
          if(err) cb(err)
          console.error(res.statusCode, pkgUrl)
          //if there was a 404, there must have been an unpublish.
          //try again, assuming this.

          if(res.statusCode === 404)
            return next(defaults(package), true)

          if(!isSuccess(res))
            return cb(new Error('get request failed, got:'+res.statusCode + ' ' + res.reason || data && data.reason))

          data._etag = res.etag

          saveDoc(data, function (err) {
            if(err) return cb(err)
            next(data, true)
          })
        })
      }

      if(!isSuccess(res))
        return cb(err, json)

      delete data._attachments[tbName].data
      data._rev = json.rev
      data._etag = res.headers.etag

      saveDoc(data, function (err) {
        if(err) throw err
        console.log(JSON.stringify(json, null, 2))
      })
    })
  }
}

