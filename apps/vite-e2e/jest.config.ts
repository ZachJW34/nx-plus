module.exports = {
  displayName: 'vite-e2e',
  preset: '../../jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/vite-e2e',
};
