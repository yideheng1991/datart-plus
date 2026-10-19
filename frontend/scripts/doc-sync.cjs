/**
 * 一键重新生成并同步 dHelper API 文档：
 *   1. npm run doc:types  编译 chartHelper.ts → types/app/utils/chartHelper.js（注释保留）
 *   2. npm run doc:html   jsdoc + docdash    → types/docs/*.html
 *   3. 拷贝产物到 datart-docs 仓的 source/api/
 *
 * 用法：npm run doc:sync [-- <datart-docs/source/api 路径>]
 * 默认假定 datart-docs 与 datart 仓同级；tsc/jsdoc 的非零退出码不阻断流程
 * （项目既有类型噪音），但缺少关键产物时会终止。
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..');
// datart-docs 与 datart 仓同级：frontend -> datart -> F:\datart_project\datart-docs
const docsApiDir = path.resolve(
  process.argv[2] ||
    path.join(frontendDir, '..', '..', 'datart-docs', 'source', 'api'),
);

function run(command) {
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    cwd: frontendDir,
  });
  if (result.status !== 0) {
    console.warn(`[doc-sync] "${command}" 退出码 ${result.status}，继续执行`);
  }
}

function mustExist(file, hint) {
  if (!fs.existsSync(file)) {
    console.error(`[doc-sync] 缺少产物: ${file}\n${hint}`);
    process.exit(1);
  }
}

// 1. 编译镜像 JS
run('npm run doc:types');
const mirror = path.join(frontendDir, 'types', 'app', 'utils', 'chartHelper.js');
mustExist(mirror, '请检查 tsconfig.dHelper.json 编译是否报错');

// 2. jsdoc 生成 HTML
run('npm run doc:html');
const docsDir = path.join(frontendDir, 'types', 'docs');
const htmlFiles = ['chartHelper.js.html', 'global.html', 'index.html'];
htmlFiles.forEach(name => mustExist(path.join(docsDir, name), '请检查 jsdoc 输出'));

// 3. 同步到 datart-docs 仓
if (!fs.existsSync(docsApiDir)) {
  console.error(
    `[doc-sync] 文档目录不存在: ${docsApiDir}\n` +
      '请将 datart-docs 克隆到 datart 仓同级目录，或传入路径: npm run doc:sync -- <source/api 路径>',
  );
  process.exit(1);
}
htmlFiles.forEach(name =>
  fs.copyFileSync(path.join(docsDir, name), path.join(docsApiDir, name)),
);
['fonts', 'scripts', 'styles'].forEach(dir =>
  fs.cpSync(path.join(docsDir, dir), path.join(docsApiDir, dir), {
    recursive: true,
  }),
);
console.log(`[doc-sync] 已同步 API 文档到 ${docsApiDir}`);
