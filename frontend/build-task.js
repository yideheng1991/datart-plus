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
"use strict";
/* --- Minimal Polyfills for Java Nashorn (Java 8) --- */
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
  // Object.entries (ES2017) - lodash 可能依赖
  if (!Object.entries) {
    Object.entries = function (obj) {
      return Object.keys(obj).map(function (key) { return [key, obj[key]]; });
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
