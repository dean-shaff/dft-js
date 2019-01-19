const assert = require('assert')

const { NDArray } = require('../src/ndarray.js')



describe('NDArray', function () {

  var arr
  beforeEach(function () {
    arr = new NDArray([3, 4, 2])
    arr._array = Array.from(Array(arr.size).keys())
  })

  describe('constructor', function () {
    arr = new NDArray([8, 8, 2])
    assert.deepEqual(arr._order, [0, 1, 2])
    assert.deepEqual(arr.shape, [8, 8, 2])
    assert.equal(arr.ndim, 3)
    assert.equal(arr.size, 128)
  })

  describe('get', function () {
    it('should access array elements', function (){
      for (var i=0; i<arr.shape[0]; i++) {
        for (var j=0; j<arr.shape[1]; j++) {
          for (var k=0; k<arr.shape[2]; k++) {
            console.log(arr.get([i, j, k]))
          }
        }
      }
    })
  })

  describe('set', function () {

  })

  describe('transpose', function () {

  })

})
