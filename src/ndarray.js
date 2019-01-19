function NDArray (shape, _options){

  this.shape = shape
  this.ndim = shape.length
  this.size = this.shape.reduce((accum, val) => accum * val)
  var strides = [1]
  shape.slice(1).reverse().reduce((a,b,i) => { return strides[i+1] = a*b }, 1)
  var options = {
    'order': Array.from(Array(this.ndim).keys()),
    'offset': 0,
    'strides': strides.reverse()
  }
  if (_options !== undefined) {
    options = Object.assign(_options, options)
  }
  this._order = options.order
  this._offset = options.offset
  this._strides = options.strides

  if ('array' in options) {
    this._array = options.array
  } else {
    this._array = new Array(this.size)
  }

  this._calc_idx = function (access) {
    var idx = this._offset
    var orderIdx;
    for (var i=0; i<this.ndim; i++){
      orderIdx = this._order[i]
      idx += strides[orderIdx]*access[orderIdx]
    }
    return idx
  }

  this.get = function (access) {
    return this._array[this._calc_idx(access)]
  }

  this.set = function (access, val) {
    this._array[this._calc_idx(access)] = val
  }

  this.fill = function (val) {
    this._array.fill(val)
  }

  this.transpose = function () {
    if (this.ndim == 2) {
      this._order = this._order.reverse()
      this._strides = this._strides.reverse()
      this.shape.reverse()
    } else {
      throw 'Can\'t transponse an array with more or less than 2 dimension. Try swapaxes'
    }
  }

  this.view = function () {
    
  }

  this.swapaxes = function (axes) {
    var order = this._order.slice(0)
    this._order[axes[0]] = order[axes[1]]
    this._order[axes[1]] = order[axes[0]]
    this.shape = this._order.map(i=>this.shape[i])
    this._strides = this._order.map(i=>this._strides[i])
  }
}

exports.NDArray = NDArray
