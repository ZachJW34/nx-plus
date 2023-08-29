/* eslint-disable */
export default {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '../../coverage/libs/docusaurus',
  globals: {},
  displayName: 'docusaurus',
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
};
