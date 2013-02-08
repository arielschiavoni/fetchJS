var fetchJS,
    moduleDef;

(function () {
  "use strict";

  var queue = {},
      cache = {},
      path = "js/",
      ext = ".js";

  fetchJS = function (name, cb) {

    var script;
    name = path + name + ext;

    if(cache[name]) {
      cb(cache[name].resolve());
    } else {
      script = document.createElement("script");
      script.setAttribute("src", name);
      script.setAttribute("type", "text/javascript");
      script.onload = function () {
        var module = queue[name],
            dep,
            resolvedDeps = [];

        //check dependencies and if there are all resolved execute callback function for
        //the current module with deps as params. Also store module into cache to avoid
        //reload script in next requests.
        function checkDeps() {
          var resolve = function () {
            return module.fn.apply(this, resolvedDeps);
          };
          //
          if (module.deps.length === resolvedDeps.length) {
            cb(resolve);
            cache[name] = {
              resolve: resolve
            };
            delete queue[name];
          }
        }

        //there are no dependencies so just execute the callback
        if (module.deps.length === 0) {
          if (cb) {
            cb(module.fn);
          }
          cache[name] = {
            resolve: module.fn
          };
          delete queue[name];
        } else {

          //iterate over dependencies and load them as needed.
          for (var i = 0; i < module.deps.length; i += 1) {
            dep = module.deps[i];
            fetchJS(dep, function (d) {
              //store resolved/executed dependencies
              resolvedDeps.push(d());
              //check if all dependencies have been resolved
              checkDeps();
            });
          }

        }

      };

      document.getElementsByTagName("head")[0].appendChild(script);

    }



  };

  moduleDef = function (fn, module, deps) {
    queue[path + module + ext] = {
      fn: fn,
      deps: deps
    };
  };

  //when document is ready it should bootstrapp app.
  document.addEventListener("DOMContentLoaded", function () {

    var scripts = document.getElementsByTagName("script"),
        bootstrap = null;

    for (var i = 0; i < scripts.length; i += 1) {
      bootstrap = scripts[i].getAttribute("data-bootstrap");
      if(bootstrap) {
        break;
      }
    }

    if(bootstrap) {
      fetchJS(bootstrap, function (main) {
        main();
      });
    }

  });


}());
