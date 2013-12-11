# npm-atomic-publish

publish a module with a single http request.

# how this works.

1. *CHECK_CACHE* check for `~/.npm/{module_name}/.cache.json`,  
   if it's not present, assume it's a fresh publish, else, goto *PUBLISH*  

2. *DEFAULTS* set up the doc for a fresh publish.

3. *PUBLISH* add the tarball inline to the document,  
   and attempt to push to the registry.  
   If you get 2xx goto *DONE*.  
   If there was an error, and second time you have tried to publish, then goto *ABORT*,  
   else if it was the first time you tried goto *UPDATE_CACHE*  

4. *UPDATE_CACHE* do a get request for the module, and update the cache.  
   If this fails with a 404, goto *DEFAULTS* (this will only happen after an unpublish)  
   If it succeeds, goto *PUBLISH*, else goto *ABORT*  

5. *ABORT* post an issue!

6. *DONE* write another module!

# Example

``` js
npm install -g npm-atomic-publish

cd your-module/
npm-atomic-publish
```

## License

MIT
