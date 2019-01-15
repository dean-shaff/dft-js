const { performance } = require('perf_hooks')

const Complex = require('complex.js')

// const reverseBits = function (bits) {
//     var x = new Uint32Array(1);
//     x[0]=bits;
//     x[0] = ((x[0] & 0x0000ffff) << 16) | ((x[0] & 0xffff0000) >>> 16)
//     x[0] = ((x[0] & 0x55555555) << 1) | ((x[0] & 0xAAAAAAAA) >>> 1)
//     x[0] = ((x[0] & 0x33333333) << 2) | ((x[0] & 0xCCCCCCCC) >>> 2)
//     x[0] = ((x[0] & 0x0F0F0F0F) << 4) | ((x[0] & 0xF0F0F0F0) >>> 4)
//     x[0] = ((x[0] & 0x00FF00FF) << 8) | ((x[0] & 0xFF00FF00) >>> 8)
//     return x[0]
// }

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

const fft_it = function (x, inverse) {
  inverse = inverse ? 1: -1
  var n = x.length
  var log_n = Math.log2(n)

  var res = new Array(n)

  var t0 = performance.now()
  for (var i=0; i<n; i++) {
    reverseBits(i)
  }
  console.log((performance.now() - t0)/1000)

  var t0 = performance.now()
  for (var i=0; i<n; i++){
    var idx = parseInt(i.toString(2).padStart(log_n,'0').split('').reverse().join(''), 2)
    res[i] = x[idx]
  }
  console.log((performance.now() - t0)/1000)

  for (var p = 1; p <= log_n; p++) {
    var incr = 0x1 << p
    var theta = (inverse*2*Math.PI)/incr
    var theta_exp = new Complex([Math.cos(theta), Math.sin(theta)])
    // console.log(`theta_exp: ${theta_exp}`)
    for (var offset = 0; offset < n; offset += incr) {
      var omega = Complex.ONE
      for (var k = 0; k < incr/2; k++) {
        var u = res[offset + k]
        var t = res[offset + k + incr/2].mul(omega)
        omega = omega.mul(theta_exp)
        // console.log(`k: ${k}, omega: ${omega}`)
        res[offset + k] = u.add(t)
        res[offset + k + incr/2] = u.sub(t)
      }
    }
  }
  return res
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


function main () {
  n = 2048
  x = new Array(n)
  for (var i=0; i<n; i++) {
    x[i] = new Complex([i, i])
  }
  var t0
  var k_rec
  var k_iter
  var k_inv
  var nIter = 10
  // console.log(x)
  // var t0 = performance.now()
  // var k = DFT(x)
  // console.log(`DFT: ${(performance.now() - t0)/1000}`)
  var plan = new FFT(n)
  t0 = performance.now()
  for (var i=0; i<nIter; i++) {
    k_rec = plan.forward(x)
  }
  console.log(`FFT: ${(performance.now() - t0)/1000/nIter}`)
  t0 = performance.now()
  for (var i=0; i<nIter; i++) {
    k_iter = fft_it(x, false)
  }
  console.log(`FFT: ${(performance.now() - t0)/1000/nIter}`)

}

main ()
