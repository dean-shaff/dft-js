const { performance } = require('perf_hooks')
const Complex = require('complex.js')

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

const fftPermuteReal = function (x, res) {
  var n = x.length
  var log_n = Math.log2(n)
  var idx
  for (var i=0; i<n; i++){
    idx = shiftBit(reverseBits(i), log_n)
    res[2*i] = x[idx]
    res[2*i + 1] = 0.0
  }
}

const fftPermuteComplex = function (x, res) {
  var n = x.length / 2
  var log_n = Math.log2(n)
  var idx = 0
  for (var i=0; i<n; i++) {
    idx = shiftBit(reverseBits(i), log_n)
    res[2*i] = x[2*idx]
    res[2*i + 1] = x[2*idx + 1]
  }
}

/**
 * Compute the discrete fourier transform of an input Array, using the
 * fast fourier transform.
 * @param  {[type]} x       [description]
 * @param  {[type]} inverse [description]
 * @return {[type]}         [description]
 */
const fftComplex2Complex = function (x, inverse) {
    if (inverse === undefined) {
      inverse = false
    }
    inverse = inverse ? 1: -1

    if (x[0].constructor === Object) {
      x = x.reduce((accum, val) => {
        return accum.concat([val.re, val.im])
      }, [])
    } else if (x[0].constructor == Array) {
      x = x.reduce((accum, val) => {
        return accum.concat(val)
      }, [])
    }

    var n = x.length / 2
    var log_n = Math.log2(n)
    var res = new Array(2*n)

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
          even_re = res[2*(offset + k)]
          even_im = res[2*(offset + k) + 1]
          odd_re = res[2*(offset + k + incr/2)]
          odd_im = res[2*(offset + k + incr/2) + 1]

          c = complexMul(
            odd_re, odd_im, omega_re, omega_im)
          odd_re = c[0]
          odd_im = c[1]

          c = complexMul(
            omega_re, omega_im, theta_exp_re, theta_exp_im)
          omega_re = c[0]
          omega_im = c[1]

          res[2*(offset + k)] = even_re + odd_re
          res[2*(offset + k) + 1] = even_im + odd_im
          res[2*(offset + k + incr/2)] = even_re - odd_re
          res[2*(offset + k + incr/2) + 1] = even_im - odd_im

        }
      }
    }
    if (inverse == 1) {
      for (var i=0; i < 2*n; i++) {
        res[i] = res[i] / n
      }
    }
    return res
}

const fftReal2Complex = function (x, inverse) {
  if (inverse === undefined) {
    inverse = false
  }
  inverse = inverse ? 1: -1

  var n = x.length
  var log_n = Math.log2(n)
  var res = new Array(2*n)

  fftPermuteReal(x, res)

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
        even_re = res[2*(offset + k)]
        even_im = res[2*(offset + k) + 1]
        odd_re = res[2*(offset + k + incr/2)]
        odd_im = res[2*(offset + k + incr/2) + 1]

        c = complexMul(
          odd_re, odd_im, omega_re, omega_im)
        odd_re = c[0]
        odd_im = c[1]

        c = complexMul(
          omega_re, omega_im, theta_exp_re, theta_exp_im)
        omega_re = c[0]
        omega_im = c[1]

        res[2*(offset + k)] = even_re + odd_re
        res[2*(offset + k) + 1] = even_im + odd_im
        res[2*(offset + k + incr/2)] = even_re - odd_re
        res[2*(offset + k + incr/2) + 1] = even_im - odd_im

      }
    }
  }
  if (inverse == 1) {
    for (var i=0; i < 2*n; i++) {
      res[i] = res[i] / n
    }
  }
  return res
}


// const flattenComplex = function (x) {
//   var [nRows, nCols] = [x.length, x[0].length/2]
//   var res = new Array(nCols * nRows * 2)
// }

/**
 * Tranpose a two dimensional complex array
 * @param  {Array} x [description]
 * @return {Array}   [description]
 */
const transposeComplex = function (x) {
  var [nRows, nCols] = [x.length, x[0].length/2]
  var res = new Array(nCols)
  for (var c=0; c<nCols; c++) {
    res[c] = new Array(nRows*2)
    for (var r=0; r<nRows; r++) {
      res[c][2*r] = x[r][2*c]
      res[c][(2*r) + 1] = x[r][(2*c) + 1]
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
  res = transposeComplex(res)
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: transpose (0) took ${delta} sec`)


  // var t0 = performance.now()
  for (var i=0; i<res.length; i++) {
    res[i] = fftComplex2Complex(res[i], inverse)
  }
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: fft on cols took ${delta} sec`)

  // var t0 = performance.now()
  res = transposeComplex(res)
  // var delta = (performance.now() - t0)/1000
  // console.log(`fftComplex2Complex2d: transpose (1) took ${delta} sec`)

  return res
}

exports.shiftBit = shiftBit
exports.reverseBits = reverseBits
exports.fftPermuteReal = fftPermuteReal
exports.fftPermuteComplex = fftPermuteComplex
exports.fftReal2Complex = fftReal2Complex
exports.fftComplex2Complex = fftComplex2Complex
exports.transposeComplex = transposeComplex
exports.fftComplex2Complex2d = fftComplex2Complex2d
