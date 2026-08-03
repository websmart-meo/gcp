window.MenuStore = (function () {
	var LOCAL_CACHE_KEY = 'greenChaosPubMenu';
	var FIRESTORE_URL =
		'https://firestore.googleapis.com/v1/projects/gcpnt-c8c03/databases/(default)/documents/menu/current';

	function readLocalCache() {
		try {
			var raw = localStorage.getItem(LOCAL_CACHE_KEY);
			if (raw) return JSON.parse(raw);
		} catch (e) {
			/* corrupted cache — ignore */
		}
		return null;
	}

	function writeLocalCache(data) {
		try {
			localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data));
		} catch (e) {
			/* storage unavailable/full — not fatal, Firestore is the source of truth */
		}
	}

	// Reads the shared menu from Firestore so every visitor sees the same,
	// latest saved version. Falls back to the last-known-good local cache
	// (and finally to the hardcoded defaults) if Firestore is unreachable,
	// so a network hiccup doesn't take the whole menu down.
	function load() {
		return fetch(FIRESTORE_URL)
			.then(function (res) {
				if (res.status === 404) return null; // nothing saved yet
				if (!res.ok) throw new Error('Firestore load failed: ' + res.status);
				return res.json();
			})
			.then(function (doc) {
				if (!doc || !doc.fields || !doc.fields.json) return null;
				var data = JSON.parse(doc.fields.json.stringValue);
				writeLocalCache(data);
				return data;
			})
			.catch(function (err) {
				console.error('MenuStore.load: Firestore unreachable, using local cache', err);
				return readLocalCache();
			})
			.then(function (data) {
				return data || window.DEFAULT_MENU_DATA;
			});
	}

	function save(data) {
		var body = JSON.stringify({ fields: { json: { stringValue: JSON.stringify(data) } } });
		return fetch(FIRESTORE_URL, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: body
		}).then(function (res) {
			if (!res.ok) throw new Error('Firestore save failed: ' + res.status);
			writeLocalCache(data);
			return data;
		});
	}

	function reset() {
		return save(window.DEFAULT_MENU_DATA);
	}

	return { load: load, save: save, reset: reset };
})();
