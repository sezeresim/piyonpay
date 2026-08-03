import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  // Avoid wiping .d.ts while watch rebuilds JS (Nest then fails with TS7016).
  clean: !options.watch,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' }
  },
}))
