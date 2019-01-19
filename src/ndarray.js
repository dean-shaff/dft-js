function NDArray (shape){

  this.shape = shape
  this.ndim = shape.length
  this.size = this.shape.reduce((accum, val) => accum * val)
  this._order = Array.from(Array(this.ndim).keys())
  this._array = new Array(this.size)

  this._calc_idx = function (access) {
    if (access.length == 1) {
      return access[0]
    }
    access = this._order.map(i => access[i])
    var idx = access[this.ndim-1]
    var scale = 1
    for (var i=this.ndim-2; i >= 0; i--) {
      scale *= this.shape[i+1]
      idx += scale*access[i]
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
      this.shape = this._order.map(i => this._shape[i])
    }
  }
}

exports.NDArray = NDArray
