import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // ドメインロジックは React に依存しない純粋な TypeScript のため（ADR-0001）、
    // DOM 環境を用意しない。UI のテストが必要になった時点で見直す。
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
