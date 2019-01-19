const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { performance } = require('perf_hooks')

const Complex = require('complex.js')

const { build, instantiate } = require('./../scripts/wasm_util.js')
const dft = require('./../src/dft.js')

const topDir = path.dirname(__dirname)
const srcDir = path.join(topDir, 'src')
const buildDir = path.join(topDir, 'build')
const watPath = path.join(srcDir, 'fft.wat')
const wasmPath = path.join(buildDir, 'fft.wasm')
const dataDir = path.join(__dirname, 'data')

var testVectors
var thresh = 1e-3

before(function () {
  var testVecFilePath = path.join(dataDir, 'test_vectors.json')
  testVectors = JSON.parse(fs.readFileSync(testVecFilePath))
})

describe.skip('wasm.fft_c2c', function () {
  var wasm
  var nIter = 100
  before(function () {
    // build(watPath, wasmPath)
  })
  beforeEach(async function () {
    wasm = await instantiate(wasmPath)
  })
  it('should calculate the bit reversal of the integer', function () {
    var n = 2048
    var expected
    var test
    for (var i=0; i<n; i++) {
      expected = dft.reverseBits(i)
      test = wasm.reverse_bits(i)
      assert.equal(expected, test)
    }
  })
  it('should shift reversed bits', function () {
    var n = 2048
    var p = Math.log2(n)
    var expected
    var test
    for (var i=0; i<n; i++) {
      expected = dft.shiftBit(dft.reverseBits(i), p)
      test = wasm.shift_bit(wasm.reverse_bits(i), p)
      assert.equal(expected, test)
    }
  })
  it('should permute input data', function () {
    var n = 2048
    var p = Math.log2(n)
    var input = testVectors['complex'][n]['in']
    var expected = testVectors['complex'][n]['out']
    const memory = new Float64Array(wasm.memory.buffer, 0, 4*n) // twice as much space for result, 2 for complex
    var permuted = new Array(2*n)
    for (var i=0; i<n; i++) {
      memory[2*i] = input[2*i]
      memory[2*i + 1] = input[2*i + 1]
      var reversedIdx = dft.shiftBit(dft.reverseBits(i))
      permuted[2*i] = input[2*reversedIdx]
      permuted[2*i + 1] = input[2*reversedIdx + 1]
    }
    wasm.fft_permute_c(n, p, 0)
    // console.log('\n')
    for (var i=0; i<n; i++) {
      assert.equal(permuted[2*i], memory[2*i + 2*n])
      assert.equal(permuted[2*i + 1], memory[2*i + 1 + 2*n])
    }
  })
  it('should do complex multiplication', function () {
    for (var i=-1000; i<1000; i++) {
      var c0 = new Complex([i*Math.random(), i*Math.random()])
      var c1 = new Complex([i*Math.random(), i*Math.random()])
      var c_mul = c0.mul(c1)

      var c_mul_re = wasm.complex_mul_re(c0.re, c0.im, c1.re, c1.im)
      var c_mul_im = wasm.complex_mul_im(c0.re, c0.im, c1.re, c1.im)

      assert.equal(c_mul_re, c_mul.re)
      assert.equal(c_mul_im, c_mul.im)
    }
  })

  it('should compute fft', function () {
    var n = 2048
    const memory = new Float64Array(wasm.memory.buffer, 0, 4*n) // twice as much space for result, 2 for complex
    var input = testVectors['complex'][n]['in']
    var t0 = performance.now()
    var f = dft.fftComplex2Complex(input, false)
    // console.log(`Took ${(performance.now() - t0)} to compute fft`)
    var expected = testVectors['complex'][n]['out']
    for (var i=0; i<n; i++) {
      memory[2*i] = input[2*i]
      memory[2*i + 1] = input[2*i + 1]
    }
    var t0 = performance.now()
    wasm.fft_c2c(n, -1)
    // console.log(`Took ${(performance.now() - t0)} to compute wasm.fft`)
    for (var i=0; i<n; i++) {
      // console.log(`i=${i}: input: expected: ${input[i]}, actual: ${memory[2*i]},${memory[2*i + 1]}`)
      // console.log(`i=${i}: output: expected: ${expected[i]}, actual: ${memory[2*n + 2*i]},${memory[2*n + 2*i + 1]}`)
      assert.equal(Math.abs(memory[2*n + 2*i] - expected[i][0]) < thresh, true)
      assert.equal(Math.abs(memory[2*n + 2*i + 1] - expected[i][1]) < thresh, true)
    }

  })
})
