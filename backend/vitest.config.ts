import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // all test files share one database, so run them one at a time
    fileParallelism: false,
    testTimeout: 15000,
  },
})
