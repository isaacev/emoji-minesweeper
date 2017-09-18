const gulp = require('gulp')
const rollup = require('rollup')
const typescript = require('rollup-plugin-typescript2')

gulp.task('build', async () => {
  const bundle = await rollup.rollup({
    input: './minesweeper.tsx',
    external: [
      'react',
      'react-dom',
    ],
    plugins: [
      typescript(),
    ],
  })

  await bundle.write({
    file: './minesweeper.js',
    format: 'iife',
    globals: {
      'react': 'React',
      'react-dom': 'ReactDOM',
    },
    name: 'minesweeper',
    sourcemap: true,
  })
})

gulp.task('watch', ['build'], async () => {
  gulp.watch('./minesweeper.tsx', ['build'])
})
