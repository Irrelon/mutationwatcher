"use strict";

(function () {
	var MutationWatcher = function (obj, callback) {
		this.obj = obj;
		this.callback = callback;
		this._watch = {};

		return this._hook(obj);
	};

	MutationWatcher.prototype.watch = function (path, callback) {
		this._watch[path] = this._watch[path] || [];
		this._watch[path].push(callback);

		return this;
	};

	MutationWatcher.prototype.unWatch = function (path, callback) {
		var index;

		this._watch[path] = this._watch[path] || [];
		index = this._watch[path].indexOf(callback);

		if (index > -1) {
			this._watch[path].splice(index, 1);
			return true;
		}

		return false;
	};

	MutationWatcher.prototype.change = function (prop, newVal, oldVal) {
		console.log('Change ' + prop + ' ' + JSON.stringify(oldVal) + ' ' + JSON.stringify(newVal));

		if (this._watch[prop] && this._watch[prop].length) {
			this._watch[prop](newVal, oldVal);
		}
	};

	MutationWatcher.prototype._hook = function (obj) {
		return new Proxy(obj, this._generateHandler(''));
	};

	MutationWatcher.prototype._generateHandler = function (parentName) {
		var self = this;

		parentName = parentName || '';

		return {
			set: function(target, name, newVal) {
				var oldVal = target[name],
					finalVal,
					i;

				if (typeof newVal === 'object' && newVal !== null) {
					// Hook changes on here too
					finalVal = new Proxy(newVal, self._generateHandler(parentName + name + '.'));
				} else {
					finalVal = newVal;
				}

				target[name] = finalVal;

				self.change(parentName + name, newVal, oldVal);

				if (typeof newVal === 'object' && newVal !== null) {
					// Recursively handle new objects and arrays which will
					// force the properties into this setter method and
					for (i in newVal) {
						if (newVal.hasOwnProperty(i)) {
							finalVal[i] = newVal[i];
						}
					}
				}

				return true;
			}
		};
	};

	// Export to either appCore, window, or CommonJS module
	if (typeof window !== 'undefined') {
		if (typeof window.appCore !== 'undefined') {
			window.appCore('MutationWatcher', function () { return MutationWatcher; });
			return;
		}

		window.MutationWatcher = MutationWatcher;
		return;
	}

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = MutationWatcher;
	}
}());
