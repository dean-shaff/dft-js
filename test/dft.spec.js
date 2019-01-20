const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { performance } = require('perf_hooks')

const Complex = require('complex.js')

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
  // sizes = [8, 32, 512, 2048, 8192]
})

describe.skip('fftReal2Complex', function () {
  it('should produce the same results as test vectors', function () {
    this.timeout(5000)
    sizes.forEach((n) => {
      var inputReal = testVectors['real'][n]['in']
      var expected = testVectors['real'][n]['out']
      var t0 = performance.now()
      var testFFT = dft.fftReal2Complex(inputReal, false)
      var delta = (performance.now() - t0)/1000
      // console.log(`fftReal2Complex: ${delta} sec`)
      for (var i=0; i<2*n; i++) {
        var delta = Math.abs(testFFT[i] - expected[i])
        assert.equal(delta < thresh, true)
      }
    })
  })
  it('should reproduce input', function () {
    this.timeout(5000)
    sizes.forEach((n) => {
      var inputReal = testVectors['real'][n]['in']
      var t0 = performance.now()
      var forwardFFT = dft.fftReal2Complex(inputReal, false)
      var delta = (performance.now() - t0)/1000
      // console.log(`fftReal2Complex (forward): ${delta} sec`)
      var t0 = performance.now()
      var backwardFFT = dft.fftComplex2Complex(forwardFFT, true)
      var delta = (performance.now() - t0)/1000

      // console.log(`fftReal2Complex (backward): ${delta} sec`)
      for (var i=0; i<n; i++) {
        var delta = Math.abs(backwardFFT[2*i] - inputReal[i])
        assert.equal(delta < thresh, true)
      }
    })
  })
})

describe('fftComplex2Complex', function () {
  it('should produce the same results as test vectors', function () {
    this.timeout(5000)
    sizes.forEach((n) => {
      var input = testVectors['complex'][n]['in']
      var expected = testVectors['complex'][n]['out']
      var t0 = performance.now()
      var testFFT = dft.fftComplex2Complex(input, false)
      var delta = (performance.now() - t0)/1000
      // console.log(`fftComplex2Complex: ${delta} sec`)
      for (var i=0; i<2*n; i++) {
        var delta = Math.abs(testFFT[i] - expected[i])
        assert.equal(delta < thresh, true)
      }
    })
  })
  it('should reproduce input', function () {
    this.timeout(5000)
    sizes.forEach((n) => {
      var input = testVectors['complex'][n]['in']
      var t0 = performance.now()
      var forwardFFT = dft.fftComplex2Complex(input, false)
      var delta = (performance.now() - t0)/1000
      // console.log(`fftComplex2Complex (forward): ${delta} sec`)
      var t0 = performance.now()
      var backwardFFT = dft.fftComplex2Complex(forwardFFT, true)
      var delta = (performance.now() - t0)/1000
      // console.log(`fftComplex2Complex (backward): ${delta} sec`)
      for (var i=0; i<2*n; i++) {
        var delta = Math.abs(backwardFFT[i] - input[i])
        assert.equal(delta < thresh, true)
      }
    })
  })
})

describe('transposeComplex', function () {
  it('should produce transpose of input', function () {
    sizes2D.forEach(n => {
      var inputComplex = testVectors['2d']['complex'][n]['in']
      var inputComplexTranspose = testVectors['2d']['complex'][n]['in_transpose']
      var transposed = dft.transposeComplex(inputComplex)
      for (var r=0; r<transposed.length; r++ ){
        for (var c=0; c<transposed[0].length; c++) {
          assert.equal(transposed[r][c] == inputComplexTranspose[r][c], true)
        }
      }
    })
  })
})

describe.skip('transposeReal', function () {
  it('should produce transpose of input', function () {

  })
})

describe.skip('fftComplex2Complex2d', function () {
  it('should produce the same results as test vectors', function () {
    sizes2D.forEach(n => {
      var input = testVectors['2d']['complex'][n]['in']
      var expected = testVectors['2d']['complex'][n]['out']
      var test = dft.fftComplex2Complex2d(input)
      for (var r=0; r<test.length; r++ ){
        for (var c=0; c<test[0].length; c++) {
          // console.log(`test[${r}][${c}]: ${test[r][c]}, expected[${r}][${c}]: ${expected[r][c]}`)
          assert.equal(allClose(test[r][c], expected[r][c], {atol:1e-5,rtol:1e-3}), true)
        }
      }
    })
  })
})
