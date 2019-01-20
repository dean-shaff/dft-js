const { performance } = require('perf_hooks')
const Complex = require('complex.js')

const { NDArray } = require('ndarray.js')

const reverseBits = function (i) {
  var mask = 0x55555555; // 0101...
  i = ((i & mask) << 1) | ((i >> 1) & mask)
  mask = 0x33333333 // 0011...
  i = ((i & mask) << 2) | ((i >> 2) & mask)
  mask = 0x0f0f0f0f // 00001111...
  i = ((i & mask) << 4) | ((i >> 4) & mask)
  mask = 0x00ff00ff // 0000000011111111...
  i = ((i & mask) << 8) | ((i >> 8) & mask)
  // 00000000000000001111111111111111 no need for mask
  i = (i << 16) | (i >> 16)
  return i
}

const shiftBit = function (x, n) {
  return x >>> (32 - n)
}

const complexMul = function (re0, im0, re1, im1) {
  return [
    (re0*re1) - (im0*im1),
    (re0*im1) + (re1*im0)
  ]
}

const fftPermuteComplex = function (x, res) {
  var n = x.shape[0]
  var log_n = Math.log2(n)
  var idx = 0
  for (var i=0; i<n; i++) {
    idx = shiftBit(reverseBits(i), log_n)
    res.set([i, 0]) = x.get([idx, 0])
    res.set([i, 1]) = x.get([idx, 1])
    // res[2*i] = x[2*idx]
    // res[2*i + 1] = x[2*idx + 1]
  }
}


/**
 * Compute the discrete fourier transform of an input Array, using the
 * fast fourier transform.
 * @param  {[type]} x       [description]
 * @param  {[type]} inverse [description]
 * @return {[type]}         [description]
 */
const fftComplex2Complex = function (x, res, inverse) {
    if (inverse === undefined) {
      inverse = false
    }
    inverse = inverse ? 1: -1

    var n = x.shape[0]
    var log_n = Math.log2(n)

    fftPermuteComplex(x, res)

    var incr, theta, theta_exp_re,
        theta_exp_im, omega_re, omega_im,
        even_re, even_im, odd_re, odd_im, c

    for (var p = 1; p <= log_n; p++) {
      incr = 0x1 << p
      theta = (inverse*2*Math.PI)/incr
      theta_exp_re = Math.cos(theta)
      theta_exp_im = Math.sin(theta)
      // console.log(`theta_exp: ${theta_exp}`)
      for (var offset = 0; offset < n; offset += incr) {
        omega_re = 1.0
        omega_im = 0.0
        for (var k = 0; k < incr/2; k++) {
          even_re = res.get([offset + k, 0])
          even_im = res.get([offset + k, 1])
          odd_re = res.get([offset + k + incr/2, 0])
          odd_im = res.get([offset + k + incr/2, 1])

          c = complexMul(
            odd_re, odd_im, omega_re, omega_im)
          odd_re = c[0]
          odd_im = c[1]

          c = complexMul(
            omega_re, omega_im, theta_exp_re, theta_exp_im)
          omega_re = c[0]
          omega_im = c[1]

          res.set([offset + k, 0], even_re + odd_re)
          res.set([offset + k, 1], even_im + odd_im)
          res.set([offset + k + incr/2, 0], even_re - odd_re)
          res.set([offset + k + incr/2, 1], even_im - odd_im)

        }
      }
    }
    if (inverse == 1) {
      for (var i=0; i < n; i++) {
        res.set([i, 0], res.get([i, 0]) / n)
        res.set([i, 1], res.get([i, 1]) / n)
      }
    }
    return res
}

const fftComplex2Complex2d = function (x, inverse) {


  var res = new Array(x.length)
  // var t0 = performance.now()
  for (var i=0; i<x.length; i++) {
    res[i] = fftComplex2Complex(x[i], inverse)
  }
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: fft on rows took ${delta} sec`)

  // var t0 = performance.now()
  // res = transposeComplex(res)
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: transpose (0) took ${delta} sec`)


  // var t0 = performance.now()
  for (var i=0; i<res.length; i++) {
    res[i] = fftComplex2Complex(res[i], inverse)
  }
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: fft on cols took ${delta} sec`)

  // var t0 = performance.now()
  // res = transposeComplex(res)
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: transpose (1) took ${delta} sec`)

  return res
}


// const fftComplex2Complex2d = function (x, inverse) {
//   var res = new Array(x.length)
//   // var t0 = performance.now()
//   for (var i=0; i<x.length; i++) {
//     res[i] = fftComplex2Complex(x[i], inverse)
//   }
//   // var delta = (performance.now() - t0)/1000
//   // console.log(`fftComplex2Complex2d: fft on rows took ${delta} sec`)
//
//   // var t0 = performance.now()
//   res = transposeComplex(res)
//   // var delta = (performance.now() - t0)/1000
//   // console.log(`fftComplex2Complex2d: transpose (0) took ${delta} sec`)
//
//
//   // var t0 = performance.now()
//   for (var i=0; i<res.length; i++) {
//     res[i] = fftComplex2Complex(res[i], inverse)
//   }
//   // var delta = (performance.now() - t0)/1000
//   // console.log(`fftComplex2Complex2d: fft on cols took ${delta} sec`)
//
//   // var t0 = performance.now()
//   res = transposeComplex(res)
//   // var delta = (performance.now() - t0)/1000
//   // console.log(`fftComplex2Complex2d: transpose (1) took ${delta} sec`)
//
//   return res
// }

exports.shiftBit = shiftBit
exports.reverseBits = reverseBits
exports.fftPermuteReal = fftPermuteReal
exports.fftPermuteComplex = fftPermuteComplex
exports.fftReal2Complex = fftReal2Complex
exports.fftComplex2Complex = fftComplex2Complex
exports.transposeComplex = transposeComplex
exports.fftComplex2Complex2d = fftComplex2Complex2d
