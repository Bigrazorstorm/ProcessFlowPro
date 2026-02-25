module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.controller.ts',
    '!**/*.dto.ts',
    '!**/*.strategy.ts',
    '!**/seeders/**',
    '!**/setup.service.ts',
    '!**/main.ts',
    '!**/index.ts',
    '!**/startup*.mjs',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
