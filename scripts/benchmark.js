const fftBenchmark = function (nIter, testFunctions, testVectors, testSizes, now) {
  var report = {'nIter': nIter}
  testFunctions.forEach((f, idx) => {
    report[f.name] = {}
    testSizes.forEach(n => {
      var x = testVectors[n]['in']
      var t0 = now()
      for (var i=0; i<nIter; i++) {
        f(x)
      }
      var delta = now() - t0
      report[f.name][n] = delta
    })
  })
  return report
}

const format = function (val, n) {
  if (n === undefined) {
    n = 4
  }
  return val.toFixed(n)
}


const formatReport = function (report) {
  var nIter = report['nIter']
  Object.keys(report).forEach(name => {
    Object.keys(report[name]).forEach(n => {
      var delta = report[name][n] / 1000
      console.log(`n=${n}, ${name}: ${format(delta)} sec, ${format(delta/nIter, 7)} per loop, ${format(nIter / delta, 2)} iter/sec`)
    })
  })
}

if (typeof require != 'undefined') {
  exports.fftBenchmark = fftBenchmark
  exports.formatReport = formatReport
} else {
  window.fftBenchmark = fftBenchmark
  window.formatReport = formatReport
}
