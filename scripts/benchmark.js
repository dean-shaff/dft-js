const { performance } = require('perf_hooks')

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

function main () {
  n = 128
  x = new Array(n)
  for (var i=0; i<n; i++) {
    x[i] = new Complex([i, i])
  }
  var t0
  var delta0
  var delta1
  var k_rec
  var k_iter
  var k_inv
  var nIter = n**2
  var plan = new FFT(n)
  t0 = performance.now()
  for (var i=0; i<nIter; i++) {
    k_rec = plan.forward(x)
  }
  delta0 = performance.now() - t0
  console.log(`FFT: ${delta0/1000/nIter}`)
  t0 = performance.now()
  for (var i=0; i<nIter; i++) {
    k_iter = fft_it(x, false)
  }
  delta1 = performance.now() - t0
  console.log(`FFT: ${delta1/1000/nIter}`)
  console.log(`iterative is ${delta0 / delta1} times faster`)
  k_inv = fft_it(k_iter, true)
  // console.log(k_inv)
}
