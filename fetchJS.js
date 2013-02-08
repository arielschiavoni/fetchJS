/*
*** Own implementation to dinamically load JS files and dependencies between modules.
*/

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
            resolvedDeps = {};

        //check dependencies and if there are all resolved execute callback function for
        //the current module with deps as params. Also store module into cache to avoid
        //reload script in next requests.
        function checkDeps() {

          var keys = Object.keys(resolvedDeps),
              orderedDeps = [];

          keys.sort();

          for (var i = 0; i < keys.length; i += 1) {
              orderedDeps.push(resolvedDeps[keys[i]]);
          }

          var resolve = function () {
            //I should ensure dependencies order.
            return module.fn.apply(this, orderedDeps);
          };
          //


          if (module.deps.length === orderedDeps.length) {
            cb(resolve);
            cache[name] = {
              resolve: resolve
            };
            delete queue[name];
          }
        }

        //there are no dependencies so just execute the callback
        if (module.deps === undefined || module.deps.length === 0) {
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
            //clousure position to don't lost the correct order in
            //wich functions should be pased as params.
            (function (pos) {

              fetchJS(dep, function (d) {

                //store resolved/executed dependencies
                resolvedDeps[pos] = typeof d === "object" ? d : d();
                //check if all dependencies have been resolved
                checkDeps();
              });
            }(i));


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
