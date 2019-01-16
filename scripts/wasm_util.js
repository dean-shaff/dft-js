const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const wabt = require("wabt")();

const build = function (in_file_path, out_file_path) {
	var wasmModule = wabt.parseWat(
		in_file_path,
		readFileSync(in_file_path, 'utf8')
	)
	var { buffer } = wasmModule.toBinary({})
	writeFileSync(out_file_path, Buffer.from(buffer))
}

const instantiate = async function (in_file_path) {
	var buffer = readFileSync(in_file_path)
	var module = await WebAssembly.compile(buffer)
	var instance = await WebAssembly.instantiate(module, {
		console: {
			log: (x, y) => console.log(x, y)
		}
	})
	return instance.exports
}

exports.build = build
exports.instantiate = instantiate