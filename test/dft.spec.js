const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { performance } = require('perf_hooks')

const Complex = require('complex.js')

const { NDArray } = require('../src/ndarray.js')
const dft = require('./../src/dft.js')

const topDir = path.dirname(__dirname)
const dataDir = path.join(__dirname, 'data')

var testVectors, sizes, sizes2D
var thresh = 1e-3

/**
 * absolute(a - b) <= (atol + rtol * absolute(b))
 * @param  {[type]} x       [description]
 * @param  {[type]} y       [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
const allClose = function (a, b, _options) {
  var options = {
    rtol:1e-05,
    atol:1e-08
  }
  if (options !== undefined) {
    options = Object.assign(options, _options)
  }
  return Math.abs(a - b) <= options.atol + (options.rtol * Math.abs(b))
}

before(function () {
  var testVecFilePath = path.join(dataDir, 'test_vectors.json')
  testVectors = JSON.parse(fs.readFileSync(testVecFilePath))
  sizes = Object.keys(testVectors['complex'])
  sizes = [8]
  sizes2D = Object.keys(testVectors['2d']['complex'])
  sizes2D = [8]
  // sizes = [8, 32, 512, 2048, 8192]
})

// describe.skip('fftReal2Complex', function () {
//   it('should produce the same results as test vectors', function () {
//     this.timeout(5000)
//     sizes.forEach((n) => {
//       var inputReal = testVectors['real'][n]['in']
//       var expected = testVectors['real'][n]['out']
//       var t0 = performance.now()
//       var testFFT = dft.fftReal2Complex(inputReal, false)
//       var delta = (performance.now() - t0)/1000
//       // console.log(`fftReal2Complex: ${delta} sec`)
//       for (var i=0; i<2*n; i++) {
//         var delta = Math.abs(testFFT[i] - expected[i])
//         assert.equal(delta < thresh, true)
//       }
//     })
//   })
//   it('should reproduce input', function () {
//     this.timeout(5000)
//     sizes.forEach((n) => {
//       var inputReal = testVectors['real'][n]['in']
//       var t0 = performance.now()
//       var forwardFFT = dft.fftReal2Complex(inputReal, false)
//       var delta = (performance.now() - t0)/1000
//       // console.log(`fftReal2Complex (forward): ${delta} sec`)
//       var t0 = performance.now()
//       var backwardFFT = dft.fftComplex2Complex(forwardFFT, true)
//       var delta = (performance.now() - t0)/1000
//
//       // console.log(`fftReal2Complex (backward): ${delta} sec`)
//       for (var i=0; i<n; i++) {
//         var delta = Math.abs(backwardFFT[2*i] - inputReal[i])
//         assert.equal(delta < thresh, true)
//       }
//     })
//   })
// })

describe('fftComplex2Complex', function () {
  it('should produce the same results as test vectors', function () {
    this.timeout(5000)
    sizes.forEach((n) => {
      var input = testVectors['complex'][n]['in']
      var expected = testVectors['complex'][n]['out']

      var input = new NDArray([n, 2], {array: input})
      var expected = new NDArray([n, 2], {array: expected})
      var testFFT = new NDArray([n, 2])

      var t0 = performance.now()
      dft.fftComplex2Complex(input._array, testFFT._array, false, n, 0, 1)
      testFFT.print()
      expected.print()
      var delta = (performance.now() - t0)/1000
      // console.log(`fftComplex2Complex: ${delta} sec`)
      for (var i=0; i<input.size; i++) {
        var close = allClose(testFFT._array[i], expected._array[i])
        assert.equal(close, true)
      }
    })
  })
  // it('should reproduce input', function () {
  //   this.timeout(5000)
  //   sizes.forEach((n) => {
  //     var input = new NDArray([n, 2], {array:testVectors['complex'][n]['in']})
  //     var forwardFFT = new NDArray([n, 2])
  //     var backwardFFT = new NDArray([n, 2])
  //     var t0 = performance.now()
  //     var forwardFFT = dft.fftComplex2Complex(input, forwardFFT, false)
  //     var delta = (performance.now() - t0)/1000
  //     // console.log(`fftComplex2Complex (forward): ${delta} sec`)
  //     var t0 = performance.now()
  //     var backwardFFT = dft.fftComplex2Complex(forwardFFT, backwardFFT, true)
  //     var delta = (performance.now() - t0)/1000
  //     // console.log(`fftComplex2Complex (backward): ${delta} sec`)
  //     for (var i=0; i<2*n; i++) {
  //       var close = allClose(input._array[i], backwardFFT._array[i])
  //       assert.equal(close, true)
  //     }
  //   })
  // })
})

// describe('transposeComplex', function () {
//   it('should produce transpose of input', function () {
//     sizes2D.forEach(n => {
//       var inputComplex = testVectors['2d']['complex'][n]['in']
//       var inputComplexTranspose = testVectors['2d']['complex'][n]['in_transpose']
//       var transposed = dft.transposeComplex(inputComplex)
//       for (var r=0; r<transposed.length; r++ ){
//         for (var c=0; c<transposed[0].length; c++) {
//           assert.equal(transposed[r][c] == inputComplexTranspose[r][c], true)
//         }
//       }
//     })
//   })
// })

// describe.skip('transposeReal', function () {
//   it('should produce transpose of input', function () {
//
//   })
// })

describe('fftComplex2Complex2d', function () {
  it('should produce the same results as test vectors', function () {
    sizes2D.forEach(n => {
      // var input = new NDArray([n,n,2], {array: testVectors['2d']['complex'][n]['in']})
      // var expected = new NDArray([n,n,2], {array: testVectors['2d']['complex'][n]['out']})
      var input = testVectors['2d']['complex'][n]['in']
      input = input.reduce((accum, val)=>{return accum.concat(val)}, [])

      var expected = testVectors['2d']['complex'][n]['out']
      expected = expected.reduce((accum, val)=>{return accum.concat(val)}, [])

      var input = new NDArray([n,n,2], {array: input})
      var expected = new NDArray([n,n,2], {array: expected})
      var testFFT = new NDArray([n,n,2])
      testFFT._array.fill(0.0)
      dft.fftComplex2Complex2d(input._array, testFFT._array,[n,n],false)
      expected.print()
      testFFT.print()
      for (var i=0; i<testFFT.size; i++) {
        var close = allClose(testFFT._array[i], expected._array[i], {atol:1e-5,rtol:1e-3})
        assert.equal(close, true)
      }          // console.log(`test[${r}][${c}]: ${test[r][c]}, expected[${r}][${c}]: ${expected[r][c]}`)
    })
  })
})
