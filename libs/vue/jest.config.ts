/* eslint-disable */
export default {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/vue',
  globals: {},
  displayName: 'vue',
  testTimeout: 10000,
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
