#! /usr/bin/env node

var atomic = require('./')
var Client = require('npm-registry-client')
var npmconf = require('npmconf')

var prepare = require('./prepare-package')

npmconf.load(function (err, conf) {
  if(err) throw err


//  conf.set('registry', 'http://localhost:5984/registry')

  var client = new Client(conf)
  
  prepare(process.cwd(), function (err, package, tarball) {
    if(err) throw err

    atomic.call(client, package, tarball, function (err, data) {
      if(err) throw err
      console.log(data)
    })
  })
})
