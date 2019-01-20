const Complex = require('complex.js')

const FFT = function (n) {

  var dft = function (x, angle) {
    var n = x.length
    var k = new Array(n)
    for (var k_i = 0; k_i < n; k_i++) {
      k[k_i] = Complex.ZERO
      for (var x_i = 0; x_i < n; x_i++) {
        k[k_i] = k[k_i].add(
          x[x_i].mul(angle.mul(new Complex([k_i*x_i,0])).exp())
        )
      }
    }
    return k
  }

  var fft = function (x, angle) {
    var n = x.length
    if (n <= 4) {
      return dft(x, angle)
    } else {
      var n_2 = n/2
      var even = new Array(n_2)
      var odd = new Array(n_2)
      var twiddle = new Array(n_2)
      var k = new Array(n)
      for (var i=0; i<n_2; i++) {
        even[i] = x[2*i]
        odd[i] = x[2*i + 1]
        twiddle[i] = angle.mul(new Complex([i,0])).exp()
        // twiddle[i] = twiddle[i].div(2)
      }
      var even_f = fft(even, angle.mul(2))
      var odd_f = fft(odd, angle.mul(2))
      for (var i=0; i<n_2; i++) {
        k[i] = even_f[i].add(twiddle[i].mul(odd_f[i]))
        k[i + n_2] = even_f[i].sub(twiddle[i].mul(odd_f[i]))
      }
      return k
    }
  }

  this.forward = function (x) {
    var n = x.length
    var angle = new Complex([0, -2*Math.PI/n])
    // var twiddle = new Array(n/2)
    // for (var i=0; i<n/2; i++) {
    //   twiddle[i] = angle.mul(new Complex([i,0])).exp()
    // }
    return fft(x, angle)
  }

  this.backward = function (x) {
    var n = x.length
    var angle = new Complex([0, 2*Math.PI/n])
    // var twiddle = new Array(n/2)
    // for (var i=0; i<n/2; i++) {
    //   twiddle[i] = angle.mul(new Complex([i,0])).exp()
    // }
    var k_inv = fft(x, angle)
    for (var i=0; i<n; i++){
      k_inv[i] = k_inv[i].div(n)
    }
    return k_inv
  }
}



/**
 * One dimensional discrete fourier transform.
 */
const DFT = function (x) {
  var n = x.length
  var k = new Array(n)
  var neg_i_2_pi = new Complex([0, -2*Math.PI/n]);
  for (var k_i = 0; k_i < n; k_i++) {
    k[k_i] = Complex.ZERO
    for (var x_i = 0; x_i < n; x_i++) {
      k[k_i] = k[k_i].add(
        x[x_i].mul(neg_i_2_pi.mul(new Complex([k_i*x_i,0])).exp())
      )
    }
  }
  return k
}

const fft = function (x, inverse) {
  inverse = inverse ? 1: -1
  var n = x.length
  var log_n = Math.log2(n)
  var res = new Array(n)

  fftPermute(x, res)

  var incr, theta, theta_exp, omega, u, t
  for (var p = 1; p <= log_n; p++) {
    incr = 0x1 << p
    theta = (inverse*2*Math.PI)/incr
    theta_exp = new Complex([Math.cos(theta), Math.sin(theta)])
    // console.log(`theta_exp: ${theta_exp}`)
    for (var offset = 0; offset < n; offset += incr) {
      omega = Complex.ONE
      for (var k = 0; k < incr/2; k++) {
        u = res[offset + k]
        t = res[offset + k + incr/2]
        // console.log(u)
        // console.log(t)
        t = t.mul(omega)
        // console.log(offset + k, offset + k + incr/2)
        omega = omega.mul(theta_exp)
        // console.log(`k: ${k}, omega: ${omega}`)
        res[offset + k] = u.add(t)
        res[offset + k + incr/2] = u.sub(t)
      }
    }
  }
  if (inverse == 1) {
    for (var i=0; i<n; i++) {
      res[i] = res[i].div(n)
    }
  }
  return res
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

// const fftReal2Complex = function (x, inverse) {
//   if (inverse === undefined) {
//     inverse = false
//   }
//   inverse = inverse ? 1: -1
//
//   var n = x.length
//   var log_n = Math.log2(n)
//   var res = new Array(2*n)
//
//   fftPermuteReal(x, res)
//
//   var incr, theta, theta_exp_re,
//       theta_exp_im, omega_re, omega_im,
//       even_re, even_im, odd_re, odd_im, c
//
//   for (var p = 1; p <= log_n; p++) {
//     incr = 0x1 << p
//     theta = (inverse*2*Math.PI)/incr
//     theta_exp_re = Math.cos(theta)
//     theta_exp_im = Math.sin(theta)
//     // console.log(`theta_exp: ${theta_exp}`)
//     for (var offset = 0; offset < n; offset += incr) {
//       omega_re = 1.0
//       omega_im = 0.0
//       for (var k = 0; k < incr/2; k++) {
//         even_re = res[2*(offset + k)]
//         even_im = res[2*(offset + k) + 1]
//         odd_re = res[2*(offset + k + incr/2)]
//         odd_im = res[2*(offset + k + incr/2) + 1]
//
//         c = complexMul(
//           odd_re, odd_im, omega_re, omega_im)
//         odd_re = c[0]
//         odd_im = c[1]
//
//         c = complexMul(
//           omega_re, omega_im, theta_exp_re, theta_exp_im)
//         omega_re = c[0]
//         omega_im = c[1]
//
//         res[2*(offset + k)] = even_re + odd_re
//         res[2*(offset + k) + 1] = even_im + odd_im
//         res[2*(offset + k + incr/2)] = even_re - odd_re
//         res[2*(offset + k + incr/2) + 1] = even_im - odd_im
//
//       }
//     }
//   }
//   if (inverse == 1) {
//     for (var i=0; i < 2*n; i++) {
//       res[i] = res[i] / n
//     }
//   }
//   return res
// }


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
