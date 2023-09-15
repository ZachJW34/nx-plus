/* eslint-disable */
export default {
  displayName: 'vite',
  globals: {},
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/vite',
  preset: '../../jest.preset.js',
};
