/* eslint-disable */
export default {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/nuxt',
  globals: {},
  displayName: 'nuxt',
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
