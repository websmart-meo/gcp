function renderMenuSections(data, container) {
	container.innerHTML = '';

	data.forEach(function (group) {
		var section = document.createElement('section');
		section.className = 'group';

		var h2 = document.createElement('h2');
		h2.className = 'group__title';

		var titleGroup = document.createElement('span');
		titleGroup.className = 'group__title-text';

		var titleSpan = document.createElement('span');
		titleSpan.textContent = group.title;
		titleGroup.appendChild(titleSpan);

		if (group.title === 'Коктейли') {
			titleGroup.insertAdjacentHTML(
				'beforeend',
				'<svg class="cocktail-icon" viewBox="-4 -4 56 52" aria-hidden="true">' +
					'<path class="cocktail-icon__glass" d="M4 4H44L24 26Z" />' +
					'<path class="cocktail-icon__line" d="M24 26V40" />' +
					'<path class="cocktail-icon__line" d="M13 44H35" />' +
					'<circle class="cocktail-icon__glass" cx="24" cy="14" r="3" />' +
					'<path class="cocktail-icon__line" d="M26.5 12L34 0" />' +
					'</svg>'
			);
		}

		if (group.title === 'Пиво') {
			titleGroup.insertAdjacentHTML(
				'beforeend',
				'<svg class="beer-icon" viewBox="-4 -4 56 52" aria-hidden="true">' +
					'<path class="beer-icon__glass" d="M10 10H38V44H10Z" />' +
					'<path class="beer-icon__line" d="M9 9Q13 2 17 9Q21 2 25 9Q29 2 33 9Q37 2 38 9" />' +
					'<path class="beer-icon__line" d="M38 16C48 16 48 34 38 34" />' +
					'<circle class="beer-icon__bubble" cx="20" cy="24" r="1.6" />' +
					'<circle class="beer-icon__bubble" cx="27" cy="31" r="1.3" />' +
					'</svg>'
			);
		}

		if (group.title === 'Б/А напитки') {
			titleGroup.insertAdjacentHTML(
				'beforeend',
				'<svg class="soda-icon" viewBox="-2 -2 28 52" aria-hidden="true">' +
					'<path class="soda-icon__glass" d="M9 0H15V4L18 10L20 16L17 26L20 36L19 48H5L4 36L7 26L4 16L6 10L9 4Z" />' +
					'<path class="soda-icon__line" d="M9 2H15" />' +
					'<path class="soda-icon__line" d="M6 30H18" />' +
					'</svg>'
			);
		}

		if (group.title === 'Шоты') {
			titleGroup.insertAdjacentHTML(
				'beforeend',
				'<svg class="shot-icon" viewBox="-2 -2 42 34" aria-hidden="true">' +
					'<path class="shot-icon__glass" d="M2 12H10L9 28H3Z" />' +
					'<path class="shot-icon__glass" d="M14 6H24L22.5 28H15.5Z" />' +
					'<path class="shot-icon__glass" d="M28 12H36L35 28H29Z" />' +
					'<path class="shot-icon__line" d="M17 9L19 7" />' +
					'</svg>'
			);
		}

		if (group.title === 'Вино и аперитивы') {
			titleGroup.insertAdjacentHTML(
				'beforeend',
				'<svg class="wine-icon" viewBox="-4 -4 56 52" aria-hidden="true">' +
					'<path class="wine-icon__glass" d="M6 6C6 18 14 26 24 26C34 26 42 18 42 6Z" />' +
					'<path class="wine-icon__line" d="M24 26V40" />' +
					'<path class="wine-icon__line" d="M13 44H35" />' +
					'<path class="wine-icon__line" d="M11 13Q24 20 37 13" />' +
					'<path class="wine-icon__line" d="M12 9L14 7" />' +
					'</svg>'
			);
		}

		if (group.title === 'Закуски') {
			titleGroup.insertAdjacentHTML(
				'beforeend',
				'<svg class="snack-icon" viewBox="-2 -4 34 30" aria-hidden="true">' +
					'<path class="snack-icon__fish" d="M4 3C18 1 28 8 30 14C28 20 18 27 4 25Z" />' +
					'<path class="snack-icon__fish" d="M12 3Q14 -2 17 2Q15 4 12 3Z" />' +
					'<circle class="snack-icon__speck" cx="19" cy="10" r="1.8" />' +
					'<path class="snack-icon__line" d="M6 9Q9 14 6 19" />' +
					'<path class="snack-icon__line" d="M26 17Q30 17.5 28 20" />' +
					'</svg>'
			);
		}

		h2.appendChild(titleGroup);

		if (group.priceNote) {
			var badge = document.createElement('span');
			badge.className = 'badge';
			badge.textContent = group.priceNote;
			h2.appendChild(badge);
		}

		section.appendChild(h2);

		var ul = document.createElement('ul');
		ul.className = 'group__list' + (group.priceNote ? ' group__list--flat' : '');

		group.items.forEach(function (item) {
			var li = document.createElement('li');

			var itemSpan = document.createElement('span');
			itemSpan.className = 'item';
			itemSpan.appendChild(document.createTextNode(item.name + (item.note ? ' ' : '')));
			if (item.note) {
				var em = document.createElement('em');
				em.textContent = '(' + item.note + ')';
				itemSpan.appendChild(em);
			}
			li.appendChild(itemSpan);

			if (!group.priceNote) {
				var dots = document.createElement('span');
				dots.className = 'dots';
				li.appendChild(dots);

				var price = document.createElement('span');
				price.className = 'price';
				price.textContent = item.price || '';
				li.appendChild(price);
			}

			ul.appendChild(li);
		});

		section.appendChild(ul);
		container.appendChild(section);
	});
}
