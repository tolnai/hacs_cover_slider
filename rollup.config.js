import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import gzipPlugin from 'rollup-plugin-gzip';

export default {
  input: 'src/cover-slider.ts',
  output: {
    dir: 'dist',
    format: 'es',
  },
  plugins: [nodeResolve(), commonjs(), typescript(), json(), terser(), gzipPlugin()],
};
