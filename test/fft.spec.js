const path = require('path')
const assert = require('assert')

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
		var n = 10
		const memory = new Uint32Array(wasm.memory.buffer, 0, n)
		// memory.fill(1)
		for (var i=0; i<n; i++){
			memory[i] = i
		}
		console.log(memory)
		// var res = parseInt(wasm.sumArray(n),2)
		var res = wasm.sumArray(n)
		console.log(`wasm.sumArray: ${res}`)
		// assert.equal(res, 10)
	})

})
