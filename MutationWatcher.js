"use strict";

(function () {
	/**
	 * Creates an object that responds to mutations allowing you to track
	 * changes that occur to the object.
	 * @param {Function=} callback An optional callback that will be called
	 * on any change to the object. If you wish to only be informed about
	 * specific changes rather than every change, use the watch() method.
	 * @constructor
	 */
	var MutationWatcher = function (callback) {
		this.obj = {};
		this._callback = callback;
		this._watch = {};

		return this._hook(this.obj, '');
	};

	/**
	 * Creates a listener that will be called when a change is detected in
	 * the path you specify e.g. path "user.name" will get changes if you
	 * modify the object by doing "obj.user.name = 'Test';", where obj is
	 * this MutationWatcher instance.
	 * @param {String} path The path of the object data to watch.
	 * @param {Function} callback The callback function to call when
	 * changes are detected.
	 * @returns {MutationWatcher}
	 */
	MutationWatcher.prototype.watch = function (path, callback) {
		this._watch[path] = this._watch[path] || [];
		this._watch[path].push(callback);

		return this;
	};

	/**
	 * Removes a listener from the mutation watcher for the specified path.
	 * @param {String} path The path of the object data to un-watch.
	 * @param {Function} callback The callback function used in the
	 * original call to watch().
	 * @returns {Boolean} True if the listener was found and removed, false
	 * if not.
	 */
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

	/**
	 * Calls all the watchers for a path.
	 * @param {String} path The path that listeners are listening on.
	 * @param {*} newVal The new path value.
	 * @param {*} oldVal The old path value.
	 */
	MutationWatcher.prototype.emit = function (path, newVal, oldVal) {
		var listenerArr,
			i;

		// Get array of listener functions for this event
		listenerArr = this._watch[path];

		// Loop the array and call the listeners
		if (listenerArr && listenerArr.length) {
			for (i = 0; i < listenerArr.length; i++) {
				listenerArr[i](newVal, oldVal);
			}
		}

		// Check for overall listener and fire
		if (this._callback) {
			this._callback(path, newVal, oldVal);
		}
	};

	/**
	 * Checks if any change has occurred on a path and calls emit() if so.
	 * @param {String} path The path we are handling the change for.
	 * @param {*} newVal The new path value.
	 * @param {*} oldVal The old path value.
	 */
	MutationWatcher.prototype.handleChange = function (path, newVal, oldVal) {
		// Check for changed value
		if (newVal === oldVal || JSON.stringify(newVal) === JSON.stringify(oldVal)) {
			// No change was made
			return;
		}

		// Tell any watchers that this property has changed
		this.emit(path, newVal, oldVal);
	};

	/**
	 * Generates a proxy object.
	 * @param {Object} obj The storage object.
	 * @param {String} path The name of the path.
	 * @returns {Proxy} The new proxy object.
	 * @private
	 */
	MutationWatcher.prototype._hook = function (obj, path) {
		return new Proxy(obj, this._generateHandler(path));
	};

	/**
	 * Creates a recursive change detection handler.
	 * @param {String} parentName The name of the parent path.
	 * @returns {Object} Object that contains Proxy hooks.
	 * @private
	 */
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
					finalVal = self._hook(newVal, parentName + name + '.');
				} else {
					finalVal = newVal;
				}

				target[name] = finalVal;

				self.handleChange(parentName + name, newVal, oldVal);

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
			window.appCore.module('MutationWatcher', function () { return MutationWatcher; });
			return;
		}

		window.MutationWatcher = MutationWatcher;
		return;
	}

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = MutationWatcher;
	}
}());
