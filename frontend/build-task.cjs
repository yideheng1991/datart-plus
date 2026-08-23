/*
 * task 构建脚本 - 使用 esbuild 替代 Rollup + TS + Babel
 * 性能提升：从 ~150s 降到 ~5s (30x+)
 *
 * 运行环境：Java Nashorn Script Engine (Java 8+)
 *   - Nashorn 原生支持 ES5.1 + 部分 ES6 (Map, Set, Promise 等)
 *   - 不需要浏览器 polyfill (react-app-polyfill/core-js stable)
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const outFile = path.resolve(__dirname, 'public/task/index.js');
const entryFile = path.resolve(__dirname, 'src/task.ts');

// 确保输出目录存在
const outDir = path.dirname(outFile);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

/**
 * 最小化 polyfill - 只补 Nashorn (Java 8) 缺少且源码中实际用到的方法
 * 源码注释中注明用到的: Object.values, Array.prototype.find, new Map
 * 另外 String.prototype.replaceAll 是 ES2021，Nashorn 不支持
 */
const polyfills = `
/* --- Minimal Polyfills for Java Nashorn (Java 8) --- */
/* NOTE: 不能以 "use strict" 开头，因为下面 Symbol 需要以顶层 var 方式创建全局变量，
   "use strict" 会禁止对未声明全局变量赋值，导致 "ReferenceError: Symbol is not defined"。 */

/* --- Symbol (ES2015) 顶层全局声明 ---
   源码中直接用 Symbol('...') 作为对象属性的唯一 key (如 RUNTIME_FILTER_KEY / RUNTIME_DATE_LEVEL_KEY)。
   Java 8 Nashorn 没有 Symbol 全局对象，这里用一个自增 id 的唯一字符串来模拟，
   保证作为对象 key 时唯一且不与业务 key 冲突。
   同时提供 Symbol.iterator / Symbol.for 等属性，避免 Babel helper 在运行时访问未定义的 Symbol 报错。
   必须用顶层 var 声明，后续（严格模式）bundle 代码才能访问到。 */
var __datart_symbol_counter__ = 0;
function __datart_symbol__(desc) {
  __datart_symbol_counter__ += 1;
  return '__datart_symbol_' + (desc == null ? '' : String(desc)) + '_' + __datart_symbol_counter__ + '__';
}
__datart_symbol__.iterator = '__datart_symbol_iterator__';
__datart_symbol__.for = function (key) { return '__datart_symbol_for_' + String(key) + '__'; };
__datart_symbol__.keyFor = function (sym) { return null; };
if (typeof Symbol === 'undefined' || typeof Symbol !== 'function') {
  Symbol = __datart_symbol__;
}
/* --- Array 迭代器 (ES2015) - 让 for...of / Array.from 可用 --- */
if (!Array.prototype[Symbol.iterator]) {
  Array.prototype[Symbol.iterator] = function () {
    var index = 0;
    var arr = this;
    var iter = {
      next: function () {
        return index < arr.length ? { value: arr[index++], done: false } : { value: undefined, done: true };
      },
    };
    iter[Symbol.iterator] = function () { return this; };
    return iter;
  };
}
/* --- Array.from (ES2015) 顶层全局声明 - Babel 的 _iterableToArray helper 依赖 --- */
if (!Array.from) {
  Array.from = function (arrayLike, mapFn, thisArg) {
    var result = [];
    // 优先使用迭代器（Map.keys()/Set 等）
    var it = arrayLike != null && arrayLike[Symbol.iterator];
    if (it) {
      var iter = it.call(arrayLike);
      var step;
      var i = 0;
      while (!(step = iter.next()).done) {
        result.push(mapFn ? mapFn.call(thisArg, step.value, i++) : step.value);
      }
      return result;
    }
    // 类数组回退
    var list = arrayLike == null ? [] : (arrayLike.length != null ? arrayLike : Object.keys(arrayLike));
    for (var k = 0; k < list.length; k++) {
      result.push(mapFn ? mapFn.call(thisArg, list[k], k) : list[k]);
    }
    return result;
  };
}
/* --- Map (ES2015) 顶层全局声明 - Java 8 Nashorn 没有 Map --- */
if (typeof Map === 'undefined') {
  function __datartMap() {
    this.__entries = [];
    this.__size = 0;
    if (arguments.length && arguments[0] != null) {
      Array.from(arguments[0]).forEach(function (entry) { this.set(entry[0], entry[1]); }, this);
    }
  }
  __datartMap.prototype.set = function (key, value) {
    for (var i = 0; i < this.__entries.length; i += 2) {
      if (this.__entries[i] === key) { this.__entries[i + 1] = value; return this; }
    }
    this.__entries.push(key, value);
    this.__size += 1;
    return this;
  };
  __datartMap.prototype.get = function (key) {
    for (var i = 0; i < this.__entries.length; i += 2) {
      if (this.__entries[i] === key) return this.__entries[i + 1];
    }
    return undefined;
  };
  __datartMap.prototype.has = function (key) {
    for (var i = 0; i < this.__entries.length; i += 2) {
      if (this.__entries[i] === key) return true;
    }
    return false;
  };
  __datartMap.prototype.delete = function (key) {
    for (var i = 0; i < this.__entries.length; i += 2) {
      if (this.__entries[i] === key) {
        this.__entries.splice(i, 2);
        this.__size -= 1;
        return true;
      }
    }
    return false;
  };
  __datartMap.prototype.clear = function () { this.__entries = []; this.__size = 0; };
  __datartMap.prototype.forEach = function (cb, thisArg) {
    for (var i = 0; i < this.__entries.length; i += 2) {
      cb.call(thisArg, this.__entries[i + 1], this.__entries[i], this);
    }
  };
  __datartMap.prototype.keys = function () {
    var keys = [];
    for (var i = 0; i < this.__entries.length; i += 2) keys.push(this.__entries[i]);
    return keys[Symbol.iterator] ? keys : keys;
  };
  __datartMap.prototype.values = function () {
    var vals = [];
    for (var i = 0; i < this.__entries.length; i += 2) vals.push(this.__entries[i + 1]);
    return vals;
  };
  __datartMap.prototype.entries = function () {
    var es = [];
    for (var i = 0; i < this.__entries.length; i += 2) es.push([this.__entries[i], this.__entries[i + 1]]);
    return es;
  };
  Object.defineProperty(__datartMap.prototype, 'size', {
    get: function () { return this.__size; },
  });
  Map = __datartMap;
}
/* --- Set (ES2015) 顶层全局声明 - Java 8 Nashorn 没有 Set --- */
if (typeof Set === 'undefined') {
  function __datartSet() {
    this.__items = [];
    if (arguments.length && arguments[0] != null) {
      Array.from(arguments[0]).forEach(function (v) { this.add(v); }, this);
    }
  }
  __datartSet.prototype.add = function (value) {
    if (!this.has(value)) { this.__items.push(value); }
    return this;
  };
  __datartSet.prototype.has = function (value) {
    return this.__items.indexOf(value) !== -1;
  };
  __datartSet.prototype.delete = function (value) {
    var idx = this.__items.indexOf(value);
    if (idx !== -1) { this.__items.splice(idx, 1); return true; }
    return false;
  };
  __datartSet.prototype.clear = function () { this.__items = []; };
  __datartSet.prototype.forEach = function (cb, thisArg) {
    for (var i = 0; i < this.__items.length; i++) cb.call(thisArg, this.__items[i], this.__items[i], this);
  };
  __datartSet.prototype.keys = function () { return this.__items; };
  __datartSet.prototype.values = function () { return this.__items; };
  __datartSet.prototype.entries = function () {
    return this.__items.map(function (v) { return [v, v]; });
  };
  Object.defineProperty(__datartSet.prototype, 'size', {
    get: function () { return this.__items.length; },
  });
  Set = __datartSet;
}

"use strict";
/* --- 其余 polyfill 对已存在对象的属性赋值，可在严格模式 IIFE 内安全执行 --- */
(function(){
  // Object.values (ES2017)
  if (!Object.values) {
    Object.values = function (obj) {
      return Object.keys(obj).map(function (key) { return obj[key]; });
    };
  }
  // Array.prototype.find (ES2015)
  if (!Array.prototype.find) {
    Array.prototype.find = function (callback, thisArg) {
      if (this == null) throw new TypeError('Array.prototype.find called on null or undefined');
      if (typeof callback !== 'function') throw new TypeError('callback must be a function');
      var list = Object(this);
      var length = list.length >>> 0;
      for (var i = 0; i < length; i++) {
        var elem = list[i];
        if (callback.call(thisArg, elem, i, list)) return elem;
      }
      return undefined;
    };
  }
  // Array.prototype.findIndex (ES2015)
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (callback, thisArg) {
      if (this == null) throw new TypeError('Array.prototype.findIndex called on null or undefined');
      if (typeof callback !== 'function') throw new TypeError('callback must be a function');
      var list = Object(this);
      var length = list.length >>> 0;
      for (var i = 0; i < length; i++) {
        if (callback.call(thisArg, list[i], i, list)) return i;
      }
      return -1;
    };
  }
  // String.prototype.replaceAll (ES2021)
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (search, replace) {
      if (typeof search === 'string') return this.split(search).join(replace);
      if (search instanceof RegExp) {
        if (!search.global) throw new TypeError('replaceAll must be called with a global RegExp');
        return this.replace(search, replace);
      }
      return this.replace(search, replace);
    };
  }
  // Array.prototype.includes (ES2016)
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement, fromIndex) {
      if (this == null) throw new TypeError('Array.prototype.includes called on null or undefined');
      var list = Object(this);
      var length = list.length >>> 0;
      var n = fromIndex || 0;
      var k;
      if (n >= 0) { k = n; }
      else { k = length + n; if (k < 0) k = 0; }
      for (; k < length; k++) {
        var current = list[k];
        if (current === searchElement || (current !== current && searchElement !== searchElement)) {
          return true;
        }
      }
      return false;
    };
  }
  // Array.prototype.flat (ES2019)
  if (!Array.prototype.flat) {
    Array.prototype.flat = function (depth) {
      depth = depth === undefined ? 1 : depth;
      var result = [];
      var flatten = function (arr, d) {
        for (var i = 0; i < arr.length; i++) {
          if (Array.isArray(arr[i]) && d > 0) { flatten(arr[i], d - 1); }
          else { result.push(arr[i]); }
        }
      };
      flatten(this, depth);
      return result;
    };
  }
  // Array.prototype.flatMap (ES2019)
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function (callback, thisArg) {
      var self = this;
      return self.map(function (item, index, arr) {
        return callback.call(thisArg, item, index, arr);
      }).flat(1);
    };
  }
  // String.prototype.includes (ES2015)
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      if (typeof start !== 'number') start = 0;
      if (start + search.length > this.length) return false;
      return this.indexOf(search, start) !== -1;
    };
  }
  // String.prototype.startsWith / endsWith (ES2015)
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (search, pos) {
      return this.lastIndexOf(search, pos) === pos;
    };
  }
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (search, pos) {
      var end = pos === undefined ? this.length : Math.min(pos, this.length);
      return this.substring(end - search.length, end) === search;
    };
  }
  // Object.entries (ES2017) - lodash 可能依赖
  if (!Object.entries) {
    Object.entries = function (obj) {
      return Object.keys(obj).map(function (key) { return [key, obj[key]]; });
    };
  }
  // Object.getOwnPropertyDescriptors (ES2017) - 某些库(如 lodash)在加载阶段依赖
  if (!Object.getOwnPropertyDescriptors) {
    Object.getOwnPropertyDescriptors = function (obj) {
      var result = {};
      var keys = Object.getOwnPropertyNames(obj);
      for (var i = 0; i < keys.length; i++) {
        result[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
      }
      return result;
    };
  }
  // Object.assign (ES2015) - 确保可用
  if (!Object.assign) {
    Object.assign = function (target, varArgs) {
      if (target == null) throw new TypeError('Cannot convert undefined or null to object');
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
})();
`;

esbuild
  .build({
    entryPoints: [entryFile],
    outfile: outFile,
    bundle: true,
    // 目标：ES2015。先在 esbuild 中降到 ES2015 (esbuild 支持的最低)
    // 然后用 Babel 快速降级到 ES5 (Java 8 Nashorn 只支持 ES5.1)
    // 这比直接用 Rollup + TS + Babel 全程编译快 50 倍
    target: 'es2015',
    format: 'iife',
    // 将 default export 直接挂在这个全局变量上
    globalName: '__DATART_TASK__',
    // Nashorn 没有 Node 原生 require。所以用 browser 平台，把所有依赖都打进 bundle
    // (对 browser 不存在的 Node 原生模块，用 plugins 手动 shim)
    platform: 'browser',
    // 开启压缩，移除死代码和注释
    minify: true,
    // 不生成 sourcemap，节省时间和体积
    sourcemap: false,
    allowOverwrite: true,
    // 移除 console.* 调用，与原 Rollup replace 功能一致
    legalComments: 'none',
    drop: ['console'],
    // 路径别名，与 vite.config.ts 保持一致
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@locales': path.resolve(__dirname, 'src/locales'),
      '@redux-store': path.resolve(__dirname, 'src/redux'),
      app: path.resolve(__dirname, 'src/app'),
      styles: path.resolve(__dirname, 'src/styles'),
      utils: path.resolve(__dirname, 'src/utils'),
      locales: path.resolve(__dirname, 'src/locales'),
      types: path.resolve(__dirname, 'src/types.ts'),
      entryPointFactory: path.resolve(__dirname, 'src/entryPointFactory.tsx'),
      globalConstants: path.resolve(__dirname, 'src/globalConstants.ts'),
    },
    define: {
      'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || ''),
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    plugins: [
      // Shim Node 原生内置模块 (crypto, buffer, path, util, stream, os, vm 等)
      // 运行在 Nashorn 里没有这些，提供空实现避免打包后 Dynamic require 报错
      {
        name: 'shim-node-builtins',
        setup(build) {
          const builtins = [
            'crypto', 'buffer', 'path', 'util', 'stream', 'os', 'vm',
            'events', 'string_decoder', 'assert', 'url', 'querystring',
            'http', 'https', 'fs', 'net', 'tls', 'zlib', 'tty', 'dgram',
            'child_process', 'cluster', 'console', 'constants', 'crypto',
            'dgram', 'dns', 'domain', 'punycode', 'readline', 'repl',
            'sys', 'timers',
          ];
          // shim 内容：返回一个空对象或空函数，确保不会运行时崩溃
          // 大多数情况下这些代码路径不会被真正执行 (tree-shaking 可能移除它们)
          const shimContent = `
            module.exports = {};
            module.exports.default = {};
          `;
          builtins.forEach((name) => {
            build.onResolve({ filter: new RegExp('^' + name + '$') }, (args) => ({
              path: args.path,
              namespace: 'node-builtin-shim',
            }));
          });
          build.onLoad({ filter: /.*/, namespace: 'node-builtin-shim' }, () => ({
            contents: shimContent,
            loader: 'js',
          }));
        },
      },
    ],
  })
  .then(() => {
    // 后处理步骤：
    // 1. 先用 Babel 将 ES2015 代码降级到 ES5 (Java 8 Nashorn 只支持 ES5.1)
    //    这一步只做语法降级，不做 TS 编译，所以很快
    // 2. 注入最小化 polyfills 到文件最开头
    // 3. 将 export default 的函数暴露为全局 getQueryData (兼容 Nashorn)
    let content = fs.readFileSync(outFile, 'utf8');

    // --- Step 1: Babel ES2015 -> ES5 语法降级 ---
    const babel = require('@babel/core');
    const babelResult = babel.transformSync(content, {
      babelrc: false,
      configFile: false,
      comments: false,
      compact: false,
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            targets: { ie: '10' }, // 强制输出纯 ES5
            modules: false,
            useBuiltIns: false, // 已手动注入最小 polyfill
            bugfixes: true,
          },
        ],
      ],
    });
    content = babelResult.code;

    // --- Step 2 & 3: 注入 polyfills + 全局挂载 ---
    // esbuild 用 globalName 生成的格式是：
    //   var __DATART_TASK__ = (() => { ... return __esModuleDefault; })();
    // __esModuleDefault 即为 task.ts 的 `export default getQueryData;`
    // 但 esbuild 通常会包一层 { default: fn, __esModule: true } 的模块对象
    // 所以需要解包 .default

    const unpackAndMount = `
/* --- Unpack ES module default export & mount globally for Nashorn --- */
(function(){
  var exp = typeof __DATART_TASK__ === 'function'
    ? __DATART_TASK__
    : (__DATART_TASK__ && __DATART_TASK__.default) ? __DATART_TASK__.default : __DATART_TASK__;
  var getQueryData = exp;
  // 兼容各种全局对象，Nashorn 一般会挂到 this 或 global
  if (typeof globalThis !== 'undefined') globalThis.getQueryData = getQueryData;
  if (typeof global !== 'undefined') global.getQueryData = getQueryData;
  if (typeof self !== 'undefined') self.getQueryData = getQueryData;
  if (typeof window !== 'undefined') window.getQueryData = getQueryData;
  this.getQueryData = getQueryData;
}).call(this);
`;

    // 最终拼接：polyfills (含 "use strict") + esbuild+babel bundle + 全局挂载
    content = polyfills + '\n/* --- transpiled bundle --- */\n' + content + '\n' + unpackAndMount;

    // 可选：用 esbuild 再压缩一次 (Babel 输出未压缩)
    const esbuild2 = require('esbuild');
    const minResult = esbuild2.transformSync(content, {
      loader: 'js',
      target: 'es5',
      minify: true,
      legalComments: 'none',
    });
    content = minResult.code;

    fs.writeFileSync(outFile, content);

    const stats = fs.statSync(outFile);
    console.log(`✓ task build done: ${outFile}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  })
  .catch((err) => {
    console.error('✗ task build failed:', err);
    process.exit(1);
  });
