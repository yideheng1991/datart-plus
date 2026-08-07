/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname),
  testEnvironment: 'jsdom',
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.{spec,test}.{js,jsx,ts,tsx}'],
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node',
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(echarts|zrender|react-monaco-editor|monaco-editor|monaco-editor-webpack-plugin)/)',
  ],
  moduleNameMapper: {
    // Handle Vite's ?svgr suffix imports (must be before path aliases)
    '^(.*)\\.svg\\?svgr$': '<rootDir>/src/__mocks__/svgrMock.js',
    // Path aliases matching tsconfig.json
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@locales/(.*)$': '<rootDir>/src/locales/$1',
    '^@redux-store/(.*)$': '<rootDir>/src/redux/$1',
    '^app/(.*)$': '<rootDir>/src/app/$1',
    '^components/(.*)$': '<rootDir>/src/app/components/$1',
    '^pages/(.*)$': '<rootDir>/src/app/pages/$1',
    '^hooks/(.*)$': '<rootDir>/src/app/hooks/$1',
    '^slices/(.*)$': '<rootDir>/src/app/slice/$1',
    '^locales/(.*)$': '<rootDir>/src/locales/$1',
    '^redux/(.*)$': '<rootDir>/src/redux/$1',
    '^styles/(.*)$': '<rootDir>/src/styles/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    '^core/(.*)$': '<rootDir>/src/app/models/$1',
    '^migration/(.*)$': '<rootDir>/src/app/migration/$1',
    '^types/(.*)$': '<rootDir>/src/app/types/$1',
    '^types$': '<rootDir>/src/types.ts',
    '^entryPointFactory$': '<rootDir>/src/entryPointFactory',
    '^globalConstants$': '<rootDir>/src/globalConstants',
    // Handle antd's ~-prefixed less imports
    '^~antd/(.*)$': '<rootDir>/node_modules/antd/$1',
    '^~@ant-design/(.*)$': '<rootDir>/node_modules/@ant-design/$1',
    // Mock static assets
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*/*.d.ts',
    '!src/**/*/Loadable.{js,jsx,ts,tsx}',
    '!src/**/*/messages.ts',
    '!src/**/*/types.ts',
    '!src/index.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['html', 'lcov', 'text-summary'],
};
