# npm-atomic-publish

publish a module with a single http request.

in recent npm versions npm also uses an atomic publish,
pretty much just like this, but not exactly.

# how this works.

1. *CHECK_CACHE* check for `~/.npm/{module_name}/.cache.json`,  
   if it's not present, assume it's a new module and goto *DEFAULTS*, else, goto *PUBLISH*  

2. *DEFAULTS* set up the doc for a fresh publish. goto *PUBLISH*

3. *PUBLISH* add the tarball inline to the document,  
   and attempt to push to the registry.  
   If you get 2xx goto *DONE*.  
   If there was an error, and this was the first time you tried goto *UPDATE_CACHE*,  
   else it's the second time you have tried to publish, then goto *ABORT*.

4. *UPDATE_CACHE* do a get request for the module, and update the cache.  
   If this fails with a 404, goto *DEFAULTS* (this will only happen after an unpublish)  
   If it succeeds, goto *PUBLISH*, else goto *ABORT*  

5. *ABORT* post an issue!

6. *DONE* write another module!

# Usage

``` js
npm install -g npm-atomic-publish

cd your-module/
npm-atomic-publish
```

## License

MIT
