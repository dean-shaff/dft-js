function now (performance) {
  return function () {
    return performance.now()
  }
}

function format (val, n) {
  if (n === undefined) {
    n = 4
  }
  return val.toFixed(n)
}

async function fftWasmBenchmark (nIter, wasm, testVectors, now, jsFFT) {

  var sizes = Object.keys(testVectors)
  // sizes = [8192]
  sizes = [512, 2048]
  sizes.forEach((n)=>{
    var input = testVectors[n]['in']

    var inputComplex = input.reduce((accum, val)=>{
      return accum.concat(val)
    }, [])

    if (jsFFT !== undefined) {
      var t0 = now()
      for (var i=0; i<nIter; i++) {
        jsFFT(inputComplex, false)
      }
      var deltaJs = (now() - t0)/1000
      console.log(`JS fft: size: ${n}: ${format(deltaJs)} sec, ${format(deltaJs/nIter, 8)} per loop, ${format(nIter/deltaJs, 2)} iter per second`)
    }

    var memory = new Float64Array(wasm.memory.buffer, 0, 4*n)
    for (var j=0; j<n; j++) {
      memory[2*j] = input[j][0]
      memory[2*j + 1] = input[j][1]
    }

    var t0 = now()
    for (var i=0; i<nIter; i++) {
      wasm.fft_c2c(n, -1)
    }
    var deltaWasm = (now() - t0)/1000
    console.log(`wasm fft: size: ${n}: ${format(deltaWasm)} sec, ${format(deltaWasm/nIter, 8)} per loop, ${format(nIter/deltaWasm, 2)} iter per second`)
    // console.log(`wasm.fft is ${deltaJs/deltaWasm}x faster`)
  })
}

if (typeof require != 'undefined' && require.main == module) {
  const path = require('path')
  const fs = require('fs')
  const { performance } = require('perf_hooks')

  const Complex = require('complex.js')

  const { build, buildBinaryen, instantiate } = require('./wasm_util.js')
  const { fftComplex2Complex, fftPermute, fftPermuteComplex, shiftBit, reverseBits } = require('./../src/dft.js')

  const topDir = path.dirname(__dirname)
  const srcDir = path.join(topDir, 'src')
  const buildDir = path.join(topDir, 'build')
  const watPath = path.join(srcDir, 'fft.wast')
  const wasmPath = path.join(buildDir, 'fft.wasm')
  const wasmOptPath = path.join(buildDir, 'fft.opt.wasm')
  const dataDir = path.join(topDir, 'test', 'data')

  function loadTestVectors () {
    var testVecFilePath = path.join(dataDir, 'test_vectors.json')
    var testVectors = JSON.parse(fs.readFileSync(testVecFilePath))
    return testVectors
  }
  async function main () {
    var testVectors = loadTestVectors()
    var wasmModule = await instantiate(wasmOptPath)
    fftWasmBenchmark(2000, wasmModule, testVectors, now(performance), fftComplex2Complex)
  }
  main()
} else {

  var importObject = {
    console: {
      log: (x) => console.log(x),
      logx2: (x, y) => console.log(x, y)
    },
    performance: {
      now: () => performance.now()
    },
    math: {
      exp: (x) => Math.exp(x),
      sin: (x) => Math.sin(x),
      cos: (x) => Math.cos(x),
      log2: (x) => Math.log2(x),
      PI: Math.PI,
      PI_2: Math.PI/2
    }
  }

  const instantiate = async (wasmPath, importObject) => {

    return fetch(wasmPath).then(response =>
      response.arrayBuffer()
    )
    // return fetch(wasmPath).then((response) =>
    //   WebAssembly.compileStreaming(response)
    // )
    .then(module =>
      WebAssembly.instantiate(module, importObject)
    ).then(wasm => {
      wasm = wasm.instance.exports
      return wasm
    })
  }

  const loadTestVectors = () => {
    var testVectors = {}
    var sizes = [512, 2048]
    sizes.forEach((n) => {
      var input = []
      for (var i=0; i<n; i++){
        input.push([Math.random(), Math.random()])
      }
      testVectors[n] = {
        'in': input
      }
    })
    return testVectors
  }

  async function main () {
    var testVectors = loadTestVectors()
    var wasmModule = await instantiate('./build/fft.opt.wasm', importObject)
    fftWasmBenchmark(2000, wasmModule, testVectors, now(window.performance))
  }
  window.main = main
  main()
}

// async function fftWasmBenchmark (nIter) {
// 	// buildBinaryen(watPath, wasmPath)
// 	var wasm = await instantiate(wasmPath)
//
//   var testVectors = loadTestVectors()
//   var sizes = Object.keys(testVectors)
//   // var memory = new Float64Array(
//   //   wasm.memory.buffer, 0, 4*Math.max(...sizes))
//   var memory
//   sizes = [8192]
//   sizes.forEach((n) => {
//     var input = testVectors[n]['in']
//     var inputComplex = input.map((c) => {
//       return new Complex([c[0], c[1]])
//     })
//     var inputComplex = input.reduce(
//       ( accumulator, currentValue ) => accumulator.concat(currentValue),
//       []
//     )
//     var res = new Array(2*n)
//     // var res = new Array(n)
//     // var res = input.map(()=>{
//     //   return Complex.ZERO
//     // })
//     memory = new Float64Array(
//       wasm.memory.buffer, 0, 4*n)
//
//     var p = Math.log2(n)
//     wasm.fftPermute(n, p)
//     performance.mark('wasm.fftPermute.start')
//     for (var i=0; i<nIter; i++) {
//       // var t0 = performance.now()
//       wasm.fftPermute(n, p)
//       // console.log(`${(performance.now() - t0) / 1000}`)
//     }
//     performance.mark('wasm.fftPermute.end')
//     performance.measure('wasm.fftPermute', 'wasm.fftPermute.start', 'wasm.fftPermute.end')
//
//     fftPermuteComplex(inputComplex, new Array(2*n))
//     performance.mark('js.fftPermute.start')
//     for (var i=0; i<nIter; i++) {
//       // res = new Array(2*n)
//       fftPermuteComplex(inputComplex, res)
//     }
//     performance.mark('js.fftPermute.end')
//     performance.measure('js.fftPermute', 'js.fftPermute.start', 'js.fftPermute.end')
//
//     performance.mark('wasm.shiftBit.start')
//     for (var i=0; i<n; i++) {
//       wasm.shiftReverse(i)
//     }
//     performance.mark('wasm.shiftBit.end')
//     performance.measure('wasm.shiftBit', 'wasm.shiftBit.start', 'wasm.shiftBit.end')
//
//     performance.mark('js.shiftBit.start')
//     for (var i=0; i<n; i++) {
//       shiftBit(reverseBits(i))
//     }
//     performance.mark('js.shiftBit.end')
//     performance.measure('js.shiftBit', 'js.shiftBit.start', 'js.shiftBit.end')
//   })
// }

// var nIter = 1000
// var t0 = performance.now()
// for (var i=0; i<nIter; i++) {
//     wasm.sumArray(n)
// }
// var delta = performance.now() - t0
// console.log(`${delta/1000/nIter} per loop, ${delta/1000} in total`)
// const reducer = (accumulator, currentValue) => accumulator + currentValue
// t0 = performance.now()
// for (var i=0; i<nIter; i++) {
//     memory.reduce(reducer)
// }
// var delta1 = performance.now() - t0
// console.log(`${delta1/1000/nIter} per loop, ${delta1/1000} in total`)
// console.log(`wasm verison ${delta1 / delta}x faster`)
// var res = wasm.sumArray(n)
// console.log(`wasm.sumArray: ${res}`)
//

// function main () {
//   n = 128
//   x = new Array(n)
//   for (var i=0; i<n; i++) {
//     x[i] = new Complex([i, i])
//   }
//   var t0
//   var delta0
//   var delta1
//   var k_rec
//   var k_iter
//   var k_inv
//   var nIter = n**2
//   var plan = new FFT(n)
//   t0 = performance.now()
//   for (var i=0; i<nIter; i++) {
//     k_rec = plan.forward(x)
//   }
//   delta0 = performance.now() - t0
//   console.log(`FFT: ${delta0/1000/nIter}`)
//   t0 = performance.now()
//   for (var i=0; i<nIter; i++) {
//     k_iter = fft_it(x, false)
//   }
//   delta1 = performance.now() - t0
//   console.log(`FFT: ${delta1/1000/nIter}`)
//   console.log(`iterative is ${delta0 / delta1} times faster`)
//   k_inv = fft_it(k_iter, true)
//   // console.log(k_inv)
// }
