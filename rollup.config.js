import typescript from 'rollup-plugin-typescript2';  

export default {  
  input: 'src/index.ts',
  output: {  
    file: 'dist/react-busser-headless-ui.js',
    format: 'umd',
    name: 'RbhUI'
  },  
  plugins: [typescript()]  
};  
