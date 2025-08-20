/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			var execOptions = { id: moduleId, module: module, factory: __webpack_modules__[moduleId], require: __webpack_require__ };
/******/ 			__webpack_require__.i.forEach(function(handler) { handler(execOptions); });
/******/ 			module = execOptions.module;
/******/ 			execOptions.factory.call(module.exports, module, module.exports, execOptions.require);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/******/ 	// expose the module execution interceptor
/******/ 	__webpack_require__.i = [];
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript update chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference all chunks
/******/ 		__webpack_require__.hu = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "static/webpack/" + chunkId + "." + __webpack_require__.h() + ".hot-update.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get update manifest filename */
/******/ 	(() => {
/******/ 		__webpack_require__.hmrF = () => ("static/webpack/" + __webpack_require__.h() + ".webpack.hot-update.json");
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/getFullHash */
/******/ 	(() => {
/******/ 		__webpack_require__.h = () => ("bdd73c4b415f5f2c")
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "_N_E:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = __webpack_require__.tu(url);
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/runtimeId */
/******/ 	(() => {
/******/ 		__webpack_require__.j = "webpack";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	(() => {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = () => {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScript: (script) => (script),
/******/ 					createScriptURL: (url) => (url)
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script */
/******/ 	(() => {
/******/ 		__webpack_require__.ts = (script) => (__webpack_require__.tt().createScript(script));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script url */
/******/ 	(() => {
/******/ 		__webpack_require__.tu = (url) => (__webpack_require__.tt().createScriptURL(url));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hot module replacement */
/******/ 	(() => {
/******/ 		    var currentModuleData = {}, installedModules = __webpack_require__.c, currentChildModule, currentParents = [], registeredStatusHandlers = [], currentStatus = "idle", blockingPromises = 0, blockingPromisesWaiting = [], currentUpdateApplyHandlers, queuedInvalidatedModules;
/******/ 		    __webpack_require__.hmrD = currentModuleData;
/******/ 		    __webpack_require__.i.push(function(options) {
/******/ 		      var module = options.module, require = createRequire(options.require, options.id);
/******/ 		      module.hot = createModuleHotObject(options.id, module);
/******/ 		      module.parents = currentParents;
/******/ 		      module.children = [];
/******/ 		      currentParents = [];
/******/ 		      options.require = require;
/******/ 		    });
/******/ 		    __webpack_require__.hmrC = {};
/******/ 		    __webpack_require__.hmrI = {};
/******/ 		    function createRequire(require, moduleId) {
/******/ 		      var me = installedModules[moduleId];
/******/ 		      if (!me)
/******/ 		        return require;
/******/ 		      var fn = function(request) {
/******/ 		        if (me.hot.active) {
/******/ 		          if (installedModules[request]) {
/******/ 		            var parents = installedModules[request].parents;
/******/ 		            if (parents.indexOf(moduleId) === -1)
/******/ 		              parents.push(moduleId);
/******/ 		          } else {
/******/ 		            currentParents = [moduleId];
/******/ 		            currentChildModule = request;
/******/ 		          }
/******/ 		          if (me.children.indexOf(request) === -1)
/******/ 		            me.children.push(request);
/******/ 		        } else {
/******/ 		          console.warn("[HMR] unexpected require(" + request + ") from disposed module " + moduleId);
/******/ 		          currentParents = [];
/******/ 		        }
/******/ 		        return require(request);
/******/ 		      }, createPropertyDescriptor = function(name) {
/******/ 		        return {
/******/ 		          configurable: !0,
/******/ 		          enumerable: !0,
/******/ 		          get: function() {
/******/ 		            return require[name];
/******/ 		          },
/******/ 		          set: function(value) {
/******/ 		            require[name] = value;
/******/ 		          }
/******/ 		        };
/******/ 		      };
/******/ 		      for (var name in require)
/******/ 		        if (Object.prototype.hasOwnProperty.call(require, name) && name !== "e")
/******/ 		          Object.defineProperty(fn, name, createPropertyDescriptor(name));
/******/ 		      fn.e = function(chunkId, fetchPriority) {
/******/ 		        return trackBlockingPromise(require.e(chunkId, fetchPriority));
/******/ 		      };
/******/ 		      return fn;
/******/ 		    }
/******/ 		    function createModuleHotObject(moduleId, me) {
/******/ 		      var _main = currentChildModule !== moduleId, hot = {
/******/ 		        _acceptedDependencies: {},
/******/ 		        _acceptedErrorHandlers: {},
/******/ 		        _declinedDependencies: {},
/******/ 		        _selfAccepted: !1,
/******/ 		        _selfDeclined: !1,
/******/ 		        _selfInvalidated: !1,
/******/ 		        _disposeHandlers: [],
/******/ 		        _main,
/******/ 		        _requireSelf: function() {
/******/ 		          currentParents = me.parents.slice();
/******/ 		          currentChildModule = _main ? void 0 : moduleId;
/******/ 		          __webpack_require__(moduleId);
/******/ 		        },
/******/ 		        active: !0,
/******/ 		        accept: function(dep, callback, errorHandler) {
/******/ 		          if (dep === void 0)
/******/ 		            hot._selfAccepted = !0;
/******/ 		          else if (typeof dep === "function")
/******/ 		            hot._selfAccepted = dep;
/******/ 		          else if (typeof dep === "object" && dep !== null)
/******/ 		            for (var i = 0;i < dep.length; i++) {
/******/ 		              hot._acceptedDependencies[dep[i]] = callback || function() {};
/******/ 		              hot._acceptedErrorHandlers[dep[i]] = errorHandler;
/******/ 		            }
/******/ 		          else {
/******/ 		            hot._acceptedDependencies[dep] = callback || function() {};
/******/ 		            hot._acceptedErrorHandlers[dep] = errorHandler;
/******/ 		          }
/******/ 		        },
/******/ 		        decline: function(dep) {
/******/ 		          if (dep === void 0)
/******/ 		            hot._selfDeclined = !0;
/******/ 		          else if (typeof dep === "object" && dep !== null)
/******/ 		            for (var i = 0;i < dep.length; i++)
/******/ 		              hot._declinedDependencies[dep[i]] = !0;
/******/ 		          else
/******/ 		            hot._declinedDependencies[dep] = !0;
/******/ 		        },
/******/ 		        dispose: function(callback) {
/******/ 		          hot._disposeHandlers.push(callback);
/******/ 		        },
/******/ 		        addDisposeHandler: function(callback) {
/******/ 		          hot._disposeHandlers.push(callback);
/******/ 		        },
/******/ 		        removeDisposeHandler: function(callback) {
/******/ 		          var idx = hot._disposeHandlers.indexOf(callback);
/******/ 		          if (idx >= 0)
/******/ 		            hot._disposeHandlers.splice(idx, 1);
/******/ 		        },
/******/ 		        invalidate: function() {
/******/ 		          this._selfInvalidated = !0;
/******/ 		          switch (currentStatus) {
/******/ 		            case "idle":
/******/ 		              currentUpdateApplyHandlers = [];
/******/ 		              Object.keys(__webpack_require__.hmrI).forEach(function(key) {
/******/ 		                __webpack_require__.hmrI[key](moduleId, currentUpdateApplyHandlers);
/******/ 		              });
/******/ 		              setStatus("ready");
/******/ 		              break;
/******/ 		            case "ready":
/******/ 		              Object.keys(__webpack_require__.hmrI).forEach(function(key) {
/******/ 		                __webpack_require__.hmrI[key](moduleId, currentUpdateApplyHandlers);
/******/ 		              });
/******/ 		              break;
/******/ 		            case "prepare":
/******/ 		            case "check":
/******/ 		            case "dispose":
/******/ 		            case "apply":
/******/ 		              (queuedInvalidatedModules = queuedInvalidatedModules || []).push(moduleId);
/******/ 		              break;
/******/ 		            default:
/******/ 		              break;
/******/ 		          }
/******/ 		        },
/******/ 		        check: hotCheck,
/******/ 		        apply: hotApply,
/******/ 		        status: function(l) {
/******/ 		          if (!l)
/******/ 		            return currentStatus;
/******/ 		          registeredStatusHandlers.push(l);
/******/ 		        },
/******/ 		        addStatusHandler: function(l) {
/******/ 		          registeredStatusHandlers.push(l);
/******/ 		        },
/******/ 		        removeStatusHandler: function(l) {
/******/ 		          var idx = registeredStatusHandlers.indexOf(l);
/******/ 		          if (idx >= 0)
/******/ 		            registeredStatusHandlers.splice(idx, 1);
/******/ 		        },
/******/ 		        data: currentModuleData[moduleId]
/******/ 		      };
/******/ 		      currentChildModule = void 0;
/******/ 		      return hot;
/******/ 		    }
/******/ 		    function setStatus(newStatus) {
/******/ 		      currentStatus = newStatus;
/******/ 		      var results = [];
/******/ 		      for (var i = 0;i < registeredStatusHandlers.length; i++)
/******/ 		        results[i] = registeredStatusHandlers[i].call(null, newStatus);
/******/ 		      return Promise.all(results).then(function() {});
/******/ 		    }
/******/ 		    function unblock() {
/******/ 		      if (--blockingPromises === 0)
/******/ 		        setStatus("ready").then(function() {
/******/ 		          if (blockingPromises === 0) {
/******/ 		            var list = blockingPromisesWaiting;
/******/ 		            blockingPromisesWaiting = [];
/******/ 		            for (var i = 0;i < list.length; i++)
/******/ 		              list[i]();
/******/ 		          }
/******/ 		        });
/******/ 		    }
/******/ 		    function trackBlockingPromise(promise) {
/******/ 		      switch (currentStatus) {
/******/ 		        case "ready":
/******/ 		          setStatus("prepare");
/******/ 		        case "prepare":
/******/ 		          blockingPromises++;
/******/ 		          promise.then(unblock, unblock);
/******/ 		          return promise;
/******/ 		        default:
/******/ 		          return promise;
/******/ 		      }
/******/ 		    }
/******/ 		    function waitForBlockingPromises(fn) {
/******/ 		      if (blockingPromises === 0)
/******/ 		        return fn();
/******/ 		      return new Promise(function(resolve) {
/******/ 		        blockingPromisesWaiting.push(function() {
/******/ 		          resolve(fn());
/******/ 		        });
/******/ 		      });
/******/ 		    }
/******/ 		    function hotCheck(applyOnUpdate) {
/******/ 		      if (currentStatus !== "idle")
/******/ 		        throw new Error("check() is only allowed in idle status");
/******/ 		      return setStatus("check").then(__webpack_require__.hmrM).then(function(update) {
/******/ 		        if (!update)
/******/ 		          return setStatus(applyInvalidatedModules() ? "ready" : "idle").then(function() {
/******/ 		            return null;
/******/ 		          });
/******/ 		        return setStatus("prepare").then(function() {
/******/ 		          var updatedModules = [];
/******/ 		          currentUpdateApplyHandlers = [];
/******/ 		          return Promise.all(Object.keys(__webpack_require__.hmrC).reduce(function(promises, key) {
/******/ 		            __webpack_require__.hmrC[key](update.c, update.r, update.m, promises, currentUpdateApplyHandlers, updatedModules);
/******/ 		            return promises;
/******/ 		          }, [])).then(function() {
/******/ 		            return waitForBlockingPromises(function() {
/******/ 		              if (applyOnUpdate)
/******/ 		                return internalApply(applyOnUpdate);
/******/ 		              return setStatus("ready").then(function() {
/******/ 		                return updatedModules;
/******/ 		              });
/******/ 		            });
/******/ 		          });
/******/ 		        });
/******/ 		      });
/******/ 		    }
/******/ 		    function hotApply(options) {
/******/ 		      if (currentStatus !== "ready")
/******/ 		        return Promise.resolve().then(function() {
/******/ 		          throw new Error("apply() is only allowed in ready status (state: " + currentStatus + ")");
/******/ 		        });
/******/ 		      return internalApply(options);
/******/ 		    }
/******/ 		    function internalApply(options) {
/******/ 		      options = options || {};
/******/ 		      applyInvalidatedModules();
/******/ 		      var results = currentUpdateApplyHandlers.map(function(handler) {
/******/ 		        return handler(options);
/******/ 		      });
/******/ 		      currentUpdateApplyHandlers = void 0;
/******/ 		      var errors = results.map(function(r) {
/******/ 		        return r.error;
/******/ 		      }).filter(Boolean);
/******/ 		      if (errors.length > 0)
/******/ 		        return setStatus("abort").then(function() {
/******/ 		          throw errors[0];
/******/ 		        });
/******/ 		      var disposePromise = setStatus("dispose");
/******/ 		      results.forEach(function(result) {
/******/ 		        if (result.dispose)
/******/ 		          result.dispose();
/******/ 		      });
/******/ 		      var applyPromise = setStatus("apply"), error, reportError = function(err) {
/******/ 		        if (!error)
/******/ 		          error = err;
/******/ 		      }, outdatedModules = [];
/******/ 		      results.forEach(function(result) {
/******/ 		        if (result.apply) {
/******/ 		          var modules = result.apply(reportError);
/******/ 		          if (modules)
/******/ 		            for (var i = 0;i < modules.length; i++)
/******/ 		              outdatedModules.push(modules[i]);
/******/ 		        }
/******/ 		      });
/******/ 		      return Promise.all([disposePromise, applyPromise]).then(function() {
/******/ 		        if (error)
/******/ 		          return setStatus("fail").then(function() {
/******/ 		            throw error;
/******/ 		          });
/******/ 		        if (queuedInvalidatedModules)
/******/ 		          return internalApply(options).then(function(list) {
/******/ 		            outdatedModules.forEach(function(moduleId) {
/******/ 		              if (list.indexOf(moduleId) < 0)
/******/ 		                list.push(moduleId);
/******/ 		            });
/******/ 		            return list;
/******/ 		          });
/******/ 		        return setStatus("idle").then(function() {
/******/ 		          return outdatedModules;
/******/ 		        });
/******/ 		      });
/******/ 		    }
/******/ 		    function applyInvalidatedModules() {
/******/ 		      if (queuedInvalidatedModules) {
/******/ 		        if (!currentUpdateApplyHandlers)
/******/ 		          currentUpdateApplyHandlers = [];
/******/ 		        Object.keys(__webpack_require__.hmrI).forEach(function(key) {
/******/ 		          queuedInvalidatedModules.forEach(function(moduleId) {
/******/ 		            __webpack_require__.hmrI[key](moduleId, currentUpdateApplyHandlers);
/******/ 		          });
/******/ 		        });
/******/ 		        queuedInvalidatedModules = void 0;
/******/ 		        return !0;
/******/ 		      }
/******/ 		    }
/******/ 		  
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "/_next/";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/react refresh */
/******/ 	(() => {
/******/ 		if (__webpack_require__.i) {
/******/ 		__webpack_require__.i.push((options) => {
/******/ 			const originalFactory = options.factory;
/******/ 			options.factory = (moduleObject, moduleExports, webpackRequire) => {
/******/ 				const hasRefresh = typeof self !== "undefined" && !!self.$RefreshInterceptModuleExecution$;
/******/ 				const cleanup = hasRefresh ? self.$RefreshInterceptModuleExecution$(moduleObject.id) : () => {};
/******/ 				try {
/******/ 					originalFactory.call(this, moduleObject, moduleExports, webpackRequire);
/******/ 				} finally {
/******/ 					cleanup();
/******/ 				}
/******/ 			}
/******/ 		})
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	
/******/ 	// noop fns to prevent runtime errors during initialization
/******/ 	if (typeof self !== "undefined") {
/******/ 		self.$RefreshReg$ = function () {};
/******/ 		self.$RefreshSig$ = function () {
/******/ 			return function (type) {
/******/ 				return type;
/******/ 			};
/******/ 		};
/******/ 	}
/******/ 	
/******/ 	/* webpack/runtime/css loading */
/******/ 	(() => {
/******/ 		var createStylesheet = (chunkId, fullhref, resolve, reject) => {
/******/ 			var linkTag = document.createElement("link");
/******/ 		
/******/ 			linkTag.rel = "stylesheet";
/******/ 			linkTag.type = "text/css";
/******/ 			var onLinkComplete = (event) => {
/******/ 				// avoid mem leaks.
/******/ 				linkTag.onerror = linkTag.onload = null;
/******/ 				if (event.type === 'load') {
/******/ 					resolve();
/******/ 				} else {
/******/ 					var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 					var realHref = event && event.target && event.target.href || fullhref;
/******/ 					var err = new Error("Loading CSS chunk " + chunkId + " failed.\n(" + realHref + ")");
/******/ 					err.code = "CSS_CHUNK_LOAD_FAILED";
/******/ 					err.type = errorType;
/******/ 					err.request = realHref;
/******/ 					linkTag.parentNode.removeChild(linkTag)
/******/ 					reject(err);
/******/ 				}
/******/ 			}
/******/ 			linkTag.onerror = linkTag.onload = onLinkComplete;
/******/ 			linkTag.href = fullhref;
/******/ 		
/******/ 			(function(linkTag) {
/******/ 			          if (typeof _N_E_STYLE_LOAD === "function") {
/******/ 			            const { href, onload, onerror } = linkTag;
/******/ 			            _N_E_STYLE_LOAD(href.indexOf(window.location.origin) === 0 ? new URL(href).pathname : href).then(() => onload == null ? void 0 : onload.call(linkTag, {
/******/ 			              type: "load"
/******/ 			            }), () => onerror == null ? void 0 : onerror.call(linkTag, {}));
/******/ 			          } else
/******/ 			            document.head.appendChild(linkTag);
/******/ 			        })(linkTag)
/******/ 			return linkTag;
/******/ 		};
/******/ 		var findStylesheet = (href, fullhref) => {
/******/ 			var existingLinkTags = document.getElementsByTagName("link");
/******/ 			for(var i = 0; i < existingLinkTags.length; i++) {
/******/ 				var tag = existingLinkTags[i];
/******/ 				var dataHref = tag.getAttribute("data-href") || tag.getAttribute("href");
/******/ 				if(tag.rel === "stylesheet" && (dataHref === href || dataHref === fullhref)) return tag;
/******/ 			}
/******/ 			var existingStyleTags = document.getElementsByTagName("style");
/******/ 			for(var i = 0; i < existingStyleTags.length; i++) {
/******/ 				var tag = existingStyleTags[i];
/******/ 				var dataHref = tag.getAttribute("data-href");
/******/ 				if(dataHref === href || dataHref === fullhref) return tag;
/******/ 			}
/******/ 		};
/******/ 		var loadStylesheet = (chunkId) => {
/******/ 			return new Promise((resolve, reject) => {
/******/ 				var href = __webpack_require__.miniCssF(chunkId);
/******/ 				var fullhref = __webpack_require__.p + href;
/******/ 				if(findStylesheet(href, fullhref)) return resolve();
/******/ 				createStylesheet(chunkId, fullhref, resolve, reject);
/******/ 			});
/******/ 		}
/******/ 		// no chunk loading
/******/ 		
/******/ 		var oldTags = [];
/******/ 		var newTags = [];
/******/ 		var applyHandler = (options) => {
/******/ 			return { dispose: () => {
/******/ 				for(var i = 0; i < oldTags.length; i++) {
/******/ 					var oldTag = oldTags[i];
/******/ 					if(oldTag.parentNode) oldTag.parentNode.removeChild(oldTag);
/******/ 				}
/******/ 				oldTags.length = 0;
/******/ 			}, apply: () => {
/******/ 				for(var i = 0; i < newTags.length; i++) newTags[i].rel = "stylesheet";
/******/ 				newTags.length = 0;
/******/ 			} };
/******/ 		}
/******/ 		__webpack_require__.hmrC.miniCss = (chunkIds, removedChunks, removedModules, promises, applyHandlers, updatedModulesList) => {
/******/ 			applyHandlers.push(applyHandler);
/******/ 			chunkIds.forEach((chunkId) => {
/******/ 				var href = __webpack_require__.miniCssF(chunkId);
/******/ 				var fullhref = __webpack_require__.p + href;
/******/ 				var oldTag = findStylesheet(href, fullhref);
/******/ 				if(!oldTag) return;
/******/ 				promises.push(new Promise((resolve, reject) => {
/******/ 					var tag = createStylesheet(chunkId, fullhref, () => {
/******/ 						tag.as = "style";
/******/ 						tag.rel = "preload";
/******/ 						resolve();
/******/ 					}, reject);
/******/ 					oldTags.push(oldTag);
/******/ 					newTags.push(tag);
/******/ 				}));
/******/ 			});
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = __webpack_require__.hmrS_jsonp = __webpack_require__.hmrS_jsonp || {
/******/ 			"webpack": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if("webpack" != chunkId) {
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		var currentUpdatedModulesList;
/******/ 		var waitingUpdateResolves = {};
/******/ 		function loadUpdateChunk(chunkId, updatedModulesList) {
/******/ 			currentUpdatedModulesList = updatedModulesList;
/******/ 			return new Promise((resolve, reject) => {
/******/ 				waitingUpdateResolves[chunkId] = resolve;
/******/ 				// start update chunk loading
/******/ 				var url = __webpack_require__.p + __webpack_require__.hu(chunkId);
/******/ 				// create error before stack unwound to get useful stacktrace later
/******/ 				var error = new Error();
/******/ 				var loadingEnded = (event) => {
/******/ 					if(waitingUpdateResolves[chunkId]) {
/******/ 						waitingUpdateResolves[chunkId] = undefined
/******/ 						var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 						var realSrc = event && event.target && event.target.src;
/******/ 						error.message = 'Loading hot update chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 						error.name = 'ChunkLoadError';
/******/ 						error.type = errorType;
/******/ 						error.request = realSrc;
/******/ 						reject(error);
/******/ 					}
/******/ 				};
/******/ 				__webpack_require__.l(url, loadingEnded);
/******/ 			});
/******/ 		}
/******/ 		
/******/ 		self["webpackHotUpdate_N_E"] = (chunkId, moreModules, runtime) => {
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					currentUpdate[moduleId] = moreModules[moduleId];
/******/ 					if(currentUpdatedModulesList) currentUpdatedModulesList.push(moduleId);
/******/ 				}
/******/ 			}
/******/ 			if(runtime) currentUpdateRuntime.push(runtime);
/******/ 			if(waitingUpdateResolves[chunkId]) {
/******/ 				waitingUpdateResolves[chunkId]();
/******/ 				waitingUpdateResolves[chunkId] = undefined;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		    var currentUpdateChunks, currentUpdate, currentUpdateRemovedChunks, currentUpdateRuntime;
/******/ 		    function applyHandler(options) {
/******/ 		      if (__webpack_require__.f)
/******/ 		        delete __webpack_require__.f.jsonpHmr;
/******/ 		      currentUpdateChunks = void 0;
/******/ 		      function getAffectedModuleEffects(updateModuleId) {
/******/ 		        var outdatedModules = [updateModuleId], outdatedDependencies = {}, queue = outdatedModules.map(function(id) {
/******/ 		          return {
/******/ 		            chain: [id],
/******/ 		            id
/******/ 		          };
/******/ 		        });
/******/ 		        while (queue.length > 0) {
/******/ 		          var queueItem = queue.pop(), moduleId = queueItem.id, chain = queueItem.chain, module = __webpack_require__.c[moduleId];
/******/ 		          if (!module || module.hot._selfAccepted && !module.hot._selfInvalidated)
/******/ 		            continue;
/******/ 		          if (module.hot._selfDeclined)
/******/ 		            return {
/******/ 		              type: "self-declined",
/******/ 		              chain,
/******/ 		              moduleId
/******/ 		            };
/******/ 		          if (module.hot._main)
/******/ 		            return {
/******/ 		              type: "unaccepted",
/******/ 		              chain,
/******/ 		              moduleId
/******/ 		            };
/******/ 		          for (var i = 0;i < module.parents.length; i++) {
/******/ 		            var parentId = module.parents[i], parent = __webpack_require__.c[parentId];
/******/ 		            if (!parent)
/******/ 		              continue;
/******/ 		            if (parent.hot._declinedDependencies[moduleId])
/******/ 		              return {
/******/ 		                type: "declined",
/******/ 		                chain: chain.concat([parentId]),
/******/ 		                moduleId,
/******/ 		                parentId
/******/ 		              };
/******/ 		            if (outdatedModules.indexOf(parentId) !== -1)
/******/ 		              continue;
/******/ 		            if (parent.hot._acceptedDependencies[moduleId]) {
/******/ 		              if (!outdatedDependencies[parentId])
/******/ 		                outdatedDependencies[parentId] = [];
/******/ 		              addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 		              continue;
/******/ 		            }
/******/ 		            delete outdatedDependencies[parentId];
/******/ 		            outdatedModules.push(parentId);
/******/ 		            queue.push({
/******/ 		              chain: chain.concat([parentId]),
/******/ 		              id: parentId
/******/ 		            });
/******/ 		          }
/******/ 		        }
/******/ 		        return {
/******/ 		          type: "accepted",
/******/ 		          moduleId: updateModuleId,
/******/ 		          outdatedModules,
/******/ 		          outdatedDependencies
/******/ 		        };
/******/ 		      }
/******/ 		      function addAllToSet(a, b) {
/******/ 		        for (var i = 0;i < b.length; i++) {
/******/ 		          var item = b[i];
/******/ 		          if (a.indexOf(item) === -1)
/******/ 		            a.push(item);
/******/ 		        }
/******/ 		      }
/******/ 		      var outdatedDependencies = {}, outdatedModules = [], appliedUpdate = {}, warnUnexpectedRequire = function warnUnexpectedRequire(module) {
/******/ 		        console.warn("[HMR] unexpected require(" + module.id + ") to disposed module");
/******/ 		      };
/******/ 		      for (var moduleId in currentUpdate)
/******/ 		        if (__webpack_require__.o(currentUpdate, moduleId)) {
/******/ 		          var newModuleFactory = currentUpdate[moduleId], result = newModuleFactory ? getAffectedModuleEffects(moduleId) : {
/******/ 		            type: "disposed",
/******/ 		            moduleId
/******/ 		          }, abortError = !1, doApply = !1, doDispose = !1, chainInfo = "";
/******/ 		          if (result.chain)
/******/ 		            chainInfo = `
/******/ 		Update propagation: ` + result.chain.join(" -> ");
/******/ 		          switch (result.type) {
/******/ 		            case "self-declined":
/******/ 		              if (options.onDeclined)
/******/ 		                options.onDeclined(result);
/******/ 		              if (!options.ignoreDeclined)
/******/ 		                abortError = new Error("Aborted because of self decline: " + result.moduleId + chainInfo);
/******/ 		              break;
/******/ 		            case "declined":
/******/ 		              if (options.onDeclined)
/******/ 		                options.onDeclined(result);
/******/ 		              if (!options.ignoreDeclined)
/******/ 		                abortError = new Error("Aborted because of declined dependency: " + result.moduleId + " in " + result.parentId + chainInfo);
/******/ 		              break;
/******/ 		            case "unaccepted":
/******/ 		              if (options.onUnaccepted)
/******/ 		                options.onUnaccepted(result);
/******/ 		              if (!options.ignoreUnaccepted)
/******/ 		                abortError = new Error("Aborted because " + moduleId + " is not accepted" + chainInfo);
/******/ 		              break;
/******/ 		            case "accepted":
/******/ 		              if (options.onAccepted)
/******/ 		                options.onAccepted(result);
/******/ 		              doApply = !0;
/******/ 		              break;
/******/ 		            case "disposed":
/******/ 		              if (options.onDisposed)
/******/ 		                options.onDisposed(result);
/******/ 		              doDispose = !0;
/******/ 		              break;
/******/ 		            default:
/******/ 		              throw new Error("Unexception type " + result.type);
/******/ 		          }
/******/ 		          if (abortError)
/******/ 		            return {
/******/ 		              error: abortError
/******/ 		            };
/******/ 		          if (doApply) {
/******/ 		            appliedUpdate[moduleId] = newModuleFactory;
/******/ 		            addAllToSet(outdatedModules, result.outdatedModules);
/******/ 		            for (moduleId in result.outdatedDependencies)
/******/ 		              if (__webpack_require__.o(result.outdatedDependencies, moduleId)) {
/******/ 		                if (!outdatedDependencies[moduleId])
/******/ 		                  outdatedDependencies[moduleId] = [];
/******/ 		                addAllToSet(outdatedDependencies[moduleId], result.outdatedDependencies[moduleId]);
/******/ 		              }
/******/ 		          }
/******/ 		          if (doDispose) {
/******/ 		            addAllToSet(outdatedModules, [result.moduleId]);
/******/ 		            appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 		          }
/******/ 		        }
/******/ 		      currentUpdate = void 0;
/******/ 		      var outdatedSelfAcceptedModules = [];
/******/ 		      for (var j = 0;j < outdatedModules.length; j++) {
/******/ 		        var outdatedModuleId = outdatedModules[j], module = __webpack_require__.c[outdatedModuleId];
/******/ 		        if (module && (module.hot._selfAccepted || module.hot._main) && appliedUpdate[outdatedModuleId] !== warnUnexpectedRequire && !module.hot._selfInvalidated)
/******/ 		          outdatedSelfAcceptedModules.push({
/******/ 		            module: outdatedModuleId,
/******/ 		            require: module.hot._requireSelf,
/******/ 		            errorHandler: module.hot._selfAccepted
/******/ 		          });
/******/ 		      }
/******/ 		      var moduleOutdatedDependencies;
/******/ 		      return {
/******/ 		        dispose: function() {
/******/ 		          currentUpdateRemovedChunks.forEach(function(chunkId) {
/******/ 		            delete installedChunks[chunkId];
/******/ 		          });
/******/ 		          currentUpdateRemovedChunks = void 0;
/******/ 		          var idx, queue = outdatedModules.slice();
/******/ 		          while (queue.length > 0) {
/******/ 		            var moduleId = queue.pop(), module = __webpack_require__.c[moduleId];
/******/ 		            if (!module)
/******/ 		              continue;
/******/ 		            var data = {}, disposeHandlers = module.hot._disposeHandlers;
/******/ 		            for (j = 0;j < disposeHandlers.length; j++)
/******/ 		              disposeHandlers[j].call(null, data);
/******/ 		            __webpack_require__.hmrD[moduleId] = data;
/******/ 		            module.hot.active = !1;
/******/ 		            delete __webpack_require__.c[moduleId];
/******/ 		            delete outdatedDependencies[moduleId];
/******/ 		            for (j = 0;j < module.children.length; j++) {
/******/ 		              var child = __webpack_require__.c[module.children[j]];
/******/ 		              if (!child)
/******/ 		                continue;
/******/ 		              idx = child.parents.indexOf(moduleId);
/******/ 		              if (idx >= 0)
/******/ 		                child.parents.splice(idx, 1);
/******/ 		            }
/******/ 		          }
/******/ 		          var dependency;
/******/ 		          for (var outdatedModuleId in outdatedDependencies)
/******/ 		            if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
/******/ 		              module = __webpack_require__.c[outdatedModuleId];
/******/ 		              if (module) {
/******/ 		                moduleOutdatedDependencies = outdatedDependencies[outdatedModuleId];
/******/ 		                for (j = 0;j < moduleOutdatedDependencies.length; j++) {
/******/ 		                  dependency = moduleOutdatedDependencies[j];
/******/ 		                  idx = module.children.indexOf(dependency);
/******/ 		                  if (idx >= 0)
/******/ 		                    module.children.splice(idx, 1);
/******/ 		                }
/******/ 		              }
/******/ 		            }
/******/ 		        },
/******/ 		        apply: function(reportError) {
/******/ 		          for (var updateModuleId in appliedUpdate)
/******/ 		            if (__webpack_require__.o(appliedUpdate, updateModuleId))
/******/ 		              __webpack_require__.m[updateModuleId] = appliedUpdate[updateModuleId];
/******/ 		          for (var i = 0;i < currentUpdateRuntime.length; i++)
/******/ 		            currentUpdateRuntime[i](__webpack_require__);
/******/ 		          for (var outdatedModuleId in outdatedDependencies)
/******/ 		            if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
/******/ 		              var module = __webpack_require__.c[outdatedModuleId];
/******/ 		              if (module) {
/******/ 		                moduleOutdatedDependencies = outdatedDependencies[outdatedModuleId];
/******/ 		                var callbacks = [], errorHandlers = [], dependenciesForCallbacks = [];
/******/ 		                for (var j = 0;j < moduleOutdatedDependencies.length; j++) {
/******/ 		                  var dependency = moduleOutdatedDependencies[j], acceptCallback = module.hot._acceptedDependencies[dependency], errorHandler = module.hot._acceptedErrorHandlers[dependency];
/******/ 		                  if (acceptCallback) {
/******/ 		                    if (callbacks.indexOf(acceptCallback) !== -1)
/******/ 		                      continue;
/******/ 		                    callbacks.push(acceptCallback);
/******/ 		                    errorHandlers.push(errorHandler);
/******/ 		                    dependenciesForCallbacks.push(dependency);
/******/ 		                  }
/******/ 		                }
/******/ 		                for (var k = 0;k < callbacks.length; k++)
/******/ 		                  try {
/******/ 		                    callbacks[k].call(null, moduleOutdatedDependencies);
/******/ 		                  } catch (err) {
/******/ 		                    if (typeof errorHandlers[k] === "function")
/******/ 		                      try {
/******/ 		                        errorHandlers[k](err, {
/******/ 		                          moduleId: outdatedModuleId,
/******/ 		                          dependencyId: dependenciesForCallbacks[k]
/******/ 		                        });
/******/ 		                      } catch (err2) {
/******/ 		                        if (options.onErrored)
/******/ 		                          options.onErrored({
/******/ 		                            type: "accept-error-handler-errored",
/******/ 		                            moduleId: outdatedModuleId,
/******/ 		                            dependencyId: dependenciesForCallbacks[k],
/******/ 		                            error: err2,
/******/ 		                            originalError: err
/******/ 		                          });
/******/ 		                        if (!options.ignoreErrored) {
/******/ 		                          reportError(err2);
/******/ 		                          reportError(err);
/******/ 		                        }
/******/ 		                      }
/******/ 		                    else {
/******/ 		                      if (options.onErrored)
/******/ 		                        options.onErrored({
/******/ 		                          type: "accept-errored",
/******/ 		                          moduleId: outdatedModuleId,
/******/ 		                          dependencyId: dependenciesForCallbacks[k],
/******/ 		                          error: err
/******/ 		                        });
/******/ 		                      if (!options.ignoreErrored)
/******/ 		                        reportError(err);
/******/ 		                    }
/******/ 		                  }
/******/ 		              }
/******/ 		            }
/******/ 		          for (var o = 0;o < outdatedSelfAcceptedModules.length; o++) {
/******/ 		            var item = outdatedSelfAcceptedModules[o], moduleId = item.module;
/******/ 		            try {
/******/ 		              item.require(moduleId);
/******/ 		            } catch (err) {
/******/ 		              if (typeof item.errorHandler === "function")
/******/ 		                try {
/******/ 		                  item.errorHandler(err, {
/******/ 		                    moduleId,
/******/ 		                    module: __webpack_require__.c[moduleId]
/******/ 		                  });
/******/ 		                } catch (err1) {
/******/ 		                  if (options.onErrored)
/******/ 		                    options.onErrored({
/******/ 		                      type: "self-accept-error-handler-errored",
/******/ 		                      moduleId,
/******/ 		                      error: err1,
/******/ 		                      originalError: err
/******/ 		                    });
/******/ 		                  if (!options.ignoreErrored) {
/******/ 		                    reportError(err1);
/******/ 		                    reportError(err);
/******/ 		                  }
/******/ 		                }
/******/ 		              else {
/******/ 		                if (options.onErrored)
/******/ 		                  options.onErrored({
/******/ 		                    type: "self-accept-errored",
/******/ 		                    moduleId,
/******/ 		                    error: err
/******/ 		                  });
/******/ 		                if (!options.ignoreErrored)
/******/ 		                  reportError(err);
/******/ 		              }
/******/ 		            }
/******/ 		          }
/******/ 		          return outdatedModules;
/******/ 		        }
/******/ 		      };
/******/ 		    }
/******/ 		    __webpack_require__.hmrI.jsonp = function(moduleId, applyHandlers) {
/******/ 		      if (!currentUpdate) {
/******/ 		        currentUpdate = {};
/******/ 		        currentUpdateRuntime = [];
/******/ 		        currentUpdateRemovedChunks = [];
/******/ 		        applyHandlers.push(applyHandler);
/******/ 		      }
/******/ 		      if (!__webpack_require__.o(currentUpdate, moduleId))
/******/ 		        currentUpdate[moduleId] = __webpack_require__.m[moduleId];
/******/ 		    };
/******/ 		    __webpack_require__.hmrC.jsonp = function(chunkIds, removedChunks, removedModules, promises, applyHandlers, updatedModulesList) {
/******/ 		      applyHandlers.push(applyHandler);
/******/ 		      currentUpdateChunks = {};
/******/ 		      currentUpdateRemovedChunks = removedChunks;
/******/ 		      currentUpdate = removedModules.reduce(function(obj, key) {
/******/ 		        obj[key] = !1;
/******/ 		        return obj;
/******/ 		      }, {});
/******/ 		      currentUpdateRuntime = [];
/******/ 		      chunkIds.forEach(function(chunkId) {
/******/ 		        if (__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId] !== void 0) {
/******/ 		          promises.push(loadUpdateChunk(chunkId, updatedModulesList));
/******/ 		          currentUpdateChunks[chunkId] = !0;
/******/ 		        } else
/******/ 		          currentUpdateChunks[chunkId] = !1;
/******/ 		      });
/******/ 		      if (__webpack_require__.f)
/******/ 		        __webpack_require__.f.jsonpHmr = function(chunkId, promises) {
/******/ 		          if (currentUpdateChunks && __webpack_require__.o(currentUpdateChunks, chunkId) && !currentUpdateChunks[chunkId]) {
/******/ 		            promises.push(loadUpdateChunk(chunkId));
/******/ 		            currentUpdateChunks[chunkId] = !0;
/******/ 		          }
/******/ 		        };
/******/ 		    };
/******/ 		  
/******/ 		
/******/ 		__webpack_require__.hmrM = () => {
/******/ 			if (typeof fetch === "undefined") throw new Error("No browser support: need fetch API");
/******/ 			return fetch(__webpack_require__.p + __webpack_require__.hmrF()).then((response) => {
/******/ 				if(response.status === 404) return; // no update available
/******/ 				if(!response.ok) throw new Error("Failed to fetch update manifest " + response.statusText);
/******/ 				return response.json();
/******/ 			});
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	
/******/ })()

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJpZ25vcmVMaXN0IjpbMF0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZXMiOlsid2VicGFjay1pbnRlcm5hbDovL25leHRqcy93ZWJwYWNrLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXMgc291cmNlIHdhcyBnZW5lcmF0ZWQgYnkgTmV4dC5qcyBiYXNlZCBvZmYgb2YgdGhlIGdlbmVyYXRlZCBXZWJwYWNrIHJ1bnRpbWUuXG4vLyBUaGUgbWFwcGluZ3MgYXJlIGluY29ycmVjdC5cbi8vIFRvIGdldCB0aGUgY29ycmVjdCBsaW5lL2NvbHVtbiBtYXBwaW5ncywgdHVybiBvZmYgc291cmNlbWFwcyBpbiB5b3VyIGRlYnVnZ2VyLlxuXG4vKioqKioqLyAoKCkgPT4geyAvLyB3ZWJwYWNrQm9vdHN0cmFwXG4vKioqKioqLyBcdFwidXNlIHN0cmljdFwiO1xuLyoqKioqKi8gXHR2YXIgX193ZWJwYWNrX21vZHVsZXNfXyA9ICh7fSk7XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdHZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcbi8qKioqKiovIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbi8qKioqKiovIFx0XHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcbi8qKioqKiovIFx0XHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbi8qKioqKiovIFx0XHRcdGlmIChjYWNoZWRNb2R1bGUuZXJyb3IgIT09IHVuZGVmaW5lZCkgdGhyb3cgY2FjaGVkTW9kdWxlLmVycm9yO1xuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZSxcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9XG4vKioqKioqLyBcdFx0fTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4vKioqKioqLyBcdFx0dmFyIHRocmV3ID0gdHJ1ZTtcbi8qKioqKiovIFx0XHR0cnkge1xuLyoqKioqKi8gXHRcdFx0dmFyIGV4ZWNPcHRpb25zID0geyBpZDogbW9kdWxlSWQsIG1vZHVsZTogbW9kdWxlLCBmYWN0b3J5OiBfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXSwgcmVxdWlyZTogX193ZWJwYWNrX3JlcXVpcmVfXyB9O1xuLyoqKioqKi8gXHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5pLmZvckVhY2goZnVuY3Rpb24oaGFuZGxlcikgeyBoYW5kbGVyKGV4ZWNPcHRpb25zKTsgfSk7XG4vKioqKioqLyBcdFx0XHRtb2R1bGUgPSBleGVjT3B0aW9ucy5tb2R1bGU7XG4vKioqKioqLyBcdFx0XHRleGVjT3B0aW9ucy5mYWN0b3J5LmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIGV4ZWNPcHRpb25zLnJlcXVpcmUpO1xuLyoqKioqKi8gXHRcdFx0dGhyZXcgPSBmYWxzZTtcbi8qKioqKiovIFx0XHR9IGZpbmFsbHkge1xuLyoqKioqKi8gXHRcdFx0aWYodGhyZXcpIGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0XG4vKioqKioqLyBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuLyoqKioqKi8gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuLyoqKioqKi8gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIFx0fVxuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gX193ZWJwYWNrX21vZHVsZXNfXztcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfXztcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGV4ZWN1dGlvbiBpbnRlcmNlcHRvclxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmkgPSBbXTtcbi8qKioqKiovIFx0XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvY2h1bmsgbG9hZGVkICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0dmFyIGRlZmVycmVkID0gW107XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5PID0gKHJlc3VsdCwgY2h1bmtJZHMsIGZuLCBwcmlvcml0eSkgPT4ge1xuLyoqKioqKi8gXHRcdFx0aWYoY2h1bmtJZHMpIHtcbi8qKioqKiovIFx0XHRcdFx0cHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuLyoqKioqKi8gXHRcdFx0XHRmb3IodmFyIGkgPSBkZWZlcnJlZC5sZW5ndGg7IGkgPiAwICYmIGRlZmVycmVkW2kgLSAxXVsyXSA+IHByaW9yaXR5OyBpLS0pIGRlZmVycmVkW2ldID0gZGVmZXJyZWRbaSAtIDFdO1xuLyoqKioqKi8gXHRcdFx0XHRkZWZlcnJlZFtpXSA9IFtjaHVua0lkcywgZm4sIHByaW9yaXR5XTtcbi8qKioqKiovIFx0XHRcdFx0cmV0dXJuO1xuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0dmFyIG5vdEZ1bGZpbGxlZCA9IEluZmluaXR5O1xuLyoqKioqKi8gXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBkZWZlcnJlZC5sZW5ndGg7IGkrKykge1xuLyoqKioqKi8gXHRcdFx0XHR2YXIgW2NodW5rSWRzLCBmbiwgcHJpb3JpdHldID0gZGVmZXJyZWRbaV07XG4vKioqKioqLyBcdFx0XHRcdHZhciBmdWxmaWxsZWQgPSB0cnVlO1xuLyoqKioqKi8gXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IGNodW5rSWRzLmxlbmd0aDsgaisrKSB7XG4vKioqKioqLyBcdFx0XHRcdFx0aWYgKChwcmlvcml0eSAmIDEgPT09IDAgfHwgbm90RnVsZmlsbGVkID49IHByaW9yaXR5KSAmJiBPYmplY3Qua2V5cyhfX3dlYnBhY2tfcmVxdWlyZV9fLk8pLmV2ZXJ5KChrZXkpID0+IChfX3dlYnBhY2tfcmVxdWlyZV9fLk9ba2V5XShjaHVua0lkc1tqXSkpKSkge1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0Y2h1bmtJZHMuc3BsaWNlKGotLSwgMSk7XG4vKioqKioqLyBcdFx0XHRcdFx0fSBlbHNlIHtcbi8qKioqKiovIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZCA9IGZhbHNlO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0aWYocHJpb3JpdHkgPCBub3RGdWxmaWxsZWQpIG5vdEZ1bGZpbGxlZCA9IHByaW9yaXR5O1xuLyoqKioqKi8gXHRcdFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0XHRpZihmdWxmaWxsZWQpIHtcbi8qKioqKiovIFx0XHRcdFx0XHRkZWZlcnJlZC5zcGxpY2UoaS0tLCAxKVxuLyoqKioqKi8gXHRcdFx0XHRcdHZhciByID0gZm4oKTtcbi8qKioqKiovIFx0XHRcdFx0XHRpZiAociAhPT0gdW5kZWZpbmVkKSByZXN1bHQgPSByO1xuLyoqKioqKi8gXHRcdFx0XHR9XG4vKioqKioqLyBcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gcmVzdWx0O1xuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMgKi9cbi8qKioqKiovIFx0KCgpID0+IHtcbi8qKioqKiovIFx0XHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcbi8qKioqKiovIFx0XHRcdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcbi8qKioqKiovIFx0XHRcdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG4vKioqKioqLyBcdFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcbi8qKioqKiovIFx0XHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvZW5zdXJlIGNodW5rICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mID0ge307XG4vKioqKioqLyBcdFx0Ly8gVGhpcyBmaWxlIGNvbnRhaW5zIG9ubHkgdGhlIGVudHJ5IGNodW5rLlxuLyoqKioqKi8gXHRcdC8vIFRoZSBjaHVuayBsb2FkaW5nIGZ1bmN0aW9uIGZvciBhZGRpdGlvbmFsIGNodW5rc1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZSA9IChjaHVua0lkKSA9PiB7XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5mKS5yZWR1Y2UoKHByb21pc2VzLCBrZXkpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mW2tleV0oY2h1bmtJZCwgcHJvbWlzZXMpO1xuLyoqKioqKi8gXHRcdFx0XHRyZXR1cm4gcHJvbWlzZXM7XG4vKioqKioqLyBcdFx0XHR9LCBbXSkpO1xuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgY2h1bmsgZmlsZW5hbWUgKi9cbi8qKioqKiovIFx0KCgpID0+IHtcbi8qKioqKiovIFx0XHQvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3Ncbi8qKioqKiovIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnUgPSAoY2h1bmtJZCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG4vKioqKioqLyBcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvZ2V0IGphdmFzY3JpcHQgdXBkYXRlIGNodW5rIGZpbGVuYW1lICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0Ly8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYWxsIGNodW5rc1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18uaHUgPSAoY2h1bmtJZCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0Ly8gcmV0dXJuIHVybCBmb3IgZmlsZW5hbWVzIGJhc2VkIG9uIHRlbXBsYXRlXG4vKioqKioqLyBcdFx0XHRyZXR1cm4gXCJzdGF0aWMvd2VicGFjay9cIiArIGNodW5rSWQgKyBcIi5cIiArIF9fd2VicGFja19yZXF1aXJlX18uaCgpICsgXCIuaG90LXVwZGF0ZS5qc1wiO1xuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvZ2V0IG1pbmktY3NzIGNodW5rIGZpbGVuYW1lICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0Ly8gVGhpcyBmdW5jdGlvbiBhbGxvdyB0byByZWZlcmVuY2UgYXN5bmMgY2h1bmtzXG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5taW5pQ3NzRiA9IChjaHVua0lkKSA9PiB7XG4vKioqKioqLyBcdFx0XHQvLyByZXR1cm4gdXJsIGZvciBmaWxlbmFtZXMgYmFzZWQgb24gdGVtcGxhdGVcbi8qKioqKiovIFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG4vKioqKioqLyBcdFx0fTtcbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8qIHdlYnBhY2svcnVudGltZS9nZXQgdXBkYXRlIG1hbmlmZXN0IGZpbGVuYW1lICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5obXJGID0gKCkgPT4gKFwic3RhdGljL3dlYnBhY2svXCIgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLmgoKSArIFwiLndlYnBhY2suaG90LXVwZGF0ZS5qc29uXCIpO1xuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0Lyogd2VicGFjay9ydW50aW1lL2dldEZ1bGxIYXNoICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5oID0gKCkgPT4gKFwiYmRkNzNjNGI0MTVmNWYyY1wiKVxuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0Lyogd2VicGFjay9ydW50aW1lL2dsb2JhbCAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHRcdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuLyoqKioqKi8gXHRcdFx0dHJ5IHtcbi8qKioqKiovIFx0XHRcdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG4vKioqKioqLyBcdFx0XHR9IGNhdGNoIChlKSB7XG4vKioqKioqLyBcdFx0XHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHR9KSgpO1xuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0Lyogd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSlcbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8qIHdlYnBhY2svcnVudGltZS9sb2FkIHNjcmlwdCAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdHZhciBpblByb2dyZXNzID0ge307XG4vKioqKioqLyBcdFx0dmFyIGRhdGFXZWJwYWNrUHJlZml4ID0gXCJfTl9FOlwiO1xuLyoqKioqKi8gXHRcdC8vIGxvYWRTY3JpcHQgZnVuY3Rpb24gdG8gbG9hZCBhIHNjcmlwdCB2aWEgc2NyaXB0IHRhZ1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18ubCA9ICh1cmwsIGRvbmUsIGtleSwgY2h1bmtJZCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0aWYoaW5Qcm9ncmVzc1t1cmxdKSB7IGluUHJvZ3Jlc3NbdXJsXS5wdXNoKGRvbmUpOyByZXR1cm47IH1cbi8qKioqKiovIFx0XHRcdHZhciBzY3JpcHQsIG5lZWRBdHRhY2g7XG4vKioqKioqLyBcdFx0XHRpZihrZXkgIT09IHVuZGVmaW5lZCkge1xuLyoqKioqKi8gXHRcdFx0XHR2YXIgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic2NyaXB0XCIpO1xuLyoqKioqKi8gXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuLyoqKioqKi8gXHRcdFx0XHRcdHZhciBzID0gc2NyaXB0c1tpXTtcbi8qKioqKiovIFx0XHRcdFx0XHRpZihzLmdldEF0dHJpYnV0ZShcInNyY1wiKSA9PSB1cmwgfHwgcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLXdlYnBhY2tcIikgPT0gZGF0YVdlYnBhY2tQcmVmaXggKyBrZXkpIHsgc2NyaXB0ID0gczsgYnJlYWs7IH1cbi8qKioqKiovIFx0XHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0aWYoIXNjcmlwdCkge1xuLyoqKioqKi8gXHRcdFx0XHRuZWVkQXR0YWNoID0gdHJ1ZTtcbi8qKioqKiovIFx0XHRcdFx0c2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4vKioqKioqLyBcdFx0XG4vKioqKioqLyBcdFx0XHRcdHNjcmlwdC5jaGFyc2V0ID0gJ3V0Zi04Jztcbi8qKioqKiovIFx0XHRcdFx0c2NyaXB0LnRpbWVvdXQgPSAxMjA7XG4vKioqKioqLyBcdFx0XHRcdGlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLm5jKSB7XG4vKioqKioqLyBcdFx0XHRcdFx0c2NyaXB0LnNldEF0dHJpYnV0ZShcIm5vbmNlXCIsIF9fd2VicGFja19yZXF1aXJlX18ubmMpO1xuLyoqKioqKi8gXHRcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRcdHNjcmlwdC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXdlYnBhY2tcIiwgZGF0YVdlYnBhY2tQcmVmaXggKyBrZXkpO1xuLyoqKioqKi8gXHRcdFxuLyoqKioqKi8gXHRcdFx0XHRzY3JpcHQuc3JjID0gX193ZWJwYWNrX3JlcXVpcmVfXy50dSh1cmwpO1xuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0aW5Qcm9ncmVzc1t1cmxdID0gW2RvbmVdO1xuLyoqKioqKi8gXHRcdFx0dmFyIG9uU2NyaXB0Q29tcGxldGUgPSAocHJldiwgZXZlbnQpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0Ly8gYXZvaWQgbWVtIGxlYWtzIGluIElFLlxuLyoqKioqKi8gXHRcdFx0XHRzY3JpcHQub25lcnJvciA9IHNjcmlwdC5vbmxvYWQgPSBudWxsO1xuLyoqKioqKi8gXHRcdFx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG4vKioqKioqLyBcdFx0XHRcdHZhciBkb25lRm5zID0gaW5Qcm9ncmVzc1t1cmxdO1xuLyoqKioqKi8gXHRcdFx0XHRkZWxldGUgaW5Qcm9ncmVzc1t1cmxdO1xuLyoqKioqKi8gXHRcdFx0XHRzY3JpcHQucGFyZW50Tm9kZSAmJiBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuLyoqKioqKi8gXHRcdFx0XHRkb25lRm5zICYmIGRvbmVGbnMuZm9yRWFjaCgoZm4pID0+IChmbihldmVudCkpKTtcbi8qKioqKiovIFx0XHRcdFx0aWYocHJldikgcmV0dXJuIHByZXYoZXZlbnQpO1xuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0dmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KG9uU2NyaXB0Q29tcGxldGUuYmluZChudWxsLCB1bmRlZmluZWQsIHsgdHlwZTogJ3RpbWVvdXQnLCB0YXJnZXQ6IHNjcmlwdCB9KSwgMTIwMDAwKTtcbi8qKioqKiovIFx0XHRcdHNjcmlwdC5vbmVycm9yID0gb25TY3JpcHRDb21wbGV0ZS5iaW5kKG51bGwsIHNjcmlwdC5vbmVycm9yKTtcbi8qKioqKiovIFx0XHRcdHNjcmlwdC5vbmxvYWQgPSBvblNjcmlwdENvbXBsZXRlLmJpbmQobnVsbCwgc2NyaXB0Lm9ubG9hZCk7XG4vKioqKioqLyBcdFx0XHRuZWVkQXR0YWNoICYmIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbi8qKioqKiovIFx0XHR9O1xuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0Lyogd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbi8qKioqKiovIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuLyoqKioqKi8gXHRcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4vKioqKioqLyBcdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKioqKiovIFx0XHR9O1xuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0Lyogd2VicGFjay9ydW50aW1lL25vZGUgbW9kdWxlIGRlY29yYXRvciAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18ubm1kID0gKG1vZHVsZSkgPT4ge1xuLyoqKioqKi8gXHRcdFx0bW9kdWxlLnBhdGhzID0gW107XG4vKioqKioqLyBcdFx0XHRpZiAoIW1vZHVsZS5jaGlsZHJlbikgbW9kdWxlLmNoaWxkcmVuID0gW107XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gbW9kdWxlO1xuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvcnVudGltZUlkICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5qID0gXCJ3ZWJwYWNrXCI7XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvdHJ1c3RlZCB0eXBlcyBwb2xpY3kgKi9cbi8qKioqKiovIFx0KCgpID0+IHtcbi8qKioqKiovIFx0XHR2YXIgcG9saWN5O1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18udHQgPSAoKSA9PiB7XG4vKioqKioqLyBcdFx0XHQvLyBDcmVhdGUgVHJ1c3RlZCBUeXBlIHBvbGljeSBpZiBUcnVzdGVkIFR5cGVzIGFyZSBhdmFpbGFibGUgYW5kIHRoZSBwb2xpY3kgZG9lc24ndCBleGlzdCB5ZXQuXG4vKioqKioqLyBcdFx0XHRpZiAocG9saWN5ID09PSB1bmRlZmluZWQpIHtcbi8qKioqKiovIFx0XHRcdFx0cG9saWN5ID0ge1xuLyoqKioqKi8gXHRcdFx0XHRcdGNyZWF0ZVNjcmlwdDogKHNjcmlwdCkgPT4gKHNjcmlwdCksXG4vKioqKioqLyBcdFx0XHRcdFx0Y3JlYXRlU2NyaXB0VVJMOiAodXJsKSA9PiAodXJsKVxuLyoqKioqKi8gXHRcdFx0XHR9O1xuLyoqKioqKi8gXHRcdFx0XHRpZiAodHlwZW9mIHRydXN0ZWRUeXBlcyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0cnVzdGVkVHlwZXMuY3JlYXRlUG9saWN5KSB7XG4vKioqKioqLyBcdFx0XHRcdFx0cG9saWN5ID0gdHJ1c3RlZFR5cGVzLmNyZWF0ZVBvbGljeShcIm5leHRqcyNidW5kbGVyXCIsIHBvbGljeSk7XG4vKioqKioqLyBcdFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdHJldHVybiBwb2xpY3k7XG4vKioqKioqLyBcdFx0fTtcbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8qIHdlYnBhY2svcnVudGltZS90cnVzdGVkIHR5cGVzIHNjcmlwdCAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18udHMgPSAoc2NyaXB0KSA9PiAoX193ZWJwYWNrX3JlcXVpcmVfXy50dCgpLmNyZWF0ZVNjcmlwdChzY3JpcHQpKTtcbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8qIHdlYnBhY2svcnVudGltZS90cnVzdGVkIHR5cGVzIHNjcmlwdCB1cmwgKi9cbi8qKioqKiovIFx0KCgpID0+IHtcbi8qKioqKiovIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnR1ID0gKHVybCkgPT4gKF9fd2VicGFja19yZXF1aXJlX18udHQoKS5jcmVhdGVTY3JpcHRVUkwodXJsKSk7XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvaG90IG1vZHVsZSByZXBsYWNlbWVudCAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdCAgICB2YXIgY3VycmVudE1vZHVsZURhdGEgPSB7fSwgaW5zdGFsbGVkTW9kdWxlcyA9IF9fd2VicGFja19yZXF1aXJlX18uYywgY3VycmVudENoaWxkTW9kdWxlLCBjdXJyZW50UGFyZW50cyA9IFtdLCByZWdpc3RlcmVkU3RhdHVzSGFuZGxlcnMgPSBbXSwgY3VycmVudFN0YXR1cyA9IFwiaWRsZVwiLCBibG9ja2luZ1Byb21pc2VzID0gMCwgYmxvY2tpbmdQcm9taXNlc1dhaXRpbmcgPSBbXSwgY3VycmVudFVwZGF0ZUFwcGx5SGFuZGxlcnMsIHF1ZXVlZEludmFsaWRhdGVkTW9kdWxlcztcbi8qKioqKiovIFx0XHQgICAgX193ZWJwYWNrX3JlcXVpcmVfXy5obXJEID0gY3VycmVudE1vZHVsZURhdGE7XG4vKioqKioqLyBcdFx0ICAgIF9fd2VicGFja19yZXF1aXJlX18uaS5wdXNoKGZ1bmN0aW9uKG9wdGlvbnMpIHtcbi8qKioqKiovIFx0XHQgICAgICB2YXIgbW9kdWxlID0gb3B0aW9ucy5tb2R1bGUsIHJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKG9wdGlvbnMucmVxdWlyZSwgb3B0aW9ucy5pZCk7XG4vKioqKioqLyBcdFx0ICAgICAgbW9kdWxlLmhvdCA9IGNyZWF0ZU1vZHVsZUhvdE9iamVjdChvcHRpb25zLmlkLCBtb2R1bGUpO1xuLyoqKioqKi8gXHRcdCAgICAgIG1vZHVsZS5wYXJlbnRzID0gY3VycmVudFBhcmVudHM7XG4vKioqKioqLyBcdFx0ICAgICAgbW9kdWxlLmNoaWxkcmVuID0gW107XG4vKioqKioqLyBcdFx0ICAgICAgY3VycmVudFBhcmVudHMgPSBbXTtcbi8qKioqKiovIFx0XHQgICAgICBvcHRpb25zLnJlcXVpcmUgPSByZXF1aXJlO1xuLyoqKioqKi8gXHRcdCAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgX193ZWJwYWNrX3JlcXVpcmVfXy5obXJDID0ge307XG4vKioqKioqLyBcdFx0ICAgIF9fd2VicGFja19yZXF1aXJlX18uaG1ySSA9IHt9O1xuLyoqKioqKi8gXHRcdCAgICBmdW5jdGlvbiBjcmVhdGVSZXF1aXJlKHJlcXVpcmUsIG1vZHVsZUlkKSB7XG4vKioqKioqLyBcdFx0ICAgICAgdmFyIG1lID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF07XG4vKioqKioqLyBcdFx0ICAgICAgaWYgKCFtZSlcbi8qKioqKiovIFx0XHQgICAgICAgIHJldHVybiByZXF1aXJlO1xuLyoqKioqKi8gXHRcdCAgICAgIHZhciBmbiA9IGZ1bmN0aW9uKHJlcXVlc3QpIHtcbi8qKioqKiovIFx0XHQgICAgICAgIGlmIChtZS5ob3QuYWN0aXZlKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGlmIChpbnN0YWxsZWRNb2R1bGVzW3JlcXVlc3RdKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgdmFyIHBhcmVudHMgPSBpbnN0YWxsZWRNb2R1bGVzW3JlcXVlc3RdLnBhcmVudHM7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaWYgKHBhcmVudHMuaW5kZXhPZihtb2R1bGVJZCkgPT09IC0xKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgcGFyZW50cy5wdXNoKG1vZHVsZUlkKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfSBlbHNlIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBjdXJyZW50UGFyZW50cyA9IFttb2R1bGVJZF07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgY3VycmVudENoaWxkTW9kdWxlID0gcmVxdWVzdDtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAobWUuY2hpbGRyZW4uaW5kZXhPZihyZXF1ZXN0KSA9PT0gLTEpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgbWUuY2hpbGRyZW4ucHVzaChyZXF1ZXN0KTtcbi8qKioqKiovIFx0XHQgICAgICAgIH0gZWxzZSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGNvbnNvbGUud2FybihcIltITVJdIHVuZXhwZWN0ZWQgcmVxdWlyZShcIiArIHJlcXVlc3QgKyBcIikgZnJvbSBkaXNwb3NlZCBtb2R1bGUgXCIgKyBtb2R1bGVJZCk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGN1cnJlbnRQYXJlbnRzID0gW107XG4vKioqKioqLyBcdFx0ICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4gcmVxdWlyZShyZXF1ZXN0KTtcbi8qKioqKiovIFx0XHQgICAgICB9LCBjcmVhdGVQcm9wZXJ0eURlc2NyaXB0b3IgPSBmdW5jdGlvbihuYW1lKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4ge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBjb25maWd1cmFibGU6ICEwLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICBlbnVtZXJhYmxlOiAhMCxcbi8qKioqKiovIFx0XHQgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICByZXR1cm4gcmVxdWlyZVtuYW1lXTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfSxcbi8qKioqKiovIFx0XHQgICAgICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHJlcXVpcmVbbmFtZV0gPSB2YWx1ZTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgfTtcbi8qKioqKiovIFx0XHQgICAgICB9O1xuLyoqKioqKi8gXHRcdCAgICAgIGZvciAodmFyIG5hbWUgaW4gcmVxdWlyZSlcbi8qKioqKiovIFx0XHQgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocmVxdWlyZSwgbmFtZSkgJiYgbmFtZSAhPT0gXCJlXCIpXG4vKioqKioqLyBcdFx0ICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmbiwgbmFtZSwgY3JlYXRlUHJvcGVydHlEZXNjcmlwdG9yKG5hbWUpKTtcbi8qKioqKiovIFx0XHQgICAgICBmbi5lID0gZnVuY3Rpb24oY2h1bmtJZCwgZmV0Y2hQcmlvcml0eSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgcmV0dXJuIHRyYWNrQmxvY2tpbmdQcm9taXNlKHJlcXVpcmUuZShjaHVua0lkLCBmZXRjaFByaW9yaXR5KSk7XG4vKioqKioqLyBcdFx0ICAgICAgfTtcbi8qKioqKiovIFx0XHQgICAgICByZXR1cm4gZm47XG4vKioqKioqLyBcdFx0ICAgIH1cbi8qKioqKiovIFx0XHQgICAgZnVuY3Rpb24gY3JlYXRlTW9kdWxlSG90T2JqZWN0KG1vZHVsZUlkLCBtZSkge1xuLyoqKioqKi8gXHRcdCAgICAgIHZhciBfbWFpbiA9IGN1cnJlbnRDaGlsZE1vZHVsZSAhPT0gbW9kdWxlSWQsIGhvdCA9IHtcbi8qKioqKiovIFx0XHQgICAgICAgIF9hY2NlcHRlZERlcGVuZGVuY2llczoge30sXG4vKioqKioqLyBcdFx0ICAgICAgICBfYWNjZXB0ZWRFcnJvckhhbmRsZXJzOiB7fSxcbi8qKioqKiovIFx0XHQgICAgICAgIF9kZWNsaW5lZERlcGVuZGVuY2llczoge30sXG4vKioqKioqLyBcdFx0ICAgICAgICBfc2VsZkFjY2VwdGVkOiAhMSxcbi8qKioqKiovIFx0XHQgICAgICAgIF9zZWxmRGVjbGluZWQ6ICExLFxuLyoqKioqKi8gXHRcdCAgICAgICAgX3NlbGZJbnZhbGlkYXRlZDogITEsXG4vKioqKioqLyBcdFx0ICAgICAgICBfZGlzcG9zZUhhbmRsZXJzOiBbXSxcbi8qKioqKiovIFx0XHQgICAgICAgIF9tYWluLFxuLyoqKioqKi8gXHRcdCAgICAgICAgX3JlcXVpcmVTZWxmOiBmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgY3VycmVudFBhcmVudHMgPSBtZS5wYXJlbnRzLnNsaWNlKCk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGN1cnJlbnRDaGlsZE1vZHVsZSA9IF9tYWluID8gdm9pZCAwIDogbW9kdWxlSWQ7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgfSxcbi8qKioqKiovIFx0XHQgICAgICAgIGFjdGl2ZTogITAsXG4vKioqKioqLyBcdFx0ICAgICAgICBhY2NlcHQ6IGZ1bmN0aW9uKGRlcCwgY2FsbGJhY2ssIGVycm9ySGFuZGxlcikge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoZGVwID09PSB2b2lkIDApXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaG90Ll9zZWxmQWNjZXB0ZWQgPSAhMDtcbi8qKioqKiovIFx0XHQgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRlcCA9PT0gXCJmdW5jdGlvblwiKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGhvdC5fc2VsZkFjY2VwdGVkID0gZGVwO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgZGVwID09PSBcIm9iamVjdFwiICYmIGRlcCAhPT0gbnVsbClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDtpIDwgZGVwLmxlbmd0aDsgaSsrKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBob3QuX2FjY2VwdGVkRGVwZW5kZW5jaWVzW2RlcFtpXV0gPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaG90Ll9hY2NlcHRlZEVycm9ySGFuZGxlcnNbZGVwW2ldXSA9IGVycm9ySGFuZGxlcjtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGVsc2Uge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGhvdC5fYWNjZXB0ZWREZXBlbmRlbmNpZXNbZGVwXSA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uKCkge307XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaG90Ll9hY2NlcHRlZEVycm9ySGFuZGxlcnNbZGVwXSA9IGVycm9ySGFuZGxlcjtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgfSxcbi8qKioqKiovIFx0XHQgICAgICAgIGRlY2xpbmU6IGZ1bmN0aW9uKGRlcCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoZGVwID09PSB2b2lkIDApXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaG90Ll9zZWxmRGVjbGluZWQgPSAhMDtcbi8qKioqKiovIFx0XHQgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGRlcCA9PT0gXCJvYmplY3RcIiAmJiBkZXAgIT09IG51bGwpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7aSA8IGRlcC5sZW5ndGg7IGkrKylcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGhvdC5fZGVjbGluZWREZXBlbmRlbmNpZXNbZGVwW2ldXSA9ICEwO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBlbHNlXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaG90Ll9kZWNsaW5lZERlcGVuZGVuY2llc1tkZXBdID0gITA7XG4vKioqKioqLyBcdFx0ICAgICAgICB9LFxuLyoqKioqKi8gXHRcdCAgICAgICAgZGlzcG9zZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgaG90Ll9kaXNwb3NlSGFuZGxlcnMucHVzaChjYWxsYmFjayk7XG4vKioqKioqLyBcdFx0ICAgICAgICB9LFxuLyoqKioqKi8gXHRcdCAgICAgICAgYWRkRGlzcG9zZUhhbmRsZXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGhvdC5fZGlzcG9zZUhhbmRsZXJzLnB1c2goY2FsbGJhY2spO1xuLyoqKioqKi8gXHRcdCAgICAgICAgfSxcbi8qKioqKiovIFx0XHQgICAgICAgIHJlbW92ZURpc3Bvc2VIYW5kbGVyOiBmdW5jdGlvbihjYWxsYmFjaykge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB2YXIgaWR4ID0gaG90Ll9kaXNwb3NlSGFuZGxlcnMuaW5kZXhPZihjYWxsYmFjayk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGlmIChpZHggPj0gMClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBob3QuX2Rpc3Bvc2VIYW5kbGVycy5zcGxpY2UoaWR4LCAxKTtcbi8qKioqKiovIFx0XHQgICAgICAgIH0sXG4vKioqKioqLyBcdFx0ICAgICAgICBpbnZhbGlkYXRlOiBmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgdGhpcy5fc2VsZkludmFsaWRhdGVkID0gITA7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHN3aXRjaCAoY3VycmVudFN0YXR1cykge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNhc2UgXCJpZGxlXCI6XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBjdXJyZW50VXBkYXRlQXBwbHlIYW5kbGVycyA9IFtdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5obXJJKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBfX3dlYnBhY2tfcmVxdWlyZV9fLmhtcklba2V5XShtb2R1bGVJZCwgY3VycmVudFVwZGF0ZUFwcGx5SGFuZGxlcnMpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBzZXRTdGF0dXMoXCJyZWFkeVwiKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGJyZWFrO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNhc2UgXCJyZWFkeVwiOlxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5obXJJKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBfX3dlYnBhY2tfcmVxdWlyZV9fLmhtcklba2V5XShtb2R1bGVJZCwgY3VycmVudFVwZGF0ZUFwcGx5SGFuZGxlcnMpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBicmVhaztcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBjYXNlIFwicHJlcGFyZVwiOlxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNhc2UgXCJjaGVja1wiOlxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNhc2UgXCJkaXNwb3NlXCI6XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgY2FzZSBcImFwcGx5XCI6XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAocXVldWVkSW52YWxpZGF0ZWRNb2R1bGVzID0gcXVldWVkSW52YWxpZGF0ZWRNb2R1bGVzIHx8IFtdKS5wdXNoKG1vZHVsZUlkKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGJyZWFrO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGRlZmF1bHQ6XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBicmVhaztcbi8qKioqKiovIFx0XHQgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgfSxcbi8qKioqKiovIFx0XHQgICAgICAgIGNoZWNrOiBob3RDaGVjayxcbi8qKioqKiovIFx0XHQgICAgICAgIGFwcGx5OiBob3RBcHBseSxcbi8qKioqKiovIFx0XHQgICAgICAgIHN0YXR1czogZnVuY3Rpb24obCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoIWwpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRTdGF0dXM7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHJlZ2lzdGVyZWRTdGF0dXNIYW5kbGVycy5wdXNoKGwpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgfSxcbi8qKioqKiovIFx0XHQgICAgICAgIGFkZFN0YXR1c0hhbmRsZXI6IGZ1bmN0aW9uKGwpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgcmVnaXN0ZXJlZFN0YXR1c0hhbmRsZXJzLnB1c2gobCk7XG4vKioqKioqLyBcdFx0ICAgICAgICB9LFxuLyoqKioqKi8gXHRcdCAgICAgICAgcmVtb3ZlU3RhdHVzSGFuZGxlcjogZnVuY3Rpb24obCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB2YXIgaWR4ID0gcmVnaXN0ZXJlZFN0YXR1c0hhbmRsZXJzLmluZGV4T2YobCk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGlmIChpZHggPj0gMClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICByZWdpc3RlcmVkU3RhdHVzSGFuZGxlcnMuc3BsaWNlKGlkeCwgMSk7XG4vKioqKioqLyBcdFx0ICAgICAgICB9LFxuLyoqKioqKi8gXHRcdCAgICAgICAgZGF0YTogY3VycmVudE1vZHVsZURhdGFbbW9kdWxlSWRdXG4vKioqKioqLyBcdFx0ICAgICAgfTtcbi8qKioqKiovIFx0XHQgICAgICBjdXJyZW50Q2hpbGRNb2R1bGUgPSB2b2lkIDA7XG4vKioqKioqLyBcdFx0ICAgICAgcmV0dXJuIGhvdDtcbi8qKioqKiovIFx0XHQgICAgfVxuLyoqKioqKi8gXHRcdCAgICBmdW5jdGlvbiBzZXRTdGF0dXMobmV3U3RhdHVzKSB7XG4vKioqKioqLyBcdFx0ICAgICAgY3VycmVudFN0YXR1cyA9IG5ld1N0YXR1cztcbi8qKioqKiovIFx0XHQgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuLyoqKioqKi8gXHRcdCAgICAgIGZvciAodmFyIGkgPSAwO2kgPCByZWdpc3RlcmVkU3RhdHVzSGFuZGxlcnMubGVuZ3RoOyBpKyspXG4vKioqKioqLyBcdFx0ICAgICAgICByZXN1bHRzW2ldID0gcmVnaXN0ZXJlZFN0YXR1c0hhbmRsZXJzW2ldLmNhbGwobnVsbCwgbmV3U3RhdHVzKTtcbi8qKioqKiovIFx0XHQgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocmVzdWx0cykudGhlbihmdW5jdGlvbigpIHt9KTtcbi8qKioqKiovIFx0XHQgICAgfVxuLyoqKioqKi8gXHRcdCAgICBmdW5jdGlvbiB1bmJsb2NrKCkge1xuLyoqKioqKi8gXHRcdCAgICAgIGlmICgtLWJsb2NraW5nUHJvbWlzZXMgPT09IDApXG4vKioqKioqLyBcdFx0ICAgICAgICBzZXRTdGF0dXMoXCJyZWFkeVwiKS50aGVuKGZ1bmN0aW9uKCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoYmxvY2tpbmdQcm9taXNlcyA9PT0gMCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHZhciBsaXN0ID0gYmxvY2tpbmdQcm9taXNlc1dhaXRpbmc7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgYmxvY2tpbmdQcm9taXNlc1dhaXRpbmcgPSBbXTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDtpIDwgbGlzdC5sZW5ndGg7IGkrKylcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGxpc3RbaV0oKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgIH1cbi8qKioqKiovIFx0XHQgICAgZnVuY3Rpb24gdHJhY2tCbG9ja2luZ1Byb21pc2UocHJvbWlzZSkge1xuLyoqKioqKi8gXHRcdCAgICAgIHN3aXRjaCAoY3VycmVudFN0YXR1cykge1xuLyoqKioqKi8gXHRcdCAgICAgICAgY2FzZSBcInJlYWR5XCI6XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHNldFN0YXR1cyhcInByZXBhcmVcIik7XG4vKioqKioqLyBcdFx0ICAgICAgICBjYXNlIFwicHJlcGFyZVwiOlxuLyoqKioqKi8gXHRcdCAgICAgICAgICBibG9ja2luZ1Byb21pc2VzKys7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHByb21pc2UudGhlbih1bmJsb2NrLCB1bmJsb2NrKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4vKioqKioqLyBcdFx0ICAgICAgICBkZWZhdWx0OlxuLyoqKioqKi8gXHRcdCAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbi8qKioqKiovIFx0XHQgICAgICB9XG4vKioqKioqLyBcdFx0ICAgIH1cbi8qKioqKiovIFx0XHQgICAgZnVuY3Rpb24gd2FpdEZvckJsb2NraW5nUHJvbWlzZXMoZm4pIHtcbi8qKioqKiovIFx0XHQgICAgICBpZiAoYmxvY2tpbmdQcm9taXNlcyA9PT0gMClcbi8qKioqKiovIFx0XHQgICAgICAgIHJldHVybiBmbigpO1xuLyoqKioqKi8gXHRcdCAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICBibG9ja2luZ1Byb21pc2VzV2FpdGluZy5wdXNoKGZ1bmN0aW9uKCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICByZXNvbHZlKGZuKCkpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgIH1cbi8qKioqKiovIFx0XHQgICAgZnVuY3Rpb24gaG90Q2hlY2soYXBwbHlPblVwZGF0ZSkge1xuLyoqKioqKi8gXHRcdCAgICAgIGlmIChjdXJyZW50U3RhdHVzICE9PSBcImlkbGVcIilcbi8qKioqKiovIFx0XHQgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNoZWNrKCkgaXMgb25seSBhbGxvd2VkIGluIGlkbGUgc3RhdHVzXCIpO1xuLyoqKioqKi8gXHRcdCAgICAgIHJldHVybiBzZXRTdGF0dXMoXCJjaGVja1wiKS50aGVuKF9fd2VicGFja19yZXF1aXJlX18uaG1yTSkudGhlbihmdW5jdGlvbih1cGRhdGUpIHtcbi8qKioqKiovIFx0XHQgICAgICAgIGlmICghdXBkYXRlKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICByZXR1cm4gc2V0U3RhdHVzKGFwcGx5SW52YWxpZGF0ZWRNb2R1bGVzKCkgPyBcInJlYWR5XCIgOiBcImlkbGVcIikudGhlbihmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICByZXR1cm4gbnVsbDtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4gc2V0U3RhdHVzKFwicHJlcGFyZVwiKS50aGVuKGZ1bmN0aW9uKCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB2YXIgdXBkYXRlZE1vZHVsZXMgPSBbXTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgY3VycmVudFVwZGF0ZUFwcGx5SGFuZGxlcnMgPSBbXTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKF9fd2VicGFja19yZXF1aXJlX18uaG1yQykucmVkdWNlKGZ1bmN0aW9uKHByb21pc2VzLCBrZXkpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBfX3dlYnBhY2tfcmVxdWlyZV9fLmhtckNba2V5XSh1cGRhdGUuYywgdXBkYXRlLnIsIHVwZGF0ZS5tLCBwcm9taXNlcywgY3VycmVudFVwZGF0ZUFwcGx5SGFuZGxlcnMsIHVwZGF0ZWRNb2R1bGVzKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICByZXR1cm4gcHJvbWlzZXM7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIH0sIFtdKSkudGhlbihmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICByZXR1cm4gd2FpdEZvckJsb2NraW5nUHJvbWlzZXMoZnVuY3Rpb24oKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpZiAoYXBwbHlPblVwZGF0ZSlcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgcmV0dXJuIGludGVybmFsQXBwbHkoYXBwbHlPblVwZGF0ZSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICByZXR1cm4gc2V0U3RhdHVzKFwicmVhZHlcIikudGhlbihmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZWRNb2R1bGVzO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgIH1cbi8qKioqKiovIFx0XHQgICAgZnVuY3Rpb24gaG90QXBwbHkob3B0aW9ucykge1xuLyoqKioqKi8gXHRcdCAgICAgIGlmIChjdXJyZW50U3RhdHVzICE9PSBcInJlYWR5XCIpXG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXBwbHkoKSBpcyBvbmx5IGFsbG93ZWQgaW4gcmVhZHkgc3RhdHVzIChzdGF0ZTogXCIgKyBjdXJyZW50U3RhdHVzICsgXCIpXCIpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgcmV0dXJuIGludGVybmFsQXBwbHkob3B0aW9ucyk7XG4vKioqKioqLyBcdFx0ICAgIH1cbi8qKioqKiovIFx0XHQgICAgZnVuY3Rpb24gaW50ZXJuYWxBcHBseShvcHRpb25zKSB7XG4vKioqKioqLyBcdFx0ICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4vKioqKioqLyBcdFx0ICAgICAgYXBwbHlJbnZhbGlkYXRlZE1vZHVsZXMoKTtcbi8qKioqKiovIFx0XHQgICAgICB2YXIgcmVzdWx0cyA9IGN1cnJlbnRVcGRhdGVBcHBseUhhbmRsZXJzLm1hcChmdW5jdGlvbihoYW5kbGVyKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4gaGFuZGxlcihvcHRpb25zKTtcbi8qKioqKiovIFx0XHQgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgICBjdXJyZW50VXBkYXRlQXBwbHlIYW5kbGVycyA9IHZvaWQgMDtcbi8qKioqKiovIFx0XHQgICAgICB2YXIgZXJyb3JzID0gcmVzdWx0cy5tYXAoZnVuY3Rpb24ocikge1xuLyoqKioqKi8gXHRcdCAgICAgICAgcmV0dXJuIHIuZXJyb3I7XG4vKioqKioqLyBcdFx0ICAgICAgfSkuZmlsdGVyKEJvb2xlYW4pO1xuLyoqKioqKi8gXHRcdCAgICAgIGlmIChlcnJvcnMubGVuZ3RoID4gMClcbi8qKioqKiovIFx0XHQgICAgICAgIHJldHVybiBzZXRTdGF0dXMoXCJhYm9ydFwiKS50aGVuKGZ1bmN0aW9uKCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB0aHJvdyBlcnJvcnNbMF07XG4vKioqKioqLyBcdFx0ICAgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgICB2YXIgZGlzcG9zZVByb21pc2UgPSBzZXRTdGF0dXMoXCJkaXNwb3NlXCIpO1xuLyoqKioqKi8gXHRcdCAgICAgIHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihyZXN1bHQpIHtcbi8qKioqKiovIFx0XHQgICAgICAgIGlmIChyZXN1bHQuZGlzcG9zZSlcbi8qKioqKiovIFx0XHQgICAgICAgICAgcmVzdWx0LmRpc3Bvc2UoKTtcbi8qKioqKiovIFx0XHQgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgICB2YXIgYXBwbHlQcm9taXNlID0gc2V0U3RhdHVzKFwiYXBwbHlcIiksIGVycm9yLCByZXBvcnRFcnJvciA9IGZ1bmN0aW9uKGVycikge1xuLyoqKioqKi8gXHRcdCAgICAgICAgaWYgKCFlcnJvcilcbi8qKioqKiovIFx0XHQgICAgICAgICAgZXJyb3IgPSBlcnI7XG4vKioqKioqLyBcdFx0ICAgICAgfSwgb3V0ZGF0ZWRNb2R1bGVzID0gW107XG4vKioqKioqLyBcdFx0ICAgICAgcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKHJlc3VsdCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgaWYgKHJlc3VsdC5hcHBseSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB2YXIgbW9kdWxlcyA9IHJlc3VsdC5hcHBseShyZXBvcnRFcnJvcik7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGlmIChtb2R1bGVzKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwO2kgPCBtb2R1bGVzLmxlbmd0aDsgaSsrKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgb3V0ZGF0ZWRNb2R1bGVzLnB1c2gobW9kdWxlc1tpXSk7XG4vKioqKioqLyBcdFx0ICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtkaXNwb3NlUHJvbWlzZSwgYXBwbHlQcm9taXNlXSkudGhlbihmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgIGlmIChlcnJvcilcbi8qKioqKiovIFx0XHQgICAgICAgICAgcmV0dXJuIHNldFN0YXR1cyhcImZhaWxcIikudGhlbihmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICBpZiAocXVldWVkSW52YWxpZGF0ZWRNb2R1bGVzKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICByZXR1cm4gaW50ZXJuYWxBcHBseShvcHRpb25zKS50aGVuKGZ1bmN0aW9uKGxpc3QpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBvdXRkYXRlZE1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbihtb2R1bGVJZCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKGxpc3QuaW5kZXhPZihtb2R1bGVJZCkgPCAwKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBsaXN0LnB1c2gobW9kdWxlSWQpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHJldHVybiBsaXN0O1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgICAgIHJldHVybiBzZXRTdGF0dXMoXCJpZGxlXCIpLnRoZW4oZnVuY3Rpb24oKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHJldHVybiBvdXRkYXRlZE1vZHVsZXM7XG4vKioqKioqLyBcdFx0ICAgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgfVxuLyoqKioqKi8gXHRcdCAgICBmdW5jdGlvbiBhcHBseUludmFsaWRhdGVkTW9kdWxlcygpIHtcbi8qKioqKiovIFx0XHQgICAgICBpZiAocXVldWVkSW52YWxpZGF0ZWRNb2R1bGVzKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICBpZiAoIWN1cnJlbnRVcGRhdGVBcHBseUhhbmRsZXJzKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICBjdXJyZW50VXBkYXRlQXBwbHlIYW5kbGVycyA9IFtdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgT2JqZWN0LmtleXMoX193ZWJwYWNrX3JlcXVpcmVfXy5obXJJKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBxdWV1ZWRJbnZhbGlkYXRlZE1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbihtb2R1bGVJZCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIF9fd2VicGFja19yZXF1aXJlX18uaG1ySVtrZXldKG1vZHVsZUlkLCBjdXJyZW50VXBkYXRlQXBwbHlIYW5kbGVycyk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICBxdWV1ZWRJbnZhbGlkYXRlZE1vZHVsZXMgPSB2b2lkIDA7XG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4gITA7XG4vKioqKioqLyBcdFx0ICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICB9XG4vKioqKioqLyBcdFx0ICBcbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8qIHdlYnBhY2svcnVudGltZS9wdWJsaWNQYXRoICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCIvX25leHQvXCI7XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvKiB3ZWJwYWNrL3J1bnRpbWUvcmVhY3QgcmVmcmVzaCAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdGlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmkpIHtcbi8qKioqKiovIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmkucHVzaCgob3B0aW9ucykgPT4ge1xuLyoqKioqKi8gXHRcdFx0Y29uc3Qgb3JpZ2luYWxGYWN0b3J5ID0gb3B0aW9ucy5mYWN0b3J5O1xuLyoqKioqKi8gXHRcdFx0b3B0aW9ucy5mYWN0b3J5ID0gKG1vZHVsZU9iamVjdCwgbW9kdWxlRXhwb3J0cywgd2VicGFja1JlcXVpcmUpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0Y29uc3QgaGFzUmVmcmVzaCA9IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmICEhc2VsZi4kUmVmcmVzaEludGVyY2VwdE1vZHVsZUV4ZWN1dGlvbiQ7XG4vKioqKioqLyBcdFx0XHRcdGNvbnN0IGNsZWFudXAgPSBoYXNSZWZyZXNoID8gc2VsZi4kUmVmcmVzaEludGVyY2VwdE1vZHVsZUV4ZWN1dGlvbiQobW9kdWxlT2JqZWN0LmlkKSA6ICgpID0+IHt9O1xuLyoqKioqKi8gXHRcdFx0XHR0cnkge1xuLyoqKioqKi8gXHRcdFx0XHRcdG9yaWdpbmFsRmFjdG9yeS5jYWxsKHRoaXMsIG1vZHVsZU9iamVjdCwgbW9kdWxlRXhwb3J0cywgd2VicGFja1JlcXVpcmUpO1xuLyoqKioqKi8gXHRcdFx0XHR9IGZpbmFsbHkge1xuLyoqKioqKi8gXHRcdFx0XHRcdGNsZWFudXAoKTtcbi8qKioqKiovIFx0XHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdH0pXG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0Lyogd2VicGFjay9ydW50aW1lL2NvbXBhdCAqL1xuLyoqKioqKi8gXHRcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8vIG5vb3AgZm5zIHRvIHByZXZlbnQgcnVudGltZSBlcnJvcnMgZHVyaW5nIGluaXRpYWxpemF0aW9uXG4vKioqKioqLyBcdGlmICh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIikge1xuLyoqKioqKi8gXHRcdHNlbGYuJFJlZnJlc2hSZWckID0gZnVuY3Rpb24gKCkge307XG4vKioqKioqLyBcdFx0c2VsZi4kUmVmcmVzaFNpZyQgPSBmdW5jdGlvbiAoKSB7XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gZnVuY3Rpb24gKHR5cGUpIHtcbi8qKioqKiovIFx0XHRcdFx0cmV0dXJuIHR5cGU7XG4vKioqKioqLyBcdFx0XHR9O1xuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdH1cbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8qIHdlYnBhY2svcnVudGltZS9jc3MgbG9hZGluZyAqL1xuLyoqKioqKi8gXHQoKCkgPT4ge1xuLyoqKioqKi8gXHRcdHZhciBjcmVhdGVTdHlsZXNoZWV0ID0gKGNodW5rSWQsIGZ1bGxocmVmLCByZXNvbHZlLCByZWplY3QpID0+IHtcbi8qKioqKiovIFx0XHRcdHZhciBsaW5rVGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4vKioqKioqLyBcdFx0XG4vKioqKioqLyBcdFx0XHRsaW5rVGFnLnJlbCA9IFwic3R5bGVzaGVldFwiO1xuLyoqKioqKi8gXHRcdFx0bGlua1RhZy50eXBlID0gXCJ0ZXh0L2Nzc1wiO1xuLyoqKioqKi8gXHRcdFx0dmFyIG9uTGlua0NvbXBsZXRlID0gKGV2ZW50KSA9PiB7XG4vKioqKioqLyBcdFx0XHRcdC8vIGF2b2lkIG1lbSBsZWFrcy5cbi8qKioqKiovIFx0XHRcdFx0bGlua1RhZy5vbmVycm9yID0gbGlua1RhZy5vbmxvYWQgPSBudWxsO1xuLyoqKioqKi8gXHRcdFx0XHRpZiAoZXZlbnQudHlwZSA9PT0gJ2xvYWQnKSB7XG4vKioqKioqLyBcdFx0XHRcdFx0cmVzb2x2ZSgpO1xuLyoqKioqKi8gXHRcdFx0XHR9IGVsc2Uge1xuLyoqKioqKi8gXHRcdFx0XHRcdHZhciBlcnJvclR5cGUgPSBldmVudCAmJiAoZXZlbnQudHlwZSA9PT0gJ2xvYWQnID8gJ21pc3NpbmcnIDogZXZlbnQudHlwZSk7XG4vKioqKioqLyBcdFx0XHRcdFx0dmFyIHJlYWxIcmVmID0gZXZlbnQgJiYgZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5ocmVmIHx8IGZ1bGxocmVmO1xuLyoqKioqKi8gXHRcdFx0XHRcdHZhciBlcnIgPSBuZXcgRXJyb3IoXCJMb2FkaW5nIENTUyBjaHVuayBcIiArIGNodW5rSWQgKyBcIiBmYWlsZWQuXFxuKFwiICsgcmVhbEhyZWYgKyBcIilcIik7XG4vKioqKioqLyBcdFx0XHRcdFx0ZXJyLmNvZGUgPSBcIkNTU19DSFVOS19MT0FEX0ZBSUxFRFwiO1xuLyoqKioqKi8gXHRcdFx0XHRcdGVyci50eXBlID0gZXJyb3JUeXBlO1xuLyoqKioqKi8gXHRcdFx0XHRcdGVyci5yZXF1ZXN0ID0gcmVhbEhyZWY7XG4vKioqKioqLyBcdFx0XHRcdFx0bGlua1RhZy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpbmtUYWcpXG4vKioqKioqLyBcdFx0XHRcdFx0cmVqZWN0KGVycik7XG4vKioqKioqLyBcdFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdGxpbmtUYWcub25lcnJvciA9IGxpbmtUYWcub25sb2FkID0gb25MaW5rQ29tcGxldGU7XG4vKioqKioqLyBcdFx0XHRsaW5rVGFnLmhyZWYgPSBmdWxsaHJlZjtcbi8qKioqKiovIFx0XHRcbi8qKioqKiovIFx0XHRcdChmdW5jdGlvbihsaW5rVGFnKSB7XG4vKioqKioqLyBcdFx0XHQgICAgICAgICAgaWYgKHR5cGVvZiBfTl9FX1NUWUxFX0xPQUQgPT09IFwiZnVuY3Rpb25cIikge1xuLyoqKioqKi8gXHRcdFx0ICAgICAgICAgICAgY29uc3QgeyBocmVmLCBvbmxvYWQsIG9uZXJyb3IgfSA9IGxpbmtUYWc7XG4vKioqKioqLyBcdFx0XHQgICAgICAgICAgICBfTl9FX1NUWUxFX0xPQUQoaHJlZi5pbmRleE9mKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pID09PSAwID8gbmV3IFVSTChocmVmKS5wYXRobmFtZSA6IGhyZWYpLnRoZW4oKCkgPT4gb25sb2FkID09IG51bGwgPyB2b2lkIDAgOiBvbmxvYWQuY2FsbChsaW5rVGFnLCB7XG4vKioqKioqLyBcdFx0XHQgICAgICAgICAgICAgIHR5cGU6IFwibG9hZFwiXG4vKioqKioqLyBcdFx0XHQgICAgICAgICAgICB9KSwgKCkgPT4gb25lcnJvciA9PSBudWxsID8gdm9pZCAwIDogb25lcnJvci5jYWxsKGxpbmtUYWcsIHt9KSk7XG4vKioqKioqLyBcdFx0XHQgICAgICAgICAgfSBlbHNlXG4vKioqKioqLyBcdFx0XHQgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmtUYWcpO1xuLyoqKioqKi8gXHRcdFx0ICAgICAgICB9KShsaW5rVGFnKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGxpbmtUYWc7XG4vKioqKioqLyBcdFx0fTtcbi8qKioqKiovIFx0XHR2YXIgZmluZFN0eWxlc2hlZXQgPSAoaHJlZiwgZnVsbGhyZWYpID0+IHtcbi8qKioqKiovIFx0XHRcdHZhciBleGlzdGluZ0xpbmtUYWdzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaW5rXCIpO1xuLyoqKioqKi8gXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGV4aXN0aW5nTGlua1RhZ3MubGVuZ3RoOyBpKyspIHtcbi8qKioqKiovIFx0XHRcdFx0dmFyIHRhZyA9IGV4aXN0aW5nTGlua1RhZ3NbaV07XG4vKioqKioqLyBcdFx0XHRcdHZhciBkYXRhSHJlZiA9IHRhZy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWhyZWZcIikgfHwgdGFnLmdldEF0dHJpYnV0ZShcImhyZWZcIik7XG4vKioqKioqLyBcdFx0XHRcdGlmKHRhZy5yZWwgPT09IFwic3R5bGVzaGVldFwiICYmIChkYXRhSHJlZiA9PT0gaHJlZiB8fCBkYXRhSHJlZiA9PT0gZnVsbGhyZWYpKSByZXR1cm4gdGFnO1xuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0dmFyIGV4aXN0aW5nU3R5bGVUYWdzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdHlsZVwiKTtcbi8qKioqKiovIFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBleGlzdGluZ1N0eWxlVGFncy5sZW5ndGg7IGkrKykge1xuLyoqKioqKi8gXHRcdFx0XHR2YXIgdGFnID0gZXhpc3RpbmdTdHlsZVRhZ3NbaV07XG4vKioqKioqLyBcdFx0XHRcdHZhciBkYXRhSHJlZiA9IHRhZy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWhyZWZcIik7XG4vKioqKioqLyBcdFx0XHRcdGlmKGRhdGFIcmVmID09PSBocmVmIHx8IGRhdGFIcmVmID09PSBmdWxsaHJlZikgcmV0dXJuIHRhZztcbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHR9O1xuLyoqKioqKi8gXHRcdHZhciBsb2FkU3R5bGVzaGVldCA9IChjaHVua0lkKSA9PiB7XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0XHR2YXIgaHJlZiA9IF9fd2VicGFja19yZXF1aXJlX18ubWluaUNzc0YoY2h1bmtJZCk7XG4vKioqKioqLyBcdFx0XHRcdHZhciBmdWxsaHJlZiA9IF9fd2VicGFja19yZXF1aXJlX18ucCArIGhyZWY7XG4vKioqKioqLyBcdFx0XHRcdGlmKGZpbmRTdHlsZXNoZWV0KGhyZWYsIGZ1bGxocmVmKSkgcmV0dXJuIHJlc29sdmUoKTtcbi8qKioqKiovIFx0XHRcdFx0Y3JlYXRlU3R5bGVzaGVldChjaHVua0lkLCBmdWxsaHJlZiwgcmVzb2x2ZSwgcmVqZWN0KTtcbi8qKioqKiovIFx0XHRcdH0pO1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0XHQvLyBubyBjaHVuayBsb2FkaW5nXG4vKioqKioqLyBcdFx0XG4vKioqKioqLyBcdFx0dmFyIG9sZFRhZ3MgPSBbXTtcbi8qKioqKiovIFx0XHR2YXIgbmV3VGFncyA9IFtdO1xuLyoqKioqKi8gXHRcdHZhciBhcHBseUhhbmRsZXIgPSAob3B0aW9ucykgPT4ge1xuLyoqKioqKi8gXHRcdFx0cmV0dXJuIHsgZGlzcG9zZTogKCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgb2xkVGFncy5sZW5ndGg7IGkrKykge1xuLyoqKioqKi8gXHRcdFx0XHRcdHZhciBvbGRUYWcgPSBvbGRUYWdzW2ldO1xuLyoqKioqKi8gXHRcdFx0XHRcdGlmKG9sZFRhZy5wYXJlbnROb2RlKSBvbGRUYWcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvbGRUYWcpO1xuLyoqKioqKi8gXHRcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRcdG9sZFRhZ3MubGVuZ3RoID0gMDtcbi8qKioqKiovIFx0XHRcdH0sIGFwcGx5OiAoKSA9PiB7XG4vKioqKioqLyBcdFx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBuZXdUYWdzLmxlbmd0aDsgaSsrKSBuZXdUYWdzW2ldLnJlbCA9IFwic3R5bGVzaGVldFwiO1xuLyoqKioqKi8gXHRcdFx0XHRuZXdUYWdzLmxlbmd0aCA9IDA7XG4vKioqKioqLyBcdFx0XHR9IH07XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHRcdF9fd2VicGFja19yZXF1aXJlX18uaG1yQy5taW5pQ3NzID0gKGNodW5rSWRzLCByZW1vdmVkQ2h1bmtzLCByZW1vdmVkTW9kdWxlcywgcHJvbWlzZXMsIGFwcGx5SGFuZGxlcnMsIHVwZGF0ZWRNb2R1bGVzTGlzdCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0YXBwbHlIYW5kbGVycy5wdXNoKGFwcGx5SGFuZGxlcik7XG4vKioqKioqLyBcdFx0XHRjaHVua0lkcy5mb3JFYWNoKChjaHVua0lkKSA9PiB7XG4vKioqKioqLyBcdFx0XHRcdHZhciBocmVmID0gX193ZWJwYWNrX3JlcXVpcmVfXy5taW5pQ3NzRihjaHVua0lkKTtcbi8qKioqKiovIFx0XHRcdFx0dmFyIGZ1bGxocmVmID0gX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgaHJlZjtcbi8qKioqKiovIFx0XHRcdFx0dmFyIG9sZFRhZyA9IGZpbmRTdHlsZXNoZWV0KGhyZWYsIGZ1bGxocmVmKTtcbi8qKioqKiovIFx0XHRcdFx0aWYoIW9sZFRhZykgcmV0dXJuO1xuLyoqKioqKi8gXHRcdFx0XHRwcm9taXNlcy5wdXNoKG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0XHR2YXIgdGFnID0gY3JlYXRlU3R5bGVzaGVldChjaHVua0lkLCBmdWxsaHJlZiwgKCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0dGFnLmFzID0gXCJzdHlsZVwiO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0dGFnLnJlbCA9IFwicHJlbG9hZFwiO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0cmVzb2x2ZSgpO1xuLyoqKioqKi8gXHRcdFx0XHRcdH0sIHJlamVjdCk7XG4vKioqKioqLyBcdFx0XHRcdFx0b2xkVGFncy5wdXNoKG9sZFRhZyk7XG4vKioqKioqLyBcdFx0XHRcdFx0bmV3VGFncy5wdXNoKHRhZyk7XG4vKioqKioqLyBcdFx0XHRcdH0pKTtcbi8qKioqKiovIFx0XHRcdH0pO1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIFx0XG4vKioqKioqLyBcdC8qIHdlYnBhY2svcnVudGltZS9qc29ucCBjaHVuayBsb2FkaW5nICovXG4vKioqKioqLyBcdCgoKSA9PiB7XG4vKioqKioqLyBcdFx0Ly8gbm8gYmFzZVVSSVxuLyoqKioqKi8gXHRcdFxuLyoqKioqKi8gXHRcdC8vIG9iamVjdCB0byBzdG9yZSBsb2FkZWQgYW5kIGxvYWRpbmcgY2h1bmtzXG4vKioqKioqLyBcdFx0Ly8gdW5kZWZpbmVkID0gY2h1bmsgbm90IGxvYWRlZCwgbnVsbCA9IGNodW5rIHByZWxvYWRlZC9wcmVmZXRjaGVkXG4vKioqKioqLyBcdFx0Ly8gW3Jlc29sdmUsIHJlamVjdCwgUHJvbWlzZV0gPSBjaHVuayBsb2FkaW5nLCAwID0gY2h1bmsgbG9hZGVkXG4vKioqKioqLyBcdFx0dmFyIGluc3RhbGxlZENodW5rcyA9IF9fd2VicGFja19yZXF1aXJlX18uaG1yU19qc29ucCA9IF9fd2VicGFja19yZXF1aXJlX18uaG1yU19qc29ucCB8fCB7XG4vKioqKioqLyBcdFx0XHRcIndlYnBhY2tcIjogMFxuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdFx0XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5mLmogPSAoY2h1bmtJZCwgcHJvbWlzZXMpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0Ly8gSlNPTlAgY2h1bmsgbG9hZGluZyBmb3IgamF2YXNjcmlwdFxuLyoqKioqKi8gXHRcdFx0XHR2YXIgaW5zdGFsbGVkQ2h1bmtEYXRhID0gX193ZWJwYWNrX3JlcXVpcmVfXy5vKGluc3RhbGxlZENodW5rcywgY2h1bmtJZCkgPyBpbnN0YWxsZWRDaHVua3NbY2h1bmtJZF0gOiB1bmRlZmluZWQ7XG4vKioqKioqLyBcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rRGF0YSAhPT0gMCkgeyAvLyAwIG1lYW5zIFwiYWxyZWFkeSBpbnN0YWxsZWRcIi5cbi8qKioqKiovIFx0XHRcbi8qKioqKiovIFx0XHRcdFx0XHQvLyBhIFByb21pc2UgbWVhbnMgXCJjdXJyZW50bHkgbG9hZGluZ1wiLlxuLyoqKioqKi8gXHRcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rRGF0YSkge1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0cHJvbWlzZXMucHVzaChpbnN0YWxsZWRDaHVua0RhdGFbMl0pO1xuLyoqKioqKi8gXHRcdFx0XHRcdH0gZWxzZSB7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRpZihcIndlYnBhY2tcIiAhPSBjaHVua0lkKSB7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdC8vIHNldHVwIFByb21pc2UgaW4gY2h1bmsgY2FjaGVcbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0dmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiAoaW5zdGFsbGVkQ2h1bmtEYXRhID0gaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gW3Jlc29sdmUsIHJlamVjdF0pKTtcbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0cHJvbWlzZXMucHVzaChpbnN0YWxsZWRDaHVua0RhdGFbMl0gPSBwcm9taXNlKTtcbi8qKioqKiovIFx0XHRcbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0Ly8gc3RhcnQgY2h1bmsgbG9hZGluZ1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0XHR2YXIgdXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5wICsgX193ZWJwYWNrX3JlcXVpcmVfXy51KGNodW5rSWQpO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0XHQvLyBjcmVhdGUgZXJyb3IgYmVmb3JlIHN0YWNrIHVud291bmQgdG8gZ2V0IHVzZWZ1bCBzdGFja3RyYWNlIGxhdGVyXG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdHZhciBlcnJvciA9IG5ldyBFcnJvcigpO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0XHR2YXIgbG9hZGluZ0VuZGVkID0gKGV2ZW50KSA9PiB7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGluc3RhbGxlZENodW5rcywgY2h1bmtJZCkpIHtcbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0XHRcdGluc3RhbGxlZENodW5rRGF0YSA9IGluc3RhbGxlZENodW5rc1tjaHVua0lkXTtcbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0XHRcdGlmKGluc3RhbGxlZENodW5rRGF0YSAhPT0gMCkgaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdID0gdW5kZWZpbmVkO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0XHRcdFx0aWYoaW5zdGFsbGVkQ2h1bmtEYXRhKSB7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdFx0XHRcdHZhciBlcnJvclR5cGUgPSBldmVudCAmJiAoZXZlbnQudHlwZSA9PT0gJ2xvYWQnID8gJ21pc3NpbmcnIDogZXZlbnQudHlwZSk7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdFx0XHRcdHZhciByZWFsU3JjID0gZXZlbnQgJiYgZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5zcmM7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdFx0XHRcdGVycm9yLm1lc3NhZ2UgPSAnTG9hZGluZyBjaHVuayAnICsgY2h1bmtJZCArICcgZmFpbGVkLlxcbignICsgZXJyb3JUeXBlICsgJzogJyArIHJlYWxTcmMgKyAnKSc7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdFx0XHRcdGVycm9yLm5hbWUgPSAnQ2h1bmtMb2FkRXJyb3InO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0XHRcdFx0XHRlcnJvci50eXBlID0gZXJyb3JUeXBlO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0XHRcdFx0XHRlcnJvci5yZXF1ZXN0ID0gcmVhbFNyYztcbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0XHRcdFx0aW5zdGFsbGVkQ2h1bmtEYXRhWzFdKGVycm9yKTtcbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdFx0XHRcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdH07XG4vKioqKioqLyBcdFx0XHRcdFx0XHRcdF9fd2VicGFja19yZXF1aXJlX18ubCh1cmwsIGxvYWRpbmdFbmRlZCwgXCJjaHVuay1cIiArIGNodW5rSWQsIGNodW5rSWQpO1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0fSBlbHNlIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4vKioqKioqLyBcdFx0XHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0XHR9XG4vKioqKioqLyBcdFx0fTtcbi8qKioqKiovIFx0XHRcbi8qKioqKiovIFx0XHQvLyBubyBwcmVmZXRjaGluZ1xuLyoqKioqKi8gXHRcdFxuLyoqKioqKi8gXHRcdC8vIG5vIHByZWxvYWRlZFxuLyoqKioqKi8gXHRcdFxuLyoqKioqKi8gXHRcdHZhciBjdXJyZW50VXBkYXRlZE1vZHVsZXNMaXN0O1xuLyoqKioqKi8gXHRcdHZhciB3YWl0aW5nVXBkYXRlUmVzb2x2ZXMgPSB7fTtcbi8qKioqKiovIFx0XHRmdW5jdGlvbiBsb2FkVXBkYXRlQ2h1bmsoY2h1bmtJZCwgdXBkYXRlZE1vZHVsZXNMaXN0KSB7XG4vKioqKioqLyBcdFx0XHRjdXJyZW50VXBkYXRlZE1vZHVsZXNMaXN0ID0gdXBkYXRlZE1vZHVsZXNMaXN0O1xuLyoqKioqKi8gXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0d2FpdGluZ1VwZGF0ZVJlc29sdmVzW2NodW5rSWRdID0gcmVzb2x2ZTtcbi8qKioqKiovIFx0XHRcdFx0Ly8gc3RhcnQgdXBkYXRlIGNodW5rIGxvYWRpbmdcbi8qKioqKiovIFx0XHRcdFx0dmFyIHVybCA9IF9fd2VicGFja19yZXF1aXJlX18ucCArIF9fd2VicGFja19yZXF1aXJlX18uaHUoY2h1bmtJZCk7XG4vKioqKioqLyBcdFx0XHRcdC8vIGNyZWF0ZSBlcnJvciBiZWZvcmUgc3RhY2sgdW53b3VuZCB0byBnZXQgdXNlZnVsIHN0YWNrdHJhY2UgbGF0ZXJcbi8qKioqKiovIFx0XHRcdFx0dmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4vKioqKioqLyBcdFx0XHRcdHZhciBsb2FkaW5nRW5kZWQgPSAoZXZlbnQpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0XHRpZih3YWl0aW5nVXBkYXRlUmVzb2x2ZXNbY2h1bmtJZF0pIHtcbi8qKioqKiovIFx0XHRcdFx0XHRcdHdhaXRpbmdVcGRhdGVSZXNvbHZlc1tjaHVua0lkXSA9IHVuZGVmaW5lZFxuLyoqKioqKi8gXHRcdFx0XHRcdFx0dmFyIGVycm9yVHlwZSA9IGV2ZW50ICYmIChldmVudC50eXBlID09PSAnbG9hZCcgPyAnbWlzc2luZycgOiBldmVudC50eXBlKTtcbi8qKioqKiovIFx0XHRcdFx0XHRcdHZhciByZWFsU3JjID0gZXZlbnQgJiYgZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldC5zcmM7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRlcnJvci5tZXNzYWdlID0gJ0xvYWRpbmcgaG90IHVwZGF0ZSBjaHVuayAnICsgY2h1bmtJZCArICcgZmFpbGVkLlxcbignICsgZXJyb3JUeXBlICsgJzogJyArIHJlYWxTcmMgKyAnKSc7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRlcnJvci5uYW1lID0gJ0NodW5rTG9hZEVycm9yJztcbi8qKioqKiovIFx0XHRcdFx0XHRcdGVycm9yLnR5cGUgPSBlcnJvclR5cGU7XG4vKioqKioqLyBcdFx0XHRcdFx0XHRlcnJvci5yZXF1ZXN0ID0gcmVhbFNyYztcbi8qKioqKiovIFx0XHRcdFx0XHRcdHJlamVjdChlcnJvcik7XG4vKioqKioqLyBcdFx0XHRcdFx0fVxuLyoqKioqKi8gXHRcdFx0XHR9O1xuLyoqKioqKi8gXHRcdFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmwodXJsLCBsb2FkaW5nRW5kZWQpO1xuLyoqKioqKi8gXHRcdFx0fSk7XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHRcdFxuLyoqKioqKi8gXHRcdHNlbGZbXCJ3ZWJwYWNrSG90VXBkYXRlX05fRVwiXSA9IChjaHVua0lkLCBtb3JlTW9kdWxlcywgcnVudGltZSkgPT4ge1xuLyoqKioqKi8gXHRcdFx0Zm9yKHZhciBtb2R1bGVJZCBpbiBtb3JlTW9kdWxlcykge1xuLyoqKioqKi8gXHRcdFx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuLyoqKioqKi8gXHRcdFx0XHRcdGN1cnJlbnRVcGRhdGVbbW9kdWxlSWRdID0gbW9yZU1vZHVsZXNbbW9kdWxlSWRdO1xuLyoqKioqKi8gXHRcdFx0XHRcdGlmKGN1cnJlbnRVcGRhdGVkTW9kdWxlc0xpc3QpIGN1cnJlbnRVcGRhdGVkTW9kdWxlc0xpc3QucHVzaChtb2R1bGVJZCk7XG4vKioqKioqLyBcdFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdGlmKHJ1bnRpbWUpIGN1cnJlbnRVcGRhdGVSdW50aW1lLnB1c2gocnVudGltZSk7XG4vKioqKioqLyBcdFx0XHRpZih3YWl0aW5nVXBkYXRlUmVzb2x2ZXNbY2h1bmtJZF0pIHtcbi8qKioqKiovIFx0XHRcdFx0d2FpdGluZ1VwZGF0ZVJlc29sdmVzW2NodW5rSWRdKCk7XG4vKioqKioqLyBcdFx0XHRcdHdhaXRpbmdVcGRhdGVSZXNvbHZlc1tjaHVua0lkXSA9IHVuZGVmaW5lZDtcbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHR9O1xuLyoqKioqKi8gXHRcdFxuLyoqKioqKi8gXHRcdCAgICB2YXIgY3VycmVudFVwZGF0ZUNodW5rcywgY3VycmVudFVwZGF0ZSwgY3VycmVudFVwZGF0ZVJlbW92ZWRDaHVua3MsIGN1cnJlbnRVcGRhdGVSdW50aW1lO1xuLyoqKioqKi8gXHRcdCAgICBmdW5jdGlvbiBhcHBseUhhbmRsZXIob3B0aW9ucykge1xuLyoqKioqKi8gXHRcdCAgICAgIGlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmYpXG4vKioqKioqLyBcdFx0ICAgICAgICBkZWxldGUgX193ZWJwYWNrX3JlcXVpcmVfXy5mLmpzb25wSG1yO1xuLyoqKioqKi8gXHRcdCAgICAgIGN1cnJlbnRVcGRhdGVDaHVua3MgPSB2b2lkIDA7XG4vKioqKioqLyBcdFx0ICAgICAgZnVuY3Rpb24gZ2V0QWZmZWN0ZWRNb2R1bGVFZmZlY3RzKHVwZGF0ZU1vZHVsZUlkKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICB2YXIgb3V0ZGF0ZWRNb2R1bGVzID0gW3VwZGF0ZU1vZHVsZUlkXSwgb3V0ZGF0ZWREZXBlbmRlbmNpZXMgPSB7fSwgcXVldWUgPSBvdXRkYXRlZE1vZHVsZXMubWFwKGZ1bmN0aW9uKGlkKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHJldHVybiB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgY2hhaW46IFtpZF0sXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaWRcbi8qKioqKiovIFx0XHQgICAgICAgICAgfTtcbi8qKioqKiovIFx0XHQgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgdmFyIHF1ZXVlSXRlbSA9IHF1ZXVlLnBvcCgpLCBtb2R1bGVJZCA9IHF1ZXVlSXRlbS5pZCwgY2hhaW4gPSBxdWV1ZUl0ZW0uY2hhaW4sIG1vZHVsZSA9IF9fd2VicGFja19yZXF1aXJlX18uY1ttb2R1bGVJZF07XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGlmICghbW9kdWxlIHx8IG1vZHVsZS5ob3QuX3NlbGZBY2NlcHRlZCAmJiAhbW9kdWxlLmhvdC5fc2VsZkludmFsaWRhdGVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNvbnRpbnVlO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAobW9kdWxlLmhvdC5fc2VsZkRlY2xpbmVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHJldHVybiB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICB0eXBlOiBcInNlbGYtZGVjbGluZWRcIixcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGNoYWluLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgbW9kdWxlSWRcbi8qKioqKiovIFx0XHQgICAgICAgICAgICB9O1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAobW9kdWxlLmhvdC5fbWFpbilcbi8qKioqKiovIFx0XHQgICAgICAgICAgICByZXR1cm4ge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgdHlwZTogXCJ1bmFjY2VwdGVkXCIsXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBjaGFpbixcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIG1vZHVsZUlkXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgfTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgZm9yICh2YXIgaSA9IDA7aSA8IG1vZHVsZS5wYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgdmFyIHBhcmVudElkID0gbW9kdWxlLnBhcmVudHNbaV0sIHBhcmVudCA9IF9fd2VicGFja19yZXF1aXJlX18uY1twYXJlbnRJZF07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaWYgKCFwYXJlbnQpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBjb250aW51ZTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBpZiAocGFyZW50LmhvdC5fZGVjbGluZWREZXBlbmRlbmNpZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgcmV0dXJuIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgdHlwZTogXCJkZWNsaW5lZFwiLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBjaGFpbjogY2hhaW4uY29uY2F0KFtwYXJlbnRJZF0pLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBtb2R1bGVJZCxcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgcGFyZW50SWRcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIH07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaWYgKG91dGRhdGVkTW9kdWxlcy5pbmRleE9mKHBhcmVudElkKSAhPT0gLTEpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBjb250aW51ZTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBpZiAocGFyZW50LmhvdC5fYWNjZXB0ZWREZXBlbmRlbmNpZXNbbW9kdWxlSWRdKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpZiAoIW91dGRhdGVkRGVwZW5kZW5jaWVzW3BhcmVudElkXSlcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgb3V0ZGF0ZWREZXBlbmRlbmNpZXNbcGFyZW50SWRdID0gW107XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBhZGRBbGxUb1NldChvdXRkYXRlZERlcGVuZGVuY2llc1twYXJlbnRJZF0sIFttb2R1bGVJZF0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgY29udGludWU7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGRlbGV0ZSBvdXRkYXRlZERlcGVuZGVuY2llc1twYXJlbnRJZF07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgb3V0ZGF0ZWRNb2R1bGVzLnB1c2gocGFyZW50SWQpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHF1ZXVlLnB1c2goe1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgY2hhaW46IGNoYWluLmNvbmNhdChbcGFyZW50SWRdKSxcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGlkOiBwYXJlbnRJZFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4ge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB0eXBlOiBcImFjY2VwdGVkXCIsXG4vKioqKioqLyBcdFx0ICAgICAgICAgIG1vZHVsZUlkOiB1cGRhdGVNb2R1bGVJZCxcbi8qKioqKiovIFx0XHQgICAgICAgICAgb3V0ZGF0ZWRNb2R1bGVzLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICBvdXRkYXRlZERlcGVuZGVuY2llc1xuLyoqKioqKi8gXHRcdCAgICAgICAgfTtcbi8qKioqKiovIFx0XHQgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgZnVuY3Rpb24gYWRkQWxsVG9TZXQoYSwgYikge1xuLyoqKioqKi8gXHRcdCAgICAgICAgZm9yICh2YXIgaSA9IDA7aSA8IGIubGVuZ3RoOyBpKyspIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgdmFyIGl0ZW0gPSBiW2ldO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoYS5pbmRleE9mKGl0ZW0pID09PSAtMSlcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBhLnB1c2goaXRlbSk7XG4vKioqKioqLyBcdFx0ICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgIHZhciBvdXRkYXRlZERlcGVuZGVuY2llcyA9IHt9LCBvdXRkYXRlZE1vZHVsZXMgPSBbXSwgYXBwbGllZFVwZGF0ZSA9IHt9LCB3YXJuVW5leHBlY3RlZFJlcXVpcmUgPSBmdW5jdGlvbiB3YXJuVW5leHBlY3RlZFJlcXVpcmUobW9kdWxlKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICBjb25zb2xlLndhcm4oXCJbSE1SXSB1bmV4cGVjdGVkIHJlcXVpcmUoXCIgKyBtb2R1bGUuaWQgKyBcIikgdG8gZGlzcG9zZWQgbW9kdWxlXCIpO1xuLyoqKioqKi8gXHRcdCAgICAgIH07XG4vKioqKioqLyBcdFx0ICAgICAgZm9yICh2YXIgbW9kdWxlSWQgaW4gY3VycmVudFVwZGF0ZSlcbi8qKioqKiovIFx0XHQgICAgICAgIGlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLm8oY3VycmVudFVwZGF0ZSwgbW9kdWxlSWQpKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHZhciBuZXdNb2R1bGVGYWN0b3J5ID0gY3VycmVudFVwZGF0ZVttb2R1bGVJZF0sIHJlc3VsdCA9IG5ld01vZHVsZUZhY3RvcnkgPyBnZXRBZmZlY3RlZE1vZHVsZUVmZmVjdHMobW9kdWxlSWQpIDoge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHR5cGU6IFwiZGlzcG9zZWRcIixcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBtb2R1bGVJZFxuLyoqKioqKi8gXHRcdCAgICAgICAgICB9LCBhYm9ydEVycm9yID0gITEsIGRvQXBwbHkgPSAhMSwgZG9EaXNwb3NlID0gITEsIGNoYWluSW5mbyA9IFwiXCI7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIGlmIChyZXN1bHQuY2hhaW4pXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgY2hhaW5JbmZvID0gYFxuLyoqKioqKi8gXHRcdFVwZGF0ZSBwcm9wYWdhdGlvbjogYCArIHJlc3VsdC5jaGFpbi5qb2luKFwiIC0+IFwiKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgc3dpdGNoIChyZXN1bHQudHlwZSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNhc2UgXCJzZWxmLWRlY2xpbmVkXCI6XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vbkRlY2xpbmVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBvcHRpb25zLm9uRGVjbGluZWQocmVzdWx0KTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVEZWNsaW5lZClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgYWJvcnRFcnJvciA9IG5ldyBFcnJvcihcIkFib3J0ZWQgYmVjYXVzZSBvZiBzZWxmIGRlY2xpbmU6IFwiICsgcmVzdWx0Lm1vZHVsZUlkICsgY2hhaW5JbmZvKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGJyZWFrO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNhc2UgXCJkZWNsaW5lZFwiOlxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25EZWNsaW5lZClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgb3B0aW9ucy5vbkRlY2xpbmVkKHJlc3VsdCk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuaWdub3JlRGVjbGluZWQpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIGFib3J0RXJyb3IgPSBuZXcgRXJyb3IoXCJBYm9ydGVkIGJlY2F1c2Ugb2YgZGVjbGluZWQgZGVwZW5kZW5jeTogXCIgKyByZXN1bHQubW9kdWxlSWQgKyBcIiBpbiBcIiArIHJlc3VsdC5wYXJlbnRJZCArIGNoYWluSW5mbyk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBicmVhaztcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBjYXNlIFwidW5hY2NlcHRlZFwiOlxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25VbmFjY2VwdGVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBvcHRpb25zLm9uVW5hY2NlcHRlZChyZXN1bHQpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVVuYWNjZXB0ZWQpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIGFib3J0RXJyb3IgPSBuZXcgRXJyb3IoXCJBYm9ydGVkIGJlY2F1c2UgXCIgKyBtb2R1bGVJZCArIFwiIGlzIG5vdCBhY2NlcHRlZFwiICsgY2hhaW5JbmZvKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGJyZWFrO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGNhc2UgXCJhY2NlcHRlZFwiOlxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25BY2NlcHRlZClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgb3B0aW9ucy5vbkFjY2VwdGVkKHJlc3VsdCk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBkb0FwcGx5ID0gITA7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBicmVhaztcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBjYXNlIFwiZGlzcG9zZWRcIjpcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uRGlzcG9zZWQpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIG9wdGlvbnMub25EaXNwb3NlZChyZXN1bHQpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgZG9EaXNwb3NlID0gITA7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBicmVhaztcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBkZWZhdWx0OlxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leGNlcHRpb24gdHlwZSBcIiArIHJlc3VsdC50eXBlKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoYWJvcnRFcnJvcilcbi8qKioqKiovIFx0XHQgICAgICAgICAgICByZXR1cm4ge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgZXJyb3I6IGFib3J0RXJyb3Jcbi8qKioqKiovIFx0XHQgICAgICAgICAgICB9O1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoZG9BcHBseSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGFwcGxpZWRVcGRhdGVbbW9kdWxlSWRdID0gbmV3TW9kdWxlRmFjdG9yeTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBhZGRBbGxUb1NldChvdXRkYXRlZE1vZHVsZXMsIHJlc3VsdC5vdXRkYXRlZE1vZHVsZXMpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGZvciAobW9kdWxlSWQgaW4gcmVzdWx0Lm91dGRhdGVkRGVwZW5kZW5jaWVzKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKF9fd2VicGFja19yZXF1aXJlX18ubyhyZXN1bHQub3V0ZGF0ZWREZXBlbmRlbmNpZXMsIG1vZHVsZUlkKSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBpZiAoIW91dGRhdGVkRGVwZW5kZW5jaWVzW21vZHVsZUlkXSlcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICBvdXRkYXRlZERlcGVuZGVuY2llc1ttb2R1bGVJZF0gPSBbXTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgYWRkQWxsVG9TZXQob3V0ZGF0ZWREZXBlbmRlbmNpZXNbbW9kdWxlSWRdLCByZXN1bHQub3V0ZGF0ZWREZXBlbmRlbmNpZXNbbW9kdWxlSWRdKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIH1cbi8qKioqKiovIFx0XHQgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoZG9EaXNwb3NlKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgYWRkQWxsVG9TZXQob3V0ZGF0ZWRNb2R1bGVzLCBbcmVzdWx0Lm1vZHVsZUlkXSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgYXBwbGllZFVwZGF0ZVttb2R1bGVJZF0gPSB3YXJuVW5leHBlY3RlZFJlcXVpcmU7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIH1cbi8qKioqKiovIFx0XHQgICAgICAgIH1cbi8qKioqKiovIFx0XHQgICAgICBjdXJyZW50VXBkYXRlID0gdm9pZCAwO1xuLyoqKioqKi8gXHRcdCAgICAgIHZhciBvdXRkYXRlZFNlbGZBY2NlcHRlZE1vZHVsZXMgPSBbXTtcbi8qKioqKiovIFx0XHQgICAgICBmb3IgKHZhciBqID0gMDtqIDwgb3V0ZGF0ZWRNb2R1bGVzLmxlbmd0aDsgaisrKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICB2YXIgb3V0ZGF0ZWRNb2R1bGVJZCA9IG91dGRhdGVkTW9kdWxlc1tqXSwgbW9kdWxlID0gX193ZWJwYWNrX3JlcXVpcmVfXy5jW291dGRhdGVkTW9kdWxlSWRdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgaWYgKG1vZHVsZSAmJiAobW9kdWxlLmhvdC5fc2VsZkFjY2VwdGVkIHx8IG1vZHVsZS5ob3QuX21haW4pICYmIGFwcGxpZWRVcGRhdGVbb3V0ZGF0ZWRNb2R1bGVJZF0gIT09IHdhcm5VbmV4cGVjdGVkUmVxdWlyZSAmJiAhbW9kdWxlLmhvdC5fc2VsZkludmFsaWRhdGVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICBvdXRkYXRlZFNlbGZBY2NlcHRlZE1vZHVsZXMucHVzaCh7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgbW9kdWxlOiBvdXRkYXRlZE1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHJlcXVpcmU6IG1vZHVsZS5ob3QuX3JlcXVpcmVTZWxmLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGVycm9ySGFuZGxlcjogbW9kdWxlLmhvdC5fc2VsZkFjY2VwdGVkXG4vKioqKioqLyBcdFx0ICAgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgIH1cbi8qKioqKiovIFx0XHQgICAgICB2YXIgbW9kdWxlT3V0ZGF0ZWREZXBlbmRlbmNpZXM7XG4vKioqKioqLyBcdFx0ICAgICAgcmV0dXJuIHtcbi8qKioqKiovIFx0XHQgICAgICAgIGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBjdXJyZW50VXBkYXRlUmVtb3ZlZENodW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGNodW5rSWQpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBkZWxldGUgaW5zdGFsbGVkQ2h1bmtzW2NodW5rSWRdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgY3VycmVudFVwZGF0ZVJlbW92ZWRDaHVua3MgPSB2b2lkIDA7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHZhciBpZHgsIHF1ZXVlID0gb3V0ZGF0ZWRNb2R1bGVzLnNsaWNlKCk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgdmFyIG1vZHVsZUlkID0gcXVldWUucG9wKCksIG1vZHVsZSA9IF9fd2VicGFja19yZXF1aXJlX18uY1ttb2R1bGVJZF07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgaWYgKCFtb2R1bGUpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBjb250aW51ZTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICB2YXIgZGF0YSA9IHt9LCBkaXNwb3NlSGFuZGxlcnMgPSBtb2R1bGUuaG90Ll9kaXNwb3NlSGFuZGxlcnM7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgZm9yIChqID0gMDtqIDwgZGlzcG9zZUhhbmRsZXJzLmxlbmd0aDsgaisrKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgZGlzcG9zZUhhbmRsZXJzW2pdLmNhbGwobnVsbCwgZGF0YSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgX193ZWJwYWNrX3JlcXVpcmVfXy5obXJEW21vZHVsZUlkXSA9IGRhdGE7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgbW9kdWxlLmhvdC5hY3RpdmUgPSAhMTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBkZWxldGUgX193ZWJwYWNrX3JlcXVpcmVfXy5jW21vZHVsZUlkXTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBkZWxldGUgb3V0ZGF0ZWREZXBlbmRlbmNpZXNbbW9kdWxlSWRdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGZvciAoaiA9IDA7aiA8IG1vZHVsZS5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgdmFyIGNoaWxkID0gX193ZWJwYWNrX3JlcXVpcmVfXy5jW21vZHVsZS5jaGlsZHJlbltqXV07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpZiAoIWNoaWxkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBjb250aW51ZTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIGlkeCA9IGNoaWxkLnBhcmVudHMuaW5kZXhPZihtb2R1bGVJZCk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpZiAoaWR4ID49IDApXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIGNoaWxkLnBhcmVudHMuc3BsaWNlKGlkeCwgMSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHZhciBkZXBlbmRlbmN5O1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBmb3IgKHZhciBvdXRkYXRlZE1vZHVsZUlkIGluIG91dGRhdGVkRGVwZW5kZW5jaWVzKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLm8ob3V0ZGF0ZWREZXBlbmRlbmNpZXMsIG91dGRhdGVkTW9kdWxlSWQpKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBtb2R1bGUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmNbb3V0ZGF0ZWRNb2R1bGVJZF07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpZiAobW9kdWxlKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIG1vZHVsZU91dGRhdGVkRGVwZW5kZW5jaWVzID0gb3V0ZGF0ZWREZXBlbmRlbmNpZXNbb3V0ZGF0ZWRNb2R1bGVJZF07XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7aiA8IG1vZHVsZU91dGRhdGVkRGVwZW5kZW5jaWVzLmxlbmd0aDsgaisrKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeSA9IG1vZHVsZU91dGRhdGVkRGVwZW5kZW5jaWVzW2pdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIGlkeCA9IG1vZHVsZS5jaGlsZHJlbi5pbmRleE9mKGRlcGVuZGVuY3kpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIGlmIChpZHggPj0gMClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIG1vZHVsZS5jaGlsZHJlbi5zcGxpY2UoaWR4LCAxKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIH1cbi8qKioqKiovIFx0XHQgICAgICAgIH0sXG4vKioqKioqLyBcdFx0ICAgICAgICBhcHBseTogZnVuY3Rpb24ocmVwb3J0RXJyb3IpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgZm9yICh2YXIgdXBkYXRlTW9kdWxlSWQgaW4gYXBwbGllZFVwZGF0ZSlcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBpZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGFwcGxpZWRVcGRhdGUsIHVwZGF0ZU1vZHVsZUlkKSlcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgIF9fd2VicGFja19yZXF1aXJlX18ubVt1cGRhdGVNb2R1bGVJZF0gPSBhcHBsaWVkVXBkYXRlW3VwZGF0ZU1vZHVsZUlkXTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgZm9yICh2YXIgaSA9IDA7aSA8IGN1cnJlbnRVcGRhdGVSdW50aW1lLmxlbmd0aDsgaSsrKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGN1cnJlbnRVcGRhdGVSdW50aW1lW2ldKF9fd2VicGFja19yZXF1aXJlX18pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBmb3IgKHZhciBvdXRkYXRlZE1vZHVsZUlkIGluIG91dGRhdGVkRGVwZW5kZW5jaWVzKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIGlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLm8ob3V0ZGF0ZWREZXBlbmRlbmNpZXMsIG91dGRhdGVkTW9kdWxlSWQpKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICB2YXIgbW9kdWxlID0gX193ZWJwYWNrX3JlcXVpcmVfXy5jW291dGRhdGVkTW9kdWxlSWRdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKG1vZHVsZSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICBtb2R1bGVPdXRkYXRlZERlcGVuZGVuY2llcyA9IG91dGRhdGVkRGVwZW5kZW5jaWVzW291dGRhdGVkTW9kdWxlSWRdO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gW10sIGVycm9ySGFuZGxlcnMgPSBbXSwgZGVwZW5kZW5jaWVzRm9yQ2FsbGJhY2tzID0gW107XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwO2ogPCBtb2R1bGVPdXRkYXRlZERlcGVuZGVuY2llcy5sZW5ndGg7IGorKykge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIHZhciBkZXBlbmRlbmN5ID0gbW9kdWxlT3V0ZGF0ZWREZXBlbmRlbmNpZXNbal0sIGFjY2VwdENhbGxiYWNrID0gbW9kdWxlLmhvdC5fYWNjZXB0ZWREZXBlbmRlbmNpZXNbZGVwZW5kZW5jeV0sIGVycm9ySGFuZGxlciA9IG1vZHVsZS5ob3QuX2FjY2VwdGVkRXJyb3JIYW5kbGVyc1tkZXBlbmRlbmN5XTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICBpZiAoYWNjZXB0Q2FsbGJhY2spIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3MuaW5kZXhPZihhY2NlcHRDYWxsYmFjaykgIT09IC0xKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGFjY2VwdENhbGxiYWNrKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIGVycm9ySGFuZGxlcnMucHVzaChlcnJvckhhbmRsZXIpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzRm9yQ2FsbGJhY2tzLnB1c2goZGVwZW5kZW5jeSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwO2sgPCBjYWxsYmFja3MubGVuZ3RoOyBrKyspXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgdHJ5IHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrc1trXS5jYWxsKG51bGwsIG1vZHVsZU91dGRhdGVkRGVwZW5kZW5jaWVzKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZXJyb3JIYW5kbGVyc1trXSA9PT0gXCJmdW5jdGlvblwiKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ySGFuZGxlcnNba10oZXJyLCB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVJZDogb3V0ZGF0ZWRNb2R1bGVJZCxcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lJZDogZGVwZW5kZW5jaWVzRm9yQ2FsbGJhY2tzW2tdXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycjIpIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vbkVycm9yZWQpXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm9uRXJyb3JlZCh7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYWNjZXB0LWVycm9yLWhhbmRsZXItZXJyb3JlZFwiLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVJZDogb3V0ZGF0ZWRNb2R1bGVJZCxcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeUlkOiBkZXBlbmRlbmNpZXNGb3JDYWxsYmFja3Nba10sXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIyLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEVycm9yOiBlcnJcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVFcnJvcmVkKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICByZXBvcnRFcnJvcihlcnIyKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcG9ydEVycm9yKGVycik7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25FcnJvcmVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMub25FcnJvcmVkKHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYWNjZXB0LWVycm9yZWRcIixcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZUlkOiBvdXRkYXRlZE1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeUlkOiBkZXBlbmRlbmNpZXNGb3JDYWxsYmFja3Nba10sXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVFcnJvcmVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIHJlcG9ydEVycm9yKGVycik7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIH1cbi8qKioqKiovIFx0XHQgICAgICAgICAgZm9yICh2YXIgbyA9IDA7byA8IG91dGRhdGVkU2VsZkFjY2VwdGVkTW9kdWxlcy5sZW5ndGg7IG8rKykge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHZhciBpdGVtID0gb3V0ZGF0ZWRTZWxmQWNjZXB0ZWRNb2R1bGVzW29dLCBtb2R1bGVJZCA9IGl0ZW0ubW9kdWxlO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIHRyeSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBpdGVtLnJlcXVpcmUobW9kdWxlSWQpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLmVycm9ySGFuZGxlciA9PT0gXCJmdW5jdGlvblwiKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICB0cnkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIGl0ZW0uZXJyb3JIYW5kbGVyKGVyciwge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICBtb2R1bGU6IF9fd2VicGFja19yZXF1aXJlX18uY1ttb2R1bGVJZF1cbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICB9KTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyMSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9uRXJyb3JlZClcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMub25FcnJvcmVkKHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJzZWxmLWFjY2VwdC1lcnJvci1oYW5kbGVyLWVycm9yZWRcIixcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIxLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEVycm9yOiBlcnJcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVFcnJvcmVkKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICByZXBvcnRFcnJvcihlcnIxKTtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIHJlcG9ydEVycm9yKGVycik7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICBlbHNlIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub25FcnJvcmVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIG9wdGlvbnMub25FcnJvcmVkKHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwic2VsZi1hY2NlcHQtZXJyb3JlZFwiLFxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgICAgbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyXG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgICAgfSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVFcnJvcmVkKVxuLyoqKioqKi8gXHRcdCAgICAgICAgICAgICAgICAgIHJlcG9ydEVycm9yKGVycik7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgfVxuLyoqKioqKi8gXHRcdCAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHJldHVybiBvdXRkYXRlZE1vZHVsZXM7XG4vKioqKioqLyBcdFx0ICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgfTtcbi8qKioqKiovIFx0XHQgICAgfVxuLyoqKioqKi8gXHRcdCAgICBfX3dlYnBhY2tfcmVxdWlyZV9fLmhtckkuanNvbnAgPSBmdW5jdGlvbihtb2R1bGVJZCwgYXBwbHlIYW5kbGVycykge1xuLyoqKioqKi8gXHRcdCAgICAgIGlmICghY3VycmVudFVwZGF0ZSkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgY3VycmVudFVwZGF0ZSA9IHt9O1xuLyoqKioqKi8gXHRcdCAgICAgICAgY3VycmVudFVwZGF0ZVJ1bnRpbWUgPSBbXTtcbi8qKioqKiovIFx0XHQgICAgICAgIGN1cnJlbnRVcGRhdGVSZW1vdmVkQ2h1bmtzID0gW107XG4vKioqKioqLyBcdFx0ICAgICAgICBhcHBseUhhbmRsZXJzLnB1c2goYXBwbHlIYW5kbGVyKTtcbi8qKioqKiovIFx0XHQgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgaWYgKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oY3VycmVudFVwZGF0ZSwgbW9kdWxlSWQpKVxuLyoqKioqKi8gXHRcdCAgICAgICAgY3VycmVudFVwZGF0ZVttb2R1bGVJZF0gPSBfX3dlYnBhY2tfcmVxdWlyZV9fLm1bbW9kdWxlSWRdO1xuLyoqKioqKi8gXHRcdCAgICB9O1xuLyoqKioqKi8gXHRcdCAgICBfX3dlYnBhY2tfcmVxdWlyZV9fLmhtckMuanNvbnAgPSBmdW5jdGlvbihjaHVua0lkcywgcmVtb3ZlZENodW5rcywgcmVtb3ZlZE1vZHVsZXMsIHByb21pc2VzLCBhcHBseUhhbmRsZXJzLCB1cGRhdGVkTW9kdWxlc0xpc3QpIHtcbi8qKioqKiovIFx0XHQgICAgICBhcHBseUhhbmRsZXJzLnB1c2goYXBwbHlIYW5kbGVyKTtcbi8qKioqKiovIFx0XHQgICAgICBjdXJyZW50VXBkYXRlQ2h1bmtzID0ge307XG4vKioqKioqLyBcdFx0ICAgICAgY3VycmVudFVwZGF0ZVJlbW92ZWRDaHVua3MgPSByZW1vdmVkQ2h1bmtzO1xuLyoqKioqKi8gXHRcdCAgICAgIGN1cnJlbnRVcGRhdGUgPSByZW1vdmVkTW9kdWxlcy5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcbi8qKioqKiovIFx0XHQgICAgICAgIG9ialtrZXldID0gITE7XG4vKioqKioqLyBcdFx0ICAgICAgICByZXR1cm4gb2JqO1xuLyoqKioqKi8gXHRcdCAgICAgIH0sIHt9KTtcbi8qKioqKiovIFx0XHQgICAgICBjdXJyZW50VXBkYXRlUnVudGltZSA9IFtdO1xuLyoqKioqKi8gXHRcdCAgICAgIGNodW5rSWRzLmZvckVhY2goZnVuY3Rpb24oY2h1bmtJZCkge1xuLyoqKioqKi8gXHRcdCAgICAgICAgaWYgKF9fd2VicGFja19yZXF1aXJlX18ubyhpbnN0YWxsZWRDaHVua3MsIGNodW5rSWQpICYmIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSAhPT0gdm9pZCAwKSB7XG4vKioqKioqLyBcdFx0ICAgICAgICAgIHByb21pc2VzLnB1c2gobG9hZFVwZGF0ZUNodW5rKGNodW5rSWQsIHVwZGF0ZWRNb2R1bGVzTGlzdCkpO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBjdXJyZW50VXBkYXRlQ2h1bmtzW2NodW5rSWRdID0gITA7XG4vKioqKioqLyBcdFx0ICAgICAgICB9IGVsc2Vcbi8qKioqKiovIFx0XHQgICAgICAgICAgY3VycmVudFVwZGF0ZUNodW5rc1tjaHVua0lkXSA9ICExO1xuLyoqKioqKi8gXHRcdCAgICAgIH0pO1xuLyoqKioqKi8gXHRcdCAgICAgIGlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmYpXG4vKioqKioqLyBcdFx0ICAgICAgICBfX3dlYnBhY2tfcmVxdWlyZV9fLmYuanNvbnBIbXIgPSBmdW5jdGlvbihjaHVua0lkLCBwcm9taXNlcykge1xuLyoqKioqKi8gXHRcdCAgICAgICAgICBpZiAoY3VycmVudFVwZGF0ZUNodW5rcyAmJiBfX3dlYnBhY2tfcmVxdWlyZV9fLm8oY3VycmVudFVwZGF0ZUNodW5rcywgY2h1bmtJZCkgJiYgIWN1cnJlbnRVcGRhdGVDaHVua3NbY2h1bmtJZF0pIHtcbi8qKioqKiovIFx0XHQgICAgICAgICAgICBwcm9taXNlcy5wdXNoKGxvYWRVcGRhdGVDaHVuayhjaHVua0lkKSk7XG4vKioqKioqLyBcdFx0ICAgICAgICAgICAgY3VycmVudFVwZGF0ZUNodW5rc1tjaHVua0lkXSA9ICEwO1xuLyoqKioqKi8gXHRcdCAgICAgICAgICB9XG4vKioqKioqLyBcdFx0ICAgICAgICB9O1xuLyoqKioqKi8gXHRcdCAgICB9O1xuLyoqKioqKi8gXHRcdCAgXG4vKioqKioqLyBcdFx0XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5obXJNID0gKCkgPT4ge1xuLyoqKioqKi8gXHRcdFx0aWYgKHR5cGVvZiBmZXRjaCA9PT0gXCJ1bmRlZmluZWRcIikgdGhyb3cgbmV3IEVycm9yKFwiTm8gYnJvd3NlciBzdXBwb3J0OiBuZWVkIGZldGNoIEFQSVwiKTtcbi8qKioqKiovIFx0XHRcdHJldHVybiBmZXRjaChfX3dlYnBhY2tfcmVxdWlyZV9fLnAgKyBfX3dlYnBhY2tfcmVxdWlyZV9fLmhtckYoKSkudGhlbigocmVzcG9uc2UpID0+IHtcbi8qKioqKiovIFx0XHRcdFx0aWYocmVzcG9uc2Uuc3RhdHVzID09PSA0MDQpIHJldHVybjsgLy8gbm8gdXBkYXRlIGF2YWlsYWJsZVxuLyoqKioqKi8gXHRcdFx0XHRpZighcmVzcG9uc2Uub2spIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBmZXRjaCB1cGRhdGUgbWFuaWZlc3QgXCIgKyByZXNwb25zZS5zdGF0dXNUZXh0KTtcbi8qKioqKiovIFx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbi8qKioqKiovIFx0XHRcdH0pO1xuLyoqKioqKi8gXHRcdH07XG4vKioqKioqLyBcdFx0XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5PLmogPSAoY2h1bmtJZCkgPT4gKGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9PT0gMCk7XG4vKioqKioqLyBcdFx0XG4vKioqKioqLyBcdFx0Ly8gaW5zdGFsbCBhIEpTT05QIGNhbGxiYWNrIGZvciBjaHVuayBsb2FkaW5nXG4vKioqKioqLyBcdFx0dmFyIHdlYnBhY2tKc29ucENhbGxiYWNrID0gKHBhcmVudENodW5rTG9hZGluZ0Z1bmN0aW9uLCBkYXRhKSA9PiB7XG4vKioqKioqLyBcdFx0XHR2YXIgW2NodW5rSWRzLCBtb3JlTW9kdWxlcywgcnVudGltZV0gPSBkYXRhO1xuLyoqKioqKi8gXHRcdFx0Ly8gYWRkIFwibW9yZU1vZHVsZXNcIiB0byB0aGUgbW9kdWxlcyBvYmplY3QsXG4vKioqKioqLyBcdFx0XHQvLyB0aGVuIGZsYWcgYWxsIFwiY2h1bmtJZHNcIiBhcyBsb2FkZWQgYW5kIGZpcmUgY2FsbGJhY2tcbi8qKioqKiovIFx0XHRcdHZhciBtb2R1bGVJZCwgY2h1bmtJZCwgaSA9IDA7XG4vKioqKioqLyBcdFx0XHRpZihjaHVua0lkcy5zb21lKChpZCkgPT4gKGluc3RhbGxlZENodW5rc1tpZF0gIT09IDApKSkge1xuLyoqKioqKi8gXHRcdFx0XHRmb3IobW9kdWxlSWQgaW4gbW9yZU1vZHVsZXMpIHtcbi8qKioqKiovIFx0XHRcdFx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8obW9yZU1vZHVsZXMsIG1vZHVsZUlkKSkge1xuLyoqKioqKi8gXHRcdFx0XHRcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tW21vZHVsZUlkXSA9IG1vcmVNb2R1bGVzW21vZHVsZUlkXTtcbi8qKioqKiovIFx0XHRcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRcdH1cbi8qKioqKiovIFx0XHRcdFx0aWYocnVudGltZSkgdmFyIHJlc3VsdCA9IHJ1bnRpbWUoX193ZWJwYWNrX3JlcXVpcmVfXyk7XG4vKioqKioqLyBcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRpZihwYXJlbnRDaHVua0xvYWRpbmdGdW5jdGlvbikgcGFyZW50Q2h1bmtMb2FkaW5nRnVuY3Rpb24oZGF0YSk7XG4vKioqKioqLyBcdFx0XHRmb3IoO2kgPCBjaHVua0lkcy5sZW5ndGg7IGkrKykge1xuLyoqKioqKi8gXHRcdFx0XHRjaHVua0lkID0gY2h1bmtJZHNbaV07XG4vKioqKioqLyBcdFx0XHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhpbnN0YWxsZWRDaHVua3MsIGNodW5rSWQpICYmIGluc3RhbGxlZENodW5rc1tjaHVua0lkXSkge1xuLyoqKioqKi8gXHRcdFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXVswXSgpO1xuLyoqKioqKi8gXHRcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRcdGluc3RhbGxlZENodW5rc1tjaHVua0lkXSA9IDA7XG4vKioqKioqLyBcdFx0XHR9XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXy5PKHJlc3VsdCk7XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHRcdFxuLyoqKioqKi8gXHRcdHZhciBjaHVua0xvYWRpbmdHbG9iYWwgPSBzZWxmW1wid2VicGFja0NodW5rX05fRVwiXSA9IHNlbGZbXCJ3ZWJwYWNrQ2h1bmtfTl9FXCJdIHx8IFtdO1xuLyoqKioqKi8gXHRcdGNodW5rTG9hZGluZ0dsb2JhbC5mb3JFYWNoKHdlYnBhY2tKc29ucENhbGxiYWNrLmJpbmQobnVsbCwgMCkpO1xuLyoqKioqKi8gXHRcdGNodW5rTG9hZGluZ0dsb2JhbC5wdXNoID0gd2VicGFja0pzb25wQ2FsbGJhY2suYmluZChudWxsLCBjaHVua0xvYWRpbmdHbG9iYWwucHVzaC5iaW5kKGNodW5rTG9hZGluZ0dsb2JhbCkpO1xuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gXHRcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyBcdFxuLyoqKioqKi8gXHQvLyBtb2R1bGUgY2FjaGUgYXJlIHVzZWQgc28gZW50cnkgaW5saW5pbmcgaXMgZGlzYWJsZWRcbi8qKioqKiovIFx0XG4vKioqKioqLyB9KSgpXG4iXX0=
;