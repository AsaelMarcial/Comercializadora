Date.prototype.formatted = function () {
	return this.toISOString().split('T')[0]
}

Number.prototype.priceFormat = function () {
	return this.toFixed(2)
}