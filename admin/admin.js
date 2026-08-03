(function () {
	var menuColumns = document.getElementById('menuColumns');
	var statusMsg = document.getElementById('statusMsg');
	var editBtn = document.getElementById('editBtn');
	var saveBtn = document.getElementById('saveBtn');
	var cancelBtn = document.getElementById('cancelBtn');
	var downloadBtn = document.getElementById('downloadBtn');
	var resetBtn = document.getElementById('resetBtn');

	function showStatus(message) {
		statusMsg.textContent = message;
		if (message) {
			setTimeout(function () {
				if (statusMsg.textContent === message) statusMsg.textContent = '';
			}, 3500);
		}
	}

	function buildItemRow(item) {
		var row = document.createElement('div');
		row.className = 'admin-item-row';

		var nameInput = document.createElement('input');
		nameInput.className = 'admin-input';
		nameInput.dataset.role = 'name';
		nameInput.value = item.name || '';
		nameInput.placeholder = 'Название позиции';
		row.appendChild(nameInput);

		var noteInput = document.createElement('input');
		noteInput.className = 'admin-input admin-input--note';
		noteInput.dataset.role = 'note';
		noteInput.value = item.note || '';
		noteInput.placeholder = 'Уточнение (необязательно)';
		row.appendChild(noteInput);

		var priceInput = document.createElement('input');
		priceInput.className = 'admin-input admin-input--price';
		priceInput.dataset.role = 'price';
		priceInput.value = item.price || '';
		priceInput.placeholder = 'Цена';
		row.appendChild(priceInput);

		var removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.className = 'btn btn--danger-ghost btn--sm';
		removeBtn.textContent = '✕';
		removeBtn.title = 'Удалить позицию';
		removeBtn.addEventListener('click', function () {
			row.remove();
		});
		row.appendChild(removeBtn);

		return row;
	}

	function buildGroupEditor(group) {
		var section = document.createElement('section');
		section.className = 'group';

		var titleRow = document.createElement('div');
		titleRow.className = 'admin-edit-row--title';

		var titleInput = document.createElement('input');
		titleInput.className = 'admin-input admin-input--title';
		titleInput.dataset.role = 'title';
		titleInput.value = group.title || '';
		titleInput.placeholder = 'Название раздела';
		titleRow.appendChild(titleInput);

		var noteInput = document.createElement('input');
		noteInput.className = 'admin-input admin-input--note';
		noteInput.dataset.role = 'priceNote';
		noteInput.value = group.priceNote || '';
		noteInput.placeholder = 'Общая цена за раздел (необязательно)';
		titleRow.appendChild(noteInput);

		var removeGroupBtn = document.createElement('button');
		removeGroupBtn.type = 'button';
		removeGroupBtn.className = 'btn btn--danger-ghost btn--sm';
		removeGroupBtn.textContent = 'Удалить раздел';
		removeGroupBtn.addEventListener('click', function () {
			section.remove();
		});
		titleRow.appendChild(removeGroupBtn);

		section.appendChild(titleRow);

		var itemsWrap = document.createElement('div');
		itemsWrap.className = 'admin-items';
		(group.items || []).forEach(function (item) {
			itemsWrap.appendChild(buildItemRow(item));
		});
		section.appendChild(itemsWrap);

		var addItemBtn = document.createElement('button');
		addItemBtn.type = 'button';
		addItemBtn.className = 'btn btn--ghost btn--sm admin-add-item';
		addItemBtn.textContent = '+ Добавить позицию';
		addItemBtn.addEventListener('click', function () {
			itemsWrap.appendChild(buildItemRow({}));
		});
		section.appendChild(addItemBtn);

		return section;
	}

	function renderMenuEditor(data, container) {
		container.innerHTML = '';

		data.forEach(function (group) {
			container.appendChild(buildGroupEditor(group));
		});

		var addGroupBtn = document.createElement('button');
		addGroupBtn.type = 'button';
		addGroupBtn.className = 'btn btn--ghost admin-add-group';
		addGroupBtn.textContent = '+ Добавить раздел';
		addGroupBtn.addEventListener('click', function () {
			container.insertBefore(buildGroupEditor({ title: '', items: [] }), addGroupBtn);
		});
		container.appendChild(addGroupBtn);
	}

	function readEditorData(container) {
		var groups = Array.prototype.slice.call(container.querySelectorAll(':scope > .group'));
		var data = [];

		groups.forEach(function (section) {
			var title = section.querySelector('[data-role="title"]').value.trim();
			if (!title) return;

			var priceNote = section.querySelector('[data-role="priceNote"]').value.trim();
			var items = [];

			Array.prototype.forEach.call(section.querySelectorAll('.admin-item-row'), function (row) {
				var name = row.querySelector('[data-role="name"]').value.trim();
				if (!name) return;
				var note = row.querySelector('[data-role="note"]').value.trim();
				var price = row.querySelector('[data-role="price"]').value.trim();
				var item = { name: name };
				if (note) item.note = note;
				if (price) item.price = price;
				items.push(item);
			});

			var group = { title: title, items: items };
			if (priceNote) group.priceNote = priceNote;
			data.push(group);
		});

		return data;
	}

	function showReadView() {
		renderMenuSections(MenuStore.load(), menuColumns);
		editBtn.hidden = false;
		saveBtn.hidden = true;
		cancelBtn.hidden = true;
	}

	editBtn.addEventListener('click', function () {
		renderMenuEditor(MenuStore.load(), menuColumns);
		editBtn.hidden = true;
		saveBtn.hidden = false;
		cancelBtn.hidden = false;
		showStatus('');
	});

	saveBtn.addEventListener('click', function () {
		var data = readEditorData(menuColumns);
		if (!data.length) {
			showStatus('Нужен хотя бы один раздел с названием.');
			return;
		}
		MenuStore.save(data);
		showReadView();
		showStatus('Меню обновлено — изменения уже видны на главной странице.');
	});

	cancelBtn.addEventListener('click', function () {
		showReadView();
		showStatus('');
	});

	resetBtn.addEventListener('click', function () {
		if (!confirm('Сбросить меню к исходному варианту? Все изменения будут потеряны.')) return;
		MenuStore.reset();
		showReadView();
		showStatus('Меню сброшено к исходному варианту.');
	});

	var LEAF_PATH_D =
		'M0,0 C-8,-30 -50,-45 -50,-85 C-50,-108 -25,-115 -10,-100 C-4,-94 0,-88 0,-82 C0,-88 4,-94 10,-100 C25,-115 50,-108 50,-85 C50,-45 8,-30 0,0 Z' +
		'M0,0 C30,-8 45,-50 85,-50 C108,-50 115,-25 100,-10 C94,-4 88,0 82,0 C88,0 94,4 100,10 C115,25 108,50 85,50 C45,50 30,8 0,0 Z' +
		'M0,0 C8,30 50,45 50,85 C50,108 25,115 10,100 C4,94 0,88 0,82 C0,88 -4,94 -10,100 C-25,115 -50,108 -50,85 C-50,45 -8,30 0,0 Z' +
		'M0,0 C-30,8 -45,50 -85,50 C-108,50 -115,25 -100,10 C-94,4 -88,0 -82,0 C-88,0 -94,-4 -100,-10 C-115,-25 -108,-50 -85,-50 C-45,-50 -30,-8 0,0 Z' +
		'M0,0 L0,60';

	// Leaf positions, matching the live page's .leaf--* CSS rules but resolved
	// to plain left/top pixels (given the known container width and its
	// measured height) instead of right/bottom/percentage + transform.
	function computeLeafRects(width, height) {
		return [
			{ left: -70, top: -60, width: 260, height: 390, opacity: 0.5 }, // tl
			{ left: width - 220 + 90, top: -40, width: 220, height: 330, opacity: 0.35 }, // tr
			{ left: -60, top: height - 360 + 80, width: 240, height: 360, opacity: 0.4 }, // bl
			{ left: width - 280 + 80, top: height - 420 + 70, width: 280, height: 420, opacity: 0.55 }, // br
			{ left: width * 0.5 - 100, top: height * 0.45 - 150, width: 200, height: 300, opacity: 0.14 }, // mid
			{ left: width * 0.55 - 80, top: -30, width: 160, height: 240, opacity: 0.22 }, // top
			{ left: -50, top: height * 0.55 - 127.5, width: 170, height: 255, opacity: 0.24 }, // left
			{ left: width - 150 + 40, top: height * 0.2, width: 150, height: 225, opacity: 0.2 } // right
		];
	}

	// html2canvas cannot reliably rasterize inline <svg> leaves once there's
	// enough other content sharing the same capture — confirmed by testing
	// that only the first of 8 identical leaves would render, silently
	// dropping the rest, regardless of position/filters/timing. So leaves
	// never touch the DOM for export: they're drawn directly with Canvas 2D
	// (Path2D understands the same SVG path syntax) onto the base canvas,
	// which html2canvas's separately-captured content is then drawn over.
	function drawLeavesOnCanvas(ctx, scale, width, height) {
		var path = new Path2D(LEAF_PATH_D);
		var VIEWBOX_W = 260;
		var VIEWBOX_H = 270;
		var VIEWBOX_CY = 5; // center of viewBox="-130 -130 260 270" (x center is 0)

		computeLeafRects(width, height).forEach(function (rect) {
			// Match SVG's default preserveAspectRatio="xMidYMid meet": scale
			// uniformly (never stretch) and center within the box, instead of
			// independently fitting width/height which distorted every leaf.
			var s = Math.min(rect.width / VIEWBOX_W, rect.height / VIEWBOX_H);
			var translateX = (rect.left + rect.width / 2) * scale;
			var translateY = (rect.top + rect.height / 2 - VIEWBOX_CY * s) * scale;

			ctx.save();
			ctx.translate(translateX, translateY);
			ctx.scale(s * scale, s * scale);
			ctx.globalAlpha = rect.opacity;
			ctx.fillStyle = '#123018';
			ctx.strokeStyle = '#39ff6a';
			ctx.lineWidth = 2.4;
			ctx.fill(path);
			ctx.stroke(path);
			ctx.restore();
		});
	}

	function drawExportBackground(ctx, scale, width, height) {
		var gradient = ctx.createLinearGradient(0, 0, width * 0.3 * scale, height * scale);
		gradient.addColorStop(0, '#163b1c');
		gradient.addColorStop(0.65, '#0d2612');
		gradient.addColorStop(1, '#061a0c');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width * scale, height * scale);
		drawLeavesOnCanvas(ctx, scale, width, height);
	}

	// html2canvas ignores `background: none` / `backgroundColor: null` here and
	// always paints in some opaque background (it was covering the leaves
	// entirely, confirmed by testing), so true per-pixel transparency has to be
	// reconstructed by hand: render the same content once on pure black and
	// once on pure white, then back-solve alpha and true color from how much
	// each pixel darkens/lightens between the two. This also correctly
	// preserves partial transparency (e.g. the cards' faint white tint), not
	// just fully-opaque-vs-fully-transparent pixels.
	function extractAlphaCanvas(blackCanvas, whiteCanvas) {
		var w = blackCanvas.width;
		var h = blackCanvas.height;
		var bData = blackCanvas.getContext('2d').getImageData(0, 0, w, h);
		var wData = whiteCanvas.getContext('2d').getImageData(0, 0, w, h);
		var out = new ImageData(w, h);

		for (var i = 0; i < bData.data.length; i += 4) {
			var alpha = 0;
			for (var c = 0; c < 3; c++) {
				var a = 255 - (wData.data[i + c] - bData.data[i + c]);
				if (a > alpha) alpha = a;
			}
			out.data[i + 3] = alpha;
			var alphaFrac = alpha / 255;
			for (var c2 = 0; c2 < 3; c2++) {
				out.data[i + c2] =
					alphaFrac > 0.02 ? Math.min(255, Math.max(0, bData.data[i + c2] / alphaFrac)) : bData.data[i + c2];
			}
		}

		var outCanvas = document.createElement('canvas');
		outCanvas.width = w;
		outCanvas.height = h;
		outCanvas.getContext('2d').putImageData(out, 0, 0);
		return outCanvas;
	}

	downloadBtn.addEventListener('click', function () {
		downloadBtn.disabled = true;
		var originalLabel = downloadBtn.textContent;
		downloadBtn.textContent = 'Готовим изображение…';

		var exportContainer = document.createElement('div');
		exportContainer.className = 'a4-export';

		var header = document.createElement('header');
		header.className = 'menu-header';
		header.style.position = 'relative';
		header.style.zIndex = '1';
		header.innerHTML =
			'<span class="kicker">— добро пожаловать в —</span>' +
			'<h1>Green&nbsp;Chaos&nbsp;Pub</h1>' +
			'<p class="subtitle">Барная карта</p>' +
			'<div class="ornament"><span class="ornament__line"></span><span class="ornament__leaf">❦</span><span class="ornament__line"></span></div>';
		exportContainer.appendChild(header);

		var main = document.createElement('main');
		main.className = 'menu-columns';
		main.style.position = 'relative';
		main.style.zIndex = '1';
		renderMenuSections(MenuStore.load(), main);
		exportContainer.appendChild(main);

		var footer = document.createElement('footer');
		footer.className = 'menu-footer';
		footer.style.position = 'relative';
		footer.style.zIndex = '1';
		footer.innerHTML =
			'<div class="ornament"><span class="ornament__line"></span><span class="ornament__leaf">❦</span><span class="ornament__line"></span></div>' +
			'<p class="copyright">&copy; 2026 Green Chaos Pub</p>';
		exportContainer.appendChild(footer);

		document.body.appendChild(exportContainer);

		var exportWidth = 1240;
		var exportHeight = exportContainer.getBoundingClientRect().height;
		var scale = 2;

		document.fonts.ready
			.then(function () {
				return Promise.all([
					html2canvas(exportContainer, { scale: scale, backgroundColor: '#000000' }),
					html2canvas(exportContainer, { scale: scale, backgroundColor: '#ffffff' })
				]);
			})
			.then(function (renders) {
				var contentCanvas = extractAlphaCanvas(renders[0], renders[1]);

				var finalCanvas = document.createElement('canvas');
				finalCanvas.width = exportWidth * scale;
				finalCanvas.height = exportHeight * scale;
				var ctx = finalCanvas.getContext('2d');
				drawExportBackground(ctx, scale, exportWidth, exportHeight);
				ctx.drawImage(contentCanvas, 0, 0);

				var link = document.createElement('a');
				link.download = 'green-chaos-pub-menu.jpg';
				link.href = finalCanvas.toDataURL('image/jpeg', 0.92);
				link.click();
			})
			.catch(function (err) {
				console.error(err);
				showStatus('Не удалось создать изображение. Попробуйте ещё раз.');
			})
			.finally(function () {
				exportContainer.remove();
				downloadBtn.disabled = false;
				downloadBtn.textContent = originalLabel;
			});
	});

	showReadView();
})();
