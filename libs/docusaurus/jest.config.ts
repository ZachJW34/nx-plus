/* eslint-disable */
export default {
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/docusaurus',
  globals: {},
  displayName: 'docusaurus',
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
