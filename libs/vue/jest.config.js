module.exports = {
  name: 'vue',
  preset: '../../jest.config.js',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/vue',
  globals: { 'ts-jest': { tsConfig: '<rootDir>/tsconfig.spec.json' } },
};
