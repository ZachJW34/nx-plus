/* eslint-disable */
export default {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/nuxt',
  globals: {},
  displayName: 'nuxt',
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
