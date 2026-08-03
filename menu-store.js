window.MenuStore = (function () {
	var STORAGE_KEY = 'greenChaosPubMenu';

	function load() {
		try {
			var raw = localStorage.getItem(STORAGE_KEY);
			if (raw) return JSON.parse(raw);
		} catch (e) {
			/* corrupted storage — fall back to defaults */
		}
		return window.DEFAULT_MENU_DATA;
	}

	function save(data) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}

	function reset() {
		localStorage.removeItem(STORAGE_KEY);
	}

	return { load: load, save: save, reset: reset };
})();
