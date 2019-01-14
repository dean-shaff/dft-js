const { performance } = require('perf_hooks')

const Complex = require('complex.js')

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


const FFT = function (n) {

  var dft = function (x, exp) {
    var n = x.length
    var k = new Array(n)
    for (var k_i = 0; k_i < n; k_i++) {
      k[k_i] = Complex.ZERO
      for (var x_i = 0; x_i < n; x_i++) {
        k[k_i] = k[k_i].add(
          x[x_i].mul(exp.mul(new Complex([k_i*x_i,0])).exp())
        )
      }
    }
    return k
  }

  var fft = function (x, exp) {
    var n = x.length
    if (n <= 4) {
      return dft(x, exp)
    } else {
      var n_2 = n/2
      var even = new Array(n_2)
      var odd = new Array(n_2)
      var twiddle = new Array(n_2)
      var k = new Array(n)
      for (var i=0; i<n_2; i++) {
        even[i] = x[2*i]
        odd[i] = x[2*i + 1]
        twiddle[i] = exp.mul(new Complex([i,0])).exp()
        // twiddle[i] = twiddle[i].div(2)
      }
      var even_f = fft(even, exp.mul(2))
      var odd_f = fft(odd, exp.mul(2))
      for (var i=0; i<n_2; i++) {
        k[i] = even_f[i].add(twiddle[i].mul(odd_f[i]))
        k[i + n_2] = even_f[i].sub(twiddle[i].mul(odd_f[i]))
      }
      return k
    }
  }

  this.forward = function (x) {
    var n = x.length
    var exp = new Complex([0, -2*Math.PI/n])
    // var twiddle = new Array(n/2)
    // for (var i=0; i<n/2; i++) {
    //   twiddle[i] = exp.mul(new Complex([i,0])).exp()
    // }
    return fft(x, exp)
  }

  this.backward = function (x) {
    var n = x.length
    var exp = new Complex([0, 2*Math.PI/n])
    // var twiddle = new Array(n/2)
    // for (var i=0; i<n/2; i++) {
    //   twiddle[i] = exp.mul(new Complex([i,0])).exp()
    // }
    var k_inv = fft(x, exp)
    for (var i=0; i<n; i++){
      k_inv[i] = k_inv[i].div(n)
    }
    return k_inv
  }

}


function main () {
  n = 32
  x = new Array(n)
  for (var i=0; i<n; i++) {
    x[i] = new Complex([i, i])
  }
  var t0
  var k
  var k_inv
  // console.log(x)
  // var t0 = performance.now()
  // var k = DFT(x)
  // console.log(`DFT: ${(performance.now() - t0)/1000}`)
  t0 = performance.now()
  var plan = new FFT(n)
  k = plan.forward(x)
  console.log(k)
  k_inv = plan.backward(k)
  console.log(k_inv)
  console.log(`FFT: ${(performance.now() - t0)/1000}`)
}

main ()
