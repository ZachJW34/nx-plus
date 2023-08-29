module.exports = {
  displayName: 'vue-e2e',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/vue-e2e',
  maxWorkers: 1,
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
};
