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