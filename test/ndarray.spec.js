const assert = require('assert')

const { NDArray } = require('../src/ndarray.js')



describe('NDArray', function () {

  var arr3d
  var arr2d
  beforeEach(function () {
    arr3d = new NDArray([3, 4, 2])
    arr3d._array = Array.from(Array(arr3d.size).keys())
    arr2d = new NDArray([3, 4])
    arr2d._array = Array.from(Array(arr2d.size).keys())
  })

  describe('constructor', function () {
    arr = new NDArray([8, 8, 2])
    assert.deepEqual(arr._order, [0, 1, 2])
    assert.deepEqual(arr.shape, [8, 8, 2])
    assert.equal(arr.ndim, 3)
    assert.equal(arr.size, 128)
  })

  describe('get', function () {
    it('should access 3d array elements', function (){
      for (var i=0; i<arr3d.shape[0]; i++) {
        for (var j=0; j<arr3d.shape[1]; j++) {
          for (var k=0; k<arr3d.shape[2]; k++) {
            // console.log(arr3d.get([i, j, k]))
          }
        }
      }
    })
  })

  describe('set', function () {

  })

  describe('transpose', function () {
    it('should be able to transpose 2d array', function() {
      var expected = [ 0,  4,  8,  1,  5,  9,  2,  6, 10,  3,  7, 11]
      var test = []
      arr2d.transpose()
      console.log(arr2d.shape)
      for (var i=0; i<arr2d.shape[0]; i++) {
        for (var j=0; j<arr2d.shape[1]; j++) {
          test.push(arr2d.get([i, j]))
        }
      }
      console.log(expected)
      console.log(test)
    })
  })

})
