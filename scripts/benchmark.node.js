const fs = require('fs')
const path = require('path')
const { performance } = require('perf_hooks')

const Complex = require('complex.js')

const { build, buildBinaryen, instantiate } = require('./wasm_util.js')
const dft = require('./../src/dft.js')
const { NDArray } = require('./../src/ndarray.js')
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

const ndarrayBenchmark = function (nIter, now) {
  var size = 1e2
  var arr = new Array(size)
  for (var i=0; i<size; i++) {
    arr[i] = new Array(size)
  }
  var arrnd = new NDArray([size, size])
  report = {
    'nIter': nIter,
    'Array': {},
    'NDArray': {}
  }
  for (var i=0; i<nIter; i+=1) {
    var t0 = now()
    for (var j=0; j<size; j++){
      for (var k=0; k<size; k++) {
        arr[j][k] = 0.0
      }
    }
    var delta = now() - t0
    report['Array'][size] = delta
    t0 = now()
    for (var j=0; j<size; j++){
      for (var k=0; k<size; k++) {
        arrnd.set([j, k], 0.0)
      }
    }
    var delta = now() - t0
    report['NDArray'][size] = delta

  }
  return report

}

const fftBenchmark1d = function (nIter, testVectors, testSizes, now) {
  var report = {'nIter': nIter}
  report['fftComplex2Complex'] = {}
  testSizes.forEach(n => {
    // var x = testVectors[n]['in']
    // var x = x.reduce((accum, val)=>{
    //   return accum.concat(val)
    // }, [])
    // var x = new NDArray([n,2], {array: x})
    // var x = testVectors[n]
    var x = new NDArray([n,2])
    x._array.fill(0.0)
    var y = new NDArray([n,2])
    var t0 = now()
    for (var i=0; i<nIter; i++) {
      dft.fftComplex2Complex(x, y, false)
    }
    var delta = now() - t0
    report['fftComplex2Complex'][n] = delta
  })
  return report
}

const fftBenchmark2d = function (nIter, testVectors, testSizes, now) {
  var report = {'nIter': nIter}
  report['fftComplex2Complex2d'] = {}
  testSizes.forEach(n => {
    // var x = testVectors[n]['in']
    // var x = x.reduce((accum, val)=>{
    //   return accum.concat(val)
    // }, [])
    // var x = new NDArray([n,2], {array: x})
    var x = testVectors[n]
    var x = new NDArray([n,n,2])
    x._array.fill(0.0)
    var y = new NDArray([n,n,2])
    var t0 = now()
    for (var i=0; i<nIter; i++) {
      dft.fftComplex2Complex2d(x, y, false)
    }
    var delta = now() - t0
    report['fftComplex2Complex2d'][n] = delta
  })
  return report
}

// const fft2dBenchmark = function (nIter, testVectors, testSizes, now) {
//
// }

if (typeof require != 'undefined' && require.main == module) {
  // var report = ndarrayBenchmark(2000, performance.now)
  // benchmark.formatReport(report)
  // var testVectors = loadTestVectors()
  // var fftComplex2Complex = function (x, y) {
  //   return dft.fftComplex2Complex(x, y, false)
  // }
  var testVectors1d = {}
  // var returnVectors1d = {}
  // Object.keys(testVectors['complex']).forEach((n) => {
  //   testVectors1d[n] = new NDArray([n,2], {array: testVectors['complex'][n]['in']})
  //   // returnVectors1d[n] = new NDArray([n,2])
  // })

  var testVectors2d = {}
  // var returnVectors2d = {}
  // Object.keys(testVectors['2d']['complex']).forEach((n) => {
  //   var arr = testVectors['2d']['complex'][n]['in']
  //   arr.reduce((accum, val) => {return accum.concat(val)},[])
  //   testVectors2d[n] = new NDArray([n,n,2], {array: arr})
  //   // returnVectors2d[n] = new NDArray([n,n,2])
  // })


  var report = fftBenchmark1d(
    2000,
    // [fftComplex2Complex],
    testVectors1d,
    // returnVectors1d,
    [32, 512, 2048],
    performance.now,
    // NDArray
  )
  benchmark.formatReport(report)
  var fftComplex2Complex2d = function(x, y) {
    return dft.fftComplex2Complex2d(x, y, false)
  }
  var report = fftBenchmark2d(
    2000,
    // [fftComplex2Complex2d],
    testVectors2d,
    // returnVectors2d,
    [256],
    performance.now,
    // NDArray
  )
  benchmark.formatReport(report)
}
