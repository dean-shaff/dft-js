const fs = require('fs')
const path = require('path')
const { performance } = require('perf_hooks')

const Complex = require('complex.js')

const { build, buildBinaryen, instantiate } = require('./wasm_util.js')
const dft = require('./../src/dft.js')
const benchmark = require('./benchmark.js')

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

// const fftBenchmark = function (nIter, testVectors, testSizes, now) {
//   var report = {'nIter': nIter}
//   report['fftComplex2Complex'] = {}
//   testSizes.forEach(n => {
//     var x = testVectors[n]['in']
//     var x = x.reduce((accum, val)=>{
//       return accum.concat(val)
//     }, [])
//     var t0 = now()
//     for (var i=0; i<nIter; i++) {
//       dft.fftComplex2Complex(x, false)
//     }
//     var delta = now() - t0
//     report['fftComplex2Complex'][n] = delta
//   })
//   return report
// }

// const fft2dBenchmark = function (nIter, testVectors, testSizes, now) {
//
// }

if (typeof require != 'undefined' && require.main == module) {
  var testVectors = loadTestVectors()
  var fftComplex2Complex = function (x) {
    return dft.fftComplex2Complex(x, false)
  }
  var report = benchmark.fftBenchmark(
    2000,
    [fftComplex2Complex],
    testVectors['complex'],
    [512, 2048],
    performance.now
  )
  benchmark.formatReport(report)
  var fftComplex2Complex2d = function(x) {
    return dft.fftComplex2Complex2d(x, false)
  }
  var report = benchmark.fftBenchmark(
    2000,
    [fftComplex2Complex2d],
    testVectors['2d']['complex'],
    [8, 32, 128, 256],
    performance.now
  )
  benchmark.formatReport(report)
}
