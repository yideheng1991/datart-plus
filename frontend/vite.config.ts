import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import fs from 'fs';

// Strips invalid sourceMappingURL from quilljs-markdown's CSS to suppress dev warnings
function fixQuillMarkdownSourcemap(): Plugin {
  return {
    name: 'fix-quill-markdown-sourcemap',
    enforce: 'pre',
    load(id) {
      if (id.includes('quilljs-markdown-common-style.css')) {
        let code = fs.readFileSync(id, 'utf-8');
        code = code.replace(/\/\*# sourceMappingURL=.*?\*\//, '');
        return code;
      }
    },
  };
}

// Custom plugin for dev server middleware (history API fallback + custom charts API)
function devServerPlugin(): Plugin {
  return {
    name: 'datart-dev-server',
    configureServer(server) {
      // Custom charts plugin API
      server.middlewares.use('/api/v1/plugins/custom/charts', (req, res) => {
        const pluginPath = 'custom-chart-plugins';
        try {
          const dir = fs.readdirSync(`./public/${pluginPath}`);
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              data: (dir || [])
                .filter((file: string) => path.extname(file) === '.js')
                .map((file: string) => `${pluginPath}/${file}`),
              errCode: 0,
              success: true,
            }),
          );
        } catch (e) {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({ data: [], errCode: 0, success: true }),
          );
        }
      });

      // History API Fallback for multiple entry points
      server.middlewares.use((req, res, next) => {
        if (req.url && !req.url.startsWith('/api/') && !req.url.startsWith('/resources/')) {
          const urlPath = req.url.split('?')[0];
          if (urlPath === '/' || urlPath === '') {
            req.url = '/index.html';
          } else if (/^\/shareChart\/\w/.test(urlPath)) {
            req.url = '/shareChart.html';
          } else if (/^\/shareDashboard\/\w/.test(urlPath)) {
            req.url = '/shareDashboard.html';
          } else if (/^\/shareStoryPlayer\/\w/.test(urlPath)) {
            req.url = '/shareStoryPlayer.html';
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const baseUrl = env.VITE_PUBLIC_URL || '/';

  return {
    // Base path for deployment (replaces CRA's publicPath)
    base: baseUrl,

    plugins: [
      react({
        // Fast Refresh is enabled by default in Vite
        // Note: babel-plugin-styled-components is not compatible with Vite
        // styled-components displayName will not be available in dev mode
      }),
      // SVG as React Component import: import Loading from './loading.svg?svgr'
      // Only process SVGs with ?svgr query; others fall back to Vite's default URL import
      svgr({
        include: '**/*.svg?svgr',
        svgrOptions: {
          // SVGR options
        },
      }),
      // Custom dev server middleware
      devServerPlugin(),
      fixQuillMarkdownSourcemap(),
    ],

    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          paths: [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, 'node_modules/antd'),
          ],
        },
      },
    },

    resolve: {
      alias: {
        // Handle antd's ~-prefixed less imports
        '~antd': path.resolve(__dirname, 'node_modules/antd'),
        '~@ant-design': path.resolve(__dirname, 'node_modules/@ant-design'),
        // Module aliases
        '@app': path.resolve(__dirname, 'src/app'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@locales': path.resolve(__dirname, 'src/locales'),
        '@redux-store': path.resolve(__dirname, 'src/redux'),
        // Legacy aliases for backward compatibility
        app: path.resolve(__dirname, 'src/app'),
        styles: path.resolve(__dirname, 'src/styles'),
        utils: path.resolve(__dirname, 'src/utils'),
        locales: path.resolve(__dirname, 'src/locales'),
        types: path.resolve(__dirname, 'src/types.ts'),
        entryPointFactory: path.resolve(__dirname, 'src/entryPointFactory.tsx'),
        globalConstants: path.resolve(__dirname, 'src/globalConstants.ts'),
      },
    },

    define: {
      'process.env.PUBLIC_URL': JSON.stringify(baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },

    esbuild: {
      legalComments: 'none',
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      open: false,
      proxy: {
        '/api/v1': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/resources': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'build',
      sourcemap: false,
      target: 'es2020',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          shareChart: path.resolve(__dirname, 'shareChart.html'),
          shareDashboard: path.resolve(__dirname, 'shareDashboard.html'),
          shareStoryPlayer: path.resolve(__dirname, 'shareStoryPlayer.html'),
        },
        output: {
          // No manualChunks - let Vite/Rollup handle automatic chunk splitting.
          // Manual chunking caused cross-chunk dependency issues with ES modules.
          // Vite's automatic chunking is smarter about keeping dependent modules together.
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/assets/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 2000,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        'echarts',
        'styled-components',
      ],
      exclude: [],
    },
  };
});
