(function () {
	// NOTE: this is a client-side gate only -- admin.js is a public file, so
	// anyone can read these credentials by viewing source. It stops casual
	// visitors from seeing the admin UI, nothing more. The Firestore document
	// itself is still writable by anyone who calls its API directly (per the
	// open security rules), regardless of this login.
	var ADMIN_LOGIN = 'admin-gcp';
	var ADMIN_PASSWORD = '123123123';
	var AUTH_KEY = 'greenChaosPubAdminAuthed';

	var loginGate = document.getElementById('loginGate');
	var loginUser = document.getElementById('loginUser');
	var loginPass = document.getElementById('loginPass');
	var loginError = document.getElementById('loginError');
	var adminGated = document.getElementById('adminGated');
	var logoutBtn = document.getElementById('logoutBtn');

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
		menuColumns.setAttribute('aria-busy', 'true');
		return MenuStore.load()
			.then(function (data) {
				renderMenuSections(data, menuColumns);
				editBtn.hidden = false;
				saveBtn.hidden = true;
				cancelBtn.hidden = true;
			})
			.finally(function () {
				menuColumns.removeAttribute('aria-busy');
			});
	}

	editBtn.addEventListener('click', function () {
		editBtn.disabled = true;
		MenuStore.load()
			.then(function (data) {
				renderMenuEditor(data, menuColumns);
				editBtn.hidden = true;
				saveBtn.hidden = false;
				cancelBtn.hidden = false;
				showStatus('');
			})
			.catch(function (err) {
				console.error(err);
				showStatus('Не удалось загрузить меню для редактирования. Попробуйте ещё раз.');
			})
			.finally(function () {
				editBtn.disabled = false;
			});
	});

	saveBtn.addEventListener('click', function () {
		var data = readEditorData(menuColumns);
		if (!data.length) {
			showStatus('Нужен хотя бы один раздел с названием.');
			return;
		}
		saveBtn.disabled = true;
		MenuStore.save(data)
			.then(function () {
				return showReadView();
			})
			.then(function () {
				showStatus('Меню обновлено — изменения уже видны на главной странице.');
			})
			.catch(function (err) {
				console.error(err);
				showStatus('Не удалось сохранить меню. Проверьте соединение и попробуйте ещё раз.');
			})
			.finally(function () {
				saveBtn.disabled = false;
			});
	});

	cancelBtn.addEventListener('click', function () {
		showReadView();
		showStatus('');
	});

	resetBtn.addEventListener('click', function () {
		if (!confirm('Сбросить меню к исходному варианту? Все изменения будут потеряны.')) return;
		resetBtn.disabled = true;
		MenuStore.reset()
			.then(function () {
				return showReadView();
			})
			.then(function () {
				showStatus('Меню сброшено к исходному варианту.');
			})
			.catch(function (err) {
				console.error(err);
				showStatus('Не удалось сбросить меню. Проверьте соединение и попробуйте ещё раз.');
			})
			.finally(function () {
				resetBtn.disabled = false;
			});
	});

	// html2canvas renders the group-title SVG icons (cocktail glass, beer mug,
	// etc.) with visibly wrong, background-dependent fill opacity under the
	// black/white dual-capture used for export (confirmed by comparing the two
	// raw captures directly: the same "opaque" fill looked solid on black but
	// washed out near-white on white, which should never happen for a real
	// opaque fill) -- so exactly like the corner leaves, these icons are
	// measured, hidden from the DOM capture, and redrawn by hand with Canvas
	// 2D afterward instead of being left to html2canvas.
	var GROUP_ICON_DEFS = {
		'cocktail-icon': {
			viewBox: { minX: -4, minY: -4, width: 56, height: 52 },
			shapes: [
				{ d: 'M4 4H44L24 26Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 2 },
				{ cx: 24, cy: 14, r: 3, fill: '#123018', stroke: '#39ff6a', strokeWidth: 2 },
				{ d: 'M24 26V40', fill: 'none', stroke: '#39ff6a', strokeWidth: 2 },
				{ d: 'M13 44H35', fill: 'none', stroke: '#39ff6a', strokeWidth: 2 },
				{ d: 'M26.5 12L34 0', fill: 'none', stroke: '#39ff6a', strokeWidth: 2 }
			]
		},
		'beer-icon': {
			viewBox: { minX: -4, minY: -4, width: 56, height: 52 },
			shapes: [
				{ d: 'M10 10H38V44H10Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 2 },
				{ d: 'M9 9Q13 2 17 9Q21 2 25 9Q29 2 33 9Q37 2 38 9', fill: 'none', stroke: '#39ff6a', strokeWidth: 2 },
				{ d: 'M38 16C48 16 48 34 38 34', fill: 'none', stroke: '#39ff6a', strokeWidth: 2 },
				{ cx: 20, cy: 24, r: 1.6, fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 },
				{ cx: 27, cy: 31, r: 1.3, fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 }
			]
		},
		'soda-icon': {
			viewBox: { minX: -2, minY: -2, width: 28, height: 52 },
			shapes: [
				{
					d: 'M9 0H15V4L18 10L20 16L17 26L20 36L19 48H5L4 36L7 26L4 16L6 10L9 4Z',
					fill: '#123018',
					stroke: '#39ff6a',
					strokeWidth: 1.6
				},
				{ d: 'M9 2H15', fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 },
				{ d: 'M6 30H18', fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 }
			]
		},
		'shot-icon': {
			viewBox: { minX: -2, minY: -2, width: 42, height: 34 },
			shapes: [
				{ d: 'M2 12H10L9 28H3Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 1.6 },
				{ d: 'M14 6H24L22.5 28H15.5Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 1.6 },
				{ d: 'M28 12H36L35 28H29Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 1.6 },
				{ d: 'M17 9L19 7', fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 }
			]
		},
		'wine-icon': {
			viewBox: { minX: -4, minY: -4, width: 56, height: 52 },
			shapes: [
				{ d: 'M6 6C6 18 14 26 24 26C34 26 42 18 42 6Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 2 },
				{ d: 'M24 26V40', fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 },
				{ d: 'M13 44H35', fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 },
				{ d: 'M11 13Q24 20 37 13', fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 },
				{ d: 'M12 9L14 7', fill: 'none', stroke: '#39ff6a', strokeWidth: 1.4 }
			]
		},
		'snack-icon': {
			viewBox: { minX: -2, minY: -4, width: 34, height: 30 },
			shapes: [
				{ d: 'M4 3C18 1 28 8 30 14C28 20 18 27 4 25Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 1.3 },
				{ d: 'M12 3Q14 -2 17 2Q15 4 12 3Z', fill: '#123018', stroke: '#39ff6a', strokeWidth: 1.3 },
				{ cx: 19, cy: 10, r: 1.8, fill: '#39ff6a', stroke: 'none' },
				{ d: 'M6 9Q9 14 6 19', fill: 'none', stroke: '#39ff6a', strokeWidth: 1 },
				{ d: 'M26 17Q30 17.5 28 20', fill: 'none', stroke: '#39ff6a', strokeWidth: 1 }
			]
		}
	};

	// Mirrors the `filter: drop-shadow(...)` neon glow CSS gives every .leaf
	// and group-title icon (see style.css) -- ctx.filter accepts the same
	// syntax, but blur radii are CSS px so they need scaling up to match the
	// export's DPI multiplier.
	function neonGlowFilter(scale, nearPx, nearAlpha, farPx, farAlpha) {
		return (
			'drop-shadow(0 0 ' + nearPx * scale + 'px rgba(57, 255, 106, ' + nearAlpha + ')) ' +
			'drop-shadow(0 0 ' + farPx * scale + 'px rgba(57, 255, 106, ' + farAlpha + '))'
		);
	}

	// x/y/width/height are CSS px relative to the export container (as measured
	// via getBoundingClientRect); scale is the export's DPI multiplier.
	function drawGroupIcon(ctx, iconKey, x, y, width, height, scale) {
		var def = GROUP_ICON_DEFS[iconKey];
		if (!def) return;
		var vb = def.viewBox;
		var fitScale = Math.min(width / vb.width, height / vb.height);
		var vbCenterX = vb.minX + vb.width / 2;
		var vbCenterY = vb.minY + vb.height / 2;
		var boxCenterX = (x + width / 2) * scale;
		var boxCenterY = (y + height / 2) * scale;

		ctx.save();
		ctx.translate(boxCenterX - vbCenterX * fitScale * scale, boxCenterY - vbCenterY * fitScale * scale);
		ctx.scale(fitScale * scale, fitScale * scale);
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.filter = neonGlowFilter(scale, 5, 0.55, 14, 0.28);

		def.shapes.forEach(function (shape) {
			ctx.beginPath();
			if (shape.d) {
				var path = new Path2D(shape.d);
				ctx.lineWidth = shape.strokeWidth || 1;
				if (shape.fill !== 'none') {
					ctx.fillStyle = shape.fill;
					ctx.fill(path);
				}
				if (shape.stroke !== 'none') {
					ctx.strokeStyle = shape.stroke;
					ctx.stroke(path);
				}
			} else {
				ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
				ctx.lineWidth = shape.strokeWidth || 1;
				if (shape.fill !== 'none') {
					ctx.fillStyle = shape.fill;
					ctx.fill();
				}
				if (shape.stroke !== 'none') {
					ctx.strokeStyle = shape.stroke;
					ctx.stroke();
				}
			}
		});

		ctx.restore();
	}

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
			{ left: -70, top: -60, width: 260, height: 390, opacity: 0.2, rotate: 18 }, // tl
			{
				left: width - 220 + 90,
				top: -40,
				width: 220,
				height: 330,
				opacity: 0.35,
				rotate: -150,
				flipX: true
			}, // tr
			{
				left: -60,
				top: height - 360 + 80,
				width: 240,
				height: 360,
				opacity: 0.4,
				rotate: -20,
				flipX: true
			}, // bl
			{
				left: width - 280 + 80,
				top: height - 420 + 70,
				width: 280,
				height: 420,
				opacity: 0.2,
				rotate: 165
			}, // br
			{
				left: width * 0.5 - 100,
				top: height * 0.45 - 150,
				width: 200,
				height: 300,
				opacity: 0.14,
				rotate: 8
			}, // mid
			{
				left: width * 0.55 - 80,
				top: -30,
				width: 160,
				height: 240,
				opacity: 0.22,
				rotate: 100,
				flipX: true
			}, // top
			{
				left: -50,
				top: height * 0.55 - 127.5,
				width: 170,
				height: 255,
				opacity: 0.24,
				rotate: -55
			}, // left
			{
				left: width - 150 + 40,
				top: height * 0.2,
				width: 150,
				height: 225,
				opacity: 0.2,
				rotate: 60,
				flipX: true
			} // right
		];
	}

	// html2canvas cannot reliably rasterize inline <svg> leaves once there's
	// enough other content sharing the same capture — confirmed by testing
	// that only the first of 8 identical leaves would render, silently
	// dropping the rest, regardless of position/filters/timing. So leaves
	// never touch the DOM for export: they're drawn directly with Canvas 2D
	// (Path2D understands the same SVG path syntax) onto the base canvas,
	// which html2canvas's separately-captured content is then drawn over.
	// extraBlurPx (device px) is only set while faking .group's backdrop-blur
	// (see blurBackgroundUnderGroups) -- it has to be folded into each leaf's
	// own ctx.filter rather than relied on as ambient state, because each leaf
	// sets its own filter (for its neon glow) inside its own save/restore,
	// which would otherwise silently drop any filter set by the caller.
	function drawLeavesOnCanvas(ctx, scale, width, height, extraBlurPx) {
		var path = new Path2D(LEAF_PATH_D);
		var VIEWBOX_W = 260;
		var VIEWBOX_H = 270;
		var VIEWBOX_CY = 5; // center of viewBox="-130 -130 260 270" (x center is 0)
		var blurPrefix = extraBlurPx ? 'blur(' + extraBlurPx + 'px) ' : '';

		computeLeafRects(width, height).forEach(function (rect) {
			// Match SVG's default preserveAspectRatio="xMidYMid meet": scale
			// uniformly (never stretch) and center within the box, instead of
			// independently fitting width/height which distorted every leaf.
			var s = Math.min(rect.width / VIEWBOX_W, rect.height / VIEWBOX_H);
			var cx = (rect.left + rect.width / 2) * scale;
			var cy = (rect.top + rect.height / 2) * scale;

			ctx.save();
			ctx.translate(cx, cy);
			// Reproduce the live page's .leaf--* CSS transform (rotate then
			// scaleX(-1)), applied around the box center same as CSS does,
			// before the viewBox-fit scale below.
			if (rect.rotate) ctx.rotate((rect.rotate * Math.PI) / 180);
			if (rect.flipX) ctx.scale(-1, 1);
			ctx.scale(s * scale, s * scale);
			ctx.translate(0, -VIEWBOX_CY);
			ctx.globalAlpha = rect.opacity;
			ctx.filter = blurPrefix + neonGlowFilter(scale, 6, 0.6, 18, 0.3);
			ctx.fillStyle = '#123018';
			ctx.strokeStyle = '#39ff6a';
			ctx.lineWidth = 2.4;
			ctx.fill(path);
			ctx.stroke(path);
			ctx.restore();
		});
	}

	function drawExportBackground(ctx, scale, width, height, extraBlurPx) {
		var gradient = ctx.createLinearGradient(0, 0, width * 0.3 * scale, height * scale);
		gradient.addColorStop(0, '#163b1c');
		gradient.addColorStop(0.65, '#0d2612');
		gradient.addColorStop(1, '#061a0c');
		ctx.filter = extraBlurPx ? 'blur(' + extraBlurPx + 'px)' : 'none';
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width * scale, height * scale);
		drawLeavesOnCanvas(ctx, scale, width, height, extraBlurPx);
	}

	// .a4-export .group turns off `backdrop-filter: blur(3px)` (see style.css)
	// because html2canvas can't rasterize it, so it's faked here: clip to each
	// group's measured rect and repaint the same background+leaves through
	// ctx.filter blur, matching what backdrop-filter would have sampled from
	// the content actually behind that card.
	function blurBackgroundUnderGroups(ctx, scale, width, height, groupRects) {
		var blurPx = 3 * scale;
		groupRects.forEach(function (rect) {
			ctx.save();
			ctx.beginPath();
			ctx.rect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale);
			ctx.clip();
			drawExportBackground(ctx, scale, width, height, blurPx);
			ctx.restore();
		});
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

		var exportWidth = 1240;
		var scale = 2;
		var exportContainer = null;

		MenuStore.load()
			.then(function (data) {
				exportContainer = document.createElement('div');
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
				renderMenuSections(data, main);
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

				return document.fonts.ready;
			})
			.then(function () {
				// Measure each group-title icon's position (in CSS px relative to
				// the export container) and hide it before html2canvas ever sees
				// it -- visibility:hidden keeps the text layout identical (space
				// still reserved) but excludes the icon from the capture entirely.
				// It's redrawn by hand afterward via drawGroupIcon.
				var containerRect = exportContainer.getBoundingClientRect();
				var iconRects = [];
				Array.prototype.forEach.call(exportContainer.querySelectorAll('.group__title-text svg'), function (svg) {
					var rect = svg.getBoundingClientRect();
					iconRects.push({
						key: svg.getAttribute('class'),
						x: rect.left - containerRect.left,
						y: rect.top - containerRect.top,
						width: rect.width,
						height: rect.height
					});
					svg.style.visibility = 'hidden';
				});

				// Measure each card's rect too, so its backdrop-blur can be faked
				// on the canvas below (see blurBackgroundUnderGroups).
				var groupRects = [];
				Array.prototype.forEach.call(exportContainer.querySelectorAll('.group'), function (group) {
					var rect = group.getBoundingClientRect();
					groupRects.push({
						x: rect.left - containerRect.left,
						y: rect.top - containerRect.top,
						width: rect.width,
						height: rect.height
					});
				});

				return Promise.all([
					html2canvas(exportContainer, { scale: scale, backgroundColor: '#000000' }),
					html2canvas(exportContainer, { scale: scale, backgroundColor: '#ffffff' })
				]).then(function (renders) {
					return { renders: renders, iconRects: iconRects, groupRects: groupRects };
				});
			})
			.then(function (result) {
				var exportHeight = exportContainer.getBoundingClientRect().height;
				var contentCanvas = extractAlphaCanvas(result.renders[0], result.renders[1]);

				var finalCanvas = document.createElement('canvas');
				finalCanvas.width = exportWidth * scale;
				finalCanvas.height = exportHeight * scale;
				var ctx = finalCanvas.getContext('2d');
				drawExportBackground(ctx, scale, exportWidth, exportHeight);
				blurBackgroundUnderGroups(ctx, scale, exportWidth, exportHeight, result.groupRects);
				ctx.drawImage(contentCanvas, 0, 0);

				result.iconRects.forEach(function (rect) {
					drawGroupIcon(ctx, rect.key, rect.x, rect.y, rect.width, rect.height, scale);
				});

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
				if (exportContainer) exportContainer.remove();
				downloadBtn.disabled = false;
				downloadBtn.textContent = originalLabel;
			});
	});

	function unlockAdmin() {
		loginGate.hidden = true;
		adminGated.hidden = false;
		showReadView();
	}

	function lockAdmin() {
		sessionStorage.removeItem(AUTH_KEY);
		adminGated.hidden = true;
		loginGate.hidden = false;
		loginPass.value = '';
		loginUser.focus();
	}

	loginGate.addEventListener('submit', function (event) {
		event.preventDefault();
		if (loginUser.value === ADMIN_LOGIN && loginPass.value === ADMIN_PASSWORD) {
			sessionStorage.setItem(AUTH_KEY, 'true');
			loginError.textContent = '';
			unlockAdmin();
		} else {
			loginError.textContent = 'Неверный логин или пароль.';
			loginPass.value = '';
			loginPass.focus();
		}
	});

	logoutBtn.addEventListener('click', lockAdmin);

	if (sessionStorage.getItem(AUTH_KEY) === 'true') {
		unlockAdmin();
	}
})();
