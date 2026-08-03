function renderMenuSections(data, container) {
	container.innerHTML = '';

	data.forEach(function (group) {
		var section = document.createElement('section');
		section.className = 'group';

		var h2 = document.createElement('h2');
		h2.className = 'group__title';

		var titleSpan = document.createElement('span');
		titleSpan.textContent = group.title;
		h2.appendChild(titleSpan);

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
