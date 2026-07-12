'use strict';
'require baseclass';
'require ui';

return baseclass.extend({
	__init__: function() {
		ui.menu.load().then(L.bind(this.render, this));
	},

	render: function(tree) {
		var node = tree;
		var url = '';

		if (L.env.dispatchpath.length < 3)
			return;

		for (var i = 0; i < 3 && node; i++) {
			node = node.children[L.env.dispatchpath[i]];
			url += (url ? '/' : '') + L.env.dispatchpath[i];
		}

		if (node)
			this.renderTabMenu(node, url);
	},

	renderTabMenu: function(tree, url, level) {
		var container = document.querySelector('#tabmenu');
		var children = ui.menu.getChildren(tree);
		var activeNode = null;

		if (!container || children.length === 0)
			return;

		var ul = E('ul', { 'class': 'tabs' });
		var pathIndex = 3 + (level || 0);

		children.forEach(function(child) {
			var isActive = L.env.dispatchpath[pathIndex] === child.name;

			ul.appendChild(E('li', {
				'class': 'tabmenu-item-%s%s'.format(child.name, isActive ? ' active' : '')
			}, [
				E('a', { 'href': L.url(url, child.name) }, [ _(child.title) ])
			]));

			if (isActive)
				activeNode = child;
		});

		container.appendChild(ul);
		container.style.display = '';

		if (activeNode)
			this.renderTabMenu(activeNode, url + '/' + activeNode.name, (level || 0) + 1);
	}
});
