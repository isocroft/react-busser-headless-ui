import typescript from '@rollup/plugin-typescript';  

export default {  
  input: 'src/index.ts',
  output: {
    file: 'dist/umd/index.js',
    format: 'umd',
    name: 'RbhUI',
    sourcemap: true
  },
  // external: ['react-busser', 'lodash.pick', 'date-fns', 'sonner'],
  plugins: [typescript()]
};  
