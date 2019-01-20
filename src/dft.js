const { performance } = require('perf_hooks')
const Complex = require('complex.js')

const { NDArray } = require('./ndarray.js')

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
  var n = x.shape[0] / 2
  var log_n = Math.log2(n)
  var idx = 0
  for (var i=0; i<n; i++) {
    idx = shiftBit(reverseBits(i), log_n)
    // res.set([2*i], x.get([2*idx]))
    // res.set([2*i + 1], x.get([2*idx + 1]))
    res._array[2*i] = x._array[2*idx]
    res._array[2*i + 1] = x._array[2*idx + 1]
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

    var n = x.shape[0] / 2
    var log_n = Math.log2(n)

    // var t0 = performance.now()
    fftPermuteComplex(x, res)
    // var delta = (performance.now() - t0) / 1000
    // console.log(`fftPermuteComplex took ${delta} seconds`)

    var incr, theta, theta_exp_re,
        theta_exp_im, omega_re, omega_im,
        even_re, even_im, odd_re, odd_im, c,
        k_offset, k_offset_incr_2

    var resOffset = res._offset
    var resStride = res._strides[0]
    // console.log(offset, stride)

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
          k_offset = resOffset + resStride*2*(offset + k)
          k_offset_incr_2 = resOffset + resStride*2*(offset + k + incr/2)
          // var t0 = performance.now()
          // even_re = res.get([2*(offset + k)])
          // even_im = res.get([2*(offset + k) + 1])
          // odd_re = res.get([2*(offset + k + incr/2)])
          // odd_im = res.get([2*(offset + k + incr/2) + 1])
          even_re = res._array[k_offset]
          even_im = res._array[k_offset + 1 ]
          odd_re = res._array[k_offset_incr_2]
          odd_im = res._array[k_offset_incr_2 + 1]

          c = complexMul(
            odd_re, odd_im, omega_re, omega_im)
          odd_re = c[0]
          odd_im = c[1]

          c = complexMul(
            omega_re, omega_im, theta_exp_re, theta_exp_im)
          omega_re = c[0]
          omega_im = c[1]

          // res.set([2*(offset + k)], even_re + odd_re)
          // res.set([2*(offset + k) + 1], even_im + odd_im)
          // res.set([2*(offset + k + incr/2)], even_re - odd_re)
          // res.set([2*(offset + k + incr/2) + 1], even_im - odd_im)

          res._array[k_offset] = even_re + odd_re
          res._array[k_offset + 1] = even_im + odd_im
          res._array[k_offset_incr_2] = even_re - odd_re
          res._array[k_offset_incr_2 + 1] = even_im - odd_im

          // var delta = (performance.now() - t0) / 1000
          // console.log(`inner loop took ${delta} seconds`)

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

const fftComplex2Complex2d = function (x, res, inverse) {
  // var t0 = performance.now()
  for (var i=0; i<x.shape[0]; i++) {
    fftComplex2Complex(x.view(0, i), res.view(0, i), inverse)
  }
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: fft on rows took ${delta} sec`)

  // var t0 = performance.now()
  // res = transposeComplex(res)
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: transpose (0) took ${delta} sec`)


  // var t0 = performance.now()
  for (var i=0; i<x.shape[1]; i++) {
    fftComplex2Complex(x.view(1, i), res.view(1, i), inverse)
    // res[i] = fftComplex2Complex(res[i], inverse)
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
// exports.fftPermuteReal = fftPermuteReal
exports.fftPermuteComplex = fftPermuteComplex
// exports.fftReal2Complex = fftReal2Complex
exports.fftComplex2Complex = fftComplex2Complex
// exports.transposeComplex = transposeComplex
exports.fftComplex2Complex2d = fftComplex2Complex2d
