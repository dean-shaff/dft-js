const assert = require('assert')

const { NDArray } = require('../src/ndarray.js')

describe('NDArray', function () {

  var arr3d
  var arr2d
  beforeEach(function () {
    // do not change the size of these arrays: test data is hardcoded in
    arr3d = new NDArray([3, 4, 2])
    arr3d._array = Array.from(Array(arr3d.size).keys())
    arr2d = new NDArray([3, 4])
    arr2d._array = Array.from(Array(arr2d.size).keys())
  })

  describe('constructor', function () {
    arr = new NDArray([8, 8, 2])
    // assert.deepEqual(arr._order, [0, 1, 2])
    assert.deepEqual(arr.shape, [8, 8, 2])
    assert.deepEqual(arr._strides, [16, 2, 1])
    assert.equal(arr.ndim, 3)
    assert.equal(arr.size, 128)
  })

  describe('get', function () {
    it('should access 3d array elements', function (){
      var expected = Array.from(Array(arr3d.size).keys())
      var test = []
      for (var i=0; i<arr3d.shape[0]; i++) {
        for (var j=0; j<arr3d.shape[1]; j++) {
          for (var k=0; k<arr3d.shape[2]; k++) {
            test.push(arr3d.get([i, j, k]))
          }
        }
      }
      assert.deepEqual(expected, test)
    })
  })

  describe('set', function () {
    it('should set array elements', function () {
      for (var i=0; i<arr3d.shape[0]; i++) {
        for (var j=0; j<arr3d.shape[1]; j++) {
          for (var k=0; k<arr3d.shape[2]; k++) {
            arr3d.set([i, j, k], 0.0)
          }
        }
      }
      assert.deepEqual(arr3d._array, new Array(arr3d.size).fill(0))
    })
  })

  describe('transpose', function () {
    it('should be able to transpose 2d array', function() {
      var expected = [ 0,  4,  8,  1,  5,  9,  2,  6, 10,  3,  7, 11]
      var test = []
      arr2d.transpose()
      for (var i=0; i<arr2d.shape[0]; i++) {
        for (var j=0; j<arr2d.shape[1]; j++) {
          test.push(arr2d.get([i, j]))
        }
      }
      assert.deepEqual(test, expected)
    })
  })

  describe('swapaxes', function () {
    it('should be able to swap axes of 3d array', function () {
      arr3d.swapaxes([0,1])
      assert.deepEqual(arr3d.shape, [4, 3, 2])
    })
  })

  describe('view', function() {
    it('view shape should be subset of parent array', function () {
      var view = arr3d.view(0, 0)
      assert.deepEqual(view.shape, [4, 2])
      assert.deepEqual(view._strides, [2, 1])
      assert.equal(view._offset, 0)
    })
    it('view should contain corresponding elements from parent array', function() {
      var view = arr3d.view(0, 0)
      var expected = Array.from(Array(view.size).keys())
      var test = []
      for (var i=0; i<view.shape[0]; i++) {
        for (var j=0; j<view.shape[1]; j++) {
          test.push(view.get([i, j]))
        }
      }
      assert.deepEqual(test, expected)

      var view = arr3d.view(0, 2)
      expected = Array.from(Array(view.size).keys()).map(i=>i+16)
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        for (var j=0; j<view.shape[1]; j++) {
          test.push(view.get([i, j]))
        }
      }
      assert.deepEqual(test, expected)

      var view = arr3d.view(1, 0)
      expected = [ 0,  1,  8,  9, 16, 17]
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        for (var j=0; j<view.shape[1]; j++) {
          test.push(view.get([i, j]))
        }
      }
      assert.deepEqual(test, expected)

      var view = arr3d.view(1, 3)
      expected = [ 6,  7, 14, 15, 22, 23]
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        for (var j=0; j<view.shape[1]; j++) {
          test.push(view.get([i, j]))
        }
      }
      assert.deepEqual(test, expected)

      view = arr3d.view(2, 0)
      expected = Array.from(Array(view.size).keys()).map(i=>i*2)
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        for (var j=0; j<view.shape[1]; j++) {
          test.push(view.get([i, j]))
        }
      }
      assert.deepEqual(test, expected)

      view = arr2d.view(0, 0)
      expected = Array.from(Array(view.size).keys())
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        test.push(view.get([i]))
      }
      assert.deepEqual(test, expected)

      view = arr2d.view(0, 2)
      expected = Array.from(Array(view.size).keys()).map(i=>i+8)
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        test.push(view.get([i]))
      }
      assert.deepEqual(test, expected)

      view = arr2d.view(1, 0)
      expected = Array.from(Array(view.size).keys()).map(i=>i*4)
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        test.push(view.get([i]))
      }
      assert.deepEqual(test, expected)

      view = arr2d.view(1, 2)
      expected = Array.from(Array(view.size).keys()).map(i=>i*4 + 2)
      test = []
      for (var i=0; i<view.shape[0]; i++) {
        test.push(view.get([i]))
      }
      assert.deepEqual(test, expected)
    })
    it('calling set on view should change parent array', function() {
      view = arr3d.view(0, 0)
      for (var i=0; i < view.shape[0]; i++) {
        for (var j=0; j < view.shape[1]; j++ ) {
          view.set([i, j], 0.0)
        }
      }
      assert.deepEqual(
        arr3d._array.slice(0, view.size),
        new Array(view.size).fill(0.0)
      )
    })
  })

  describe('data', function () {
    it('should dump flattened contents of array', function () {
      var expected = arr3d._array.slice(0)
      var test = arr3d.data()
      assert.deepEqual(test, expected)
    })
  })

  describe('print', function () {
    it('print method should work', function () {
      arr3d.print()
    })
  })

})
