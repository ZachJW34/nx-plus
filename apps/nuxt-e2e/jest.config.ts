module.exports = {
  displayName: 'nuxt-e2e',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/nuxt-e2e',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
};
