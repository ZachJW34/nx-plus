/* eslint-disable */
export default {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/vue',
  globals: {},
  displayName: 'vue',
  testTimeout: 10000,
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
