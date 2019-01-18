const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { performance } = require('perf_hooks')

const Complex = require('complex.js')

const { build, instantiate } = require('./../scripts/wasm_util.js')
const { fft, reverseBits, shiftBit } = require('./../src/fft.js')

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

describe('fft wasm', function () {
	var wasm
	var nIter = 100
	before(function () {
		// build(watPath, wasmPath)
	})
	beforeEach(async function () {
		wasm = await instantiate(wasmPath)
	})
	it('should calculate the exponent', function () {
		var x = Math.random()
		var resExpected = Math.exp(x)
		var resTest = wasm.exp(x)
		assert.equal(resExpected, resTest)
	})
	it('should calculate sin and cos', function () {
		var r = () => {return Math.random()*Math.PI/2}
		for (var n=-nIter; n<nIter; n++){
			var x = [n*r(),
							 n*Math.PI/2 + r(),
						 	 n*Math.PI + r(),
							 n*(3*Math.PI/2) + r()]
			for (var i=0; i<x.length; i++) {
				// var x = 2*Math.PI*Math.random()
				// var x = 2.3211475649426534
				var x_i = x[i]
				var expected = Math.sin(x_i)
				var test = wasm.sin_f64(x_i)
				assert.equal(Math.abs(expected - test) < thresh, true)

				var expected = Math.cos(x_i)
				var test = wasm.cos_f64(x_i)
				assert.equal(Math.abs(expected - test) < thresh, true)

				// console.log(x_i, expected, test)
			}
		}
	})
	it('should calculate the bit reversal of the integer', function () {
		var n = 2048
		var expected
		var test
		for (var i=0; i<n; i++) {
			expected = reverseBits(i)
			test = wasm.reverseBits(i)
			assert.equal(expected, test)
		}
	})
	it('should shift reversed bits', function () {
		var n = 2048
		var p = Math.log2(n)
		var expected
		var test
		for (var i=0; i<n; i++) {
			expected = shiftBit(reverseBits(i), p)
			test = wasm.shiftBit(wasm.reverseBits(i), p)
			assert.equal(expected, test)
		}
	})
	it('should permute input data', function () {
		var n = 2048
		var p = Math.log2(n)
		var input = testVectors[n]['in']
		var expected = testVectors[n]['out']
		const memory = new Float64Array(wasm.memory.buffer, 0, 4*n) // twice as much space for result, 2 for complex
		var permuted = new Array(2*n)
		for (var i=0; i<n; i++) {
			memory[2*i] = input[i][0]
			memory[2*i + 1] = input[i][1]
			var reversedIdx = reverseBits(i) >> (32 - p)
			reversedIdx = reversedIdx < 0 ? n+reversedIdx: reversedIdx
			permuted[2*i] = input[reversedIdx][0]
			permuted[2*i + 1] = input[reversedIdx][1]
		}
		wasm.fftPermute(n, p, 0)
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
		var input = testVectors[n]['in']
		var inputComplex = input.map((c) => {
			return new Complex([c[0], c[1]])
		})
		var t0 = performance.now()
		var f = fft(inputComplex, false)
		console.log(`Took ${(performance.now() - t0)} to compute fft`)
		var expected = testVectors[n]['out']
		for (var i=0; i<n; i++) {
			memory[2*i] = input[i][0]
			memory[2*i + 1] = input[i][1]
		}
		var t0 = performance.now()
		wasm.fft(n, -1)
		console.log(`Took ${(performance.now() - t0)} to compute wasm.fft`)
		for (var i=0; i<n; i++) {
			// console.log(`i=${i}: input: expected: ${input[i]}, actual: ${memory[2*i]},${memory[2*i + 1]}`)
			// console.log(`i=${i}: output: expected: ${expected[i]}, actual: ${memory[2*n + 2*i]},${memory[2*n + 2*i + 1]}`)

			assert.equal(Math.abs(memory[2*n + 2*i] - expected[i][0]) < thresh, true)
			assert.equal(Math.abs(memory[2*n + 2*i + 1] - expected[i][1]) < thresh, true)
		}

	})
})


describe.skip('fft', function () {

	it('should produce the same results as test vectors', function () {
		Object.keys(testVectors).forEach((n) => {
			var input = testVectors[n]['in']
			var expected = testVectors[n]['out']
			var inputComplex = input.map((c) => {
				return new Complex([c[0], c[1]])
			})
			var expectedComplex = expected.map((c) => {
				return new Complex([c[0], c[1]])
			})
			var testFFT = fft(inputComplex, false)
			for (var i=0; i<n; i++) {
				var delta = testFFT[i].sub(expectedComplex[i])
				assert.equal(delta.abs() < thresh, true)
			}
		})
	})
	it('inverse should produce original input', function () {
		Object.keys(testVectors).forEach((n) => {
			var input = testVectors[n]['in']
			var inputComplex = input.map((c) => {
				return new Complex([c[0], c[1]])
			})
			var forwardFFT = fft(inputComplex, false)
			var backwardFFT = fft(forwardFFT, true)
			for (var i=0; i<n; i++) {
				var delta = backwardFFT[i].sub(inputComplex[i])
				assert.equal(delta.abs() < thresh, true)
			}
		})
	})
})
