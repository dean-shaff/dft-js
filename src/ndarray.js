function NDArray (shape, _options){

  this.shape = shape
  this.ndim = shape.length // number of dimensions
  this.size = this.shape.reduce((accum, val) => accum * val) // total number of elements in array

  var options = {}
  if (_options !== undefined) {
    options = _options
  }
  // do each of the keys in options manually because we don't want to
  // allocate anything we don't absolutely have to.

  if ('strides' in options) {
    this._strides = options.strides
  } else {
    var strides = [1]
    this.shape.slice(1).reverse().reduce(
      (a,b,i) => { return strides[i+1] = a*b }, 1)
    this._strides = strides.reverse()
  }

  if ('offset' in options) {
    this._offset = options.offset
  } else {
    this._offset = 0
  }

  if ('array' in options) {
    this._array = options.array
  } else {
    this._array = new Array(this.size)
  }

  this._calc_idx = function (access) {
    // if (this.ndim == 1) {
    //   console.log(access)
    // }
    var idx = this._offset
    // var orderIdx;
    for (var i=0; i<this.ndim; i++){
      // orderIdx = this._order[i]
      idx += this._strides[i]*access[i]
    }
    return idx
  }

  this.get = function (access) {
    var idx = this._offset
    // var orderIdx;
    for (var i=0; i<this.ndim; i++){
      // orderIdx = this._order[i]
      idx += this._strides[i]*access[i]
    }
    return this._array[idx]
    // return this._array[this._calc_idx(access)]
  }

  this.set = function (access, val) {
    var idx = this._offset
    // var orderIdx;
    for (var i=0; i<this.ndim; i++){
      // orderIdx = this._order[i]
      idx += this._strides[i]*access[i]
    }
    this._array[idx] = val
    // this._array[this._calc_idx(access)] = val
  }

  this.fill = function (val) {
    this._array.fill(val)
  }

  this.transpose = function () {
    if (this.ndim == 2) {
      this.swapaxes([0,1])
    } else {
      throw 'Can\'t transponse an array with more or less than 2 dimension. Try swapaxes'
    }
  }

  this.view = function (axis, item) {
    var shape = this.shape.slice(0)
    var strides = this._strides.slice(0)
    var offset = strides.splice(axis,1)[0] * item + this._offset
    shape.splice(axis, 1)

    return new NDArray(
      shape,
      {
        'array': this._array, // reference to array, not the actual array!
        'offset': offset,
        'strides': strides
      }
    )
  }

  this.swapaxes = function (axes) {
    var strides = this._strides.slice(0)
    this._strides[axes[0]] = strides[axes[1]]
    this._strides[axes[1]] = strides[axes[0]]
    var shape = this.shape.slice(0)
    this.shape[axes[0]] = shape[axes[1]]
    this.shape[axes[1]] = shape[axes[0]]
  }

  this.data = function() {
    var res = []
    const _data = (x) => {
      if (x.ndim == 1) {
        for (var i=0; i<x.shape[0]; i++) {
          res.push(x.get([i]))
        }
      }
      else {
        for (var i=0; i<x.shape[0]; i++) {
          _data(x.view(0, i))
        }
      }
    }
    _data(this)
    return res
  }

  this.print = function (decimalPlaces) {
    if (decimalPlaces == undefined) {
      decimalPlaces = 2
    }

    const format = (val) => {
      return val.toFixed(decimalPlaces)
    }

    const formatArr1D = (arr) => {
      var arrStr = arr.data().map(x=>format(x))
      return '[ ' + arrStr.join(', ') + ' ]'
    }

    const _print = (x) => {
      if (x.ndim == 1) {
        console.log(formatArr1D(x))
      } else if (x.ndim == 2) {
        var arrStr = ['[']
        for (var i=0; i<x.shape[0]; i++) {
          if (i != 0) {
            arrStr.push(' ')
          }
          arrStr.push(formatArr1D(x.view(0, i)))
          if (i != x.shape[0] - 1) {
            arrStr.push('\n')
          }
        }
        arrStr.push(']')
        console.log(arrStr.join('') + '\n')
      } else {
        for (var i=0; i<x.shape[0]; i++) {
          _print(x.view(0, i))
        }
      }
    }
    _print(this)
  }
}

exports.NDArray = NDArray
