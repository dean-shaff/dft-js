const path = require('path')
const assert = require('assert')
const { performance } = require('perf_hooks')

const { build, instantiate } = require('./../scripts/wasm_util.js')

const topDir = path.dirname(__dirname)
const srcDir = path.join(topDir, 'src')
const buildDir = path.join(topDir, 'build')
const watPath = path.join(srcDir, 'fft.wat')
const wasmPath = path.join(buildDir, 'fft.wasm')

describe('test wasm', function () {
	var wasm
	before(function () {
		build(watPath, wasmPath)
	})
	beforeEach(async function () {
		wasm = await instantiate(wasmPath)
	})
	it('should sum two numbers', function () {
		var res = wasm.sum(7, 6)
		assert.equal(res, 13)
	})
	it('should sum up an array', function () {
		var n = 10000
		const memory = new Uint32Array(wasm.memory.buffer, 0, n)
		// memory.fill(1)
		for (var i=0; i<n; i++){
			memory[i] = i
		}
		// var res = parseInt(wasm.sumArray(n),2)
		var nIter = 1000
		var t0 = performance.now()
		for (var i=0; i<nIter; i++) {
			wasm.sumArray(n)
		}
		var delta = performance.now() - t0
		console.log(`${delta/1000/nIter} per loop, ${delta/1000} in total`)
		const reducer = (accumulator, currentValue) => accumulator + currentValue
		t0 = performance.now()
		for (var i=0; i<nIter; i++) {
			memory.reduce(reducer)
		}
		var delta1 = performance.now() - t0
		console.log(`${delta1/1000/nIter} per loop, ${delta1/1000} in total`)
		console.log(`wasm verison ${delta1 / delta}x faster`)
		var res = wasm.sumArray(n)
		console.log(`wasm.sumArray: ${res}`)
		// assert.equal(res, 10)
	})

})
