// Continental locations with real lat/lon
		const locations = [
			{ name: 'New York', lat: 40.7128, lon: -74.0060, state: 'hq', prestige: 12, income: '1.2M/s' },
			{ name: 'Rome', lat: 41.9028, lon: 12.4964, state: 'active', prestige: 3, income: '340K/s' },
			{ name: 'Casablanca', lat: 33.5731, lon: -7.5898, state: 'active', prestige: 5, income: '180K/s' },
			{ name: 'Osaka', lat: 34.6937, lon: 135.5023, state: 'locked', prestige: 12, income: 'Locked' },
			{ name: 'Paris', lat: 48.8566, lon: 2.3522, state: 'locked', prestige: 22, income: 'Locked' },
			{ name: 'Berlin', lat: 52.5200, lon: 13.4050, state: 'locked', prestige: 35, income: 'Locked' },
			{ name: 'Dubai', lat: 25.2048, lon: 55.2708, state: 'locked', prestige: 55, income: 'Locked' }
		];

		// Additional countries - 30 movie-famous countries with capitals
		const additionalCountries = [
			// North America
			{ name: 'Washington D.C.', lat: 38.9072, lon: -77.0369, continent: 'north-america' },
			{ name: 'Los Angeles', lat: 34.0522, lon: -118.2437, continent: 'north-america' },
			{ name: 'Mexico City', lat: 19.4326, lon: -99.1332, continent: 'north-america' },
			{ name: 'Havana', lat: 23.1136, lon: -82.3666, continent: 'north-america' },
			{ name: 'Ottawa', lat: 45.4215, lon: -75.6972, continent: 'north-america' },

			// South America
			{ name: 'Brasilia', lat: -15.8267, lon: -47.9218, continent: 'south-america' },
			{ name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, continent: 'south-america' },
			{ name: 'Bogota', lat: 4.7110, lon: -74.0721, continent: 'south-america' },

			// Europe
			{ name: 'London', lat: 51.5074, lon: -0.1278, continent: 'europe' },
			{ name: 'Paris', lat: 48.8566, lon: 2.3522, continent: 'europe' },
			{ name: 'Berlin', lat: 52.5200, lon: 13.4050, continent: 'europe' },
			{ name: 'Madrid', lat: 40.4168, lon: -3.7038, continent: 'europe' },
			{ name: 'Rome', lat: 41.9028, lon: 12.4964, continent: 'europe' },
			{ name: 'Moscow', lat: 55.7558, lon: 37.6173, continent: 'europe' },
			{ name: 'Vienna', lat: 48.2082, lon: 16.3738, continent: 'europe' },
			{ name: 'Athens', lat: 37.9838, lon: 23.7275, continent: 'europe' },
			{ name: 'Istanbul', lat: 41.0082, lon: 28.9784, continent: 'europe' },
			{ name: 'Amsterdam', lat: 52.3676, lon: 4.9041, continent: 'europe' },
			{ name: 'Prague', lat: 50.0755, lon: 14.4378, continent: 'europe' },

			// Asia
			{ name: 'Tokyo', lat: 35.6762, lon: 139.6503, continent: 'asia' },
			{ name: 'Beijing', lat: 39.9042, lon: 116.4074, continent: 'asia' },
			{ name: 'Seoul', lat: 37.5665, lon: 126.9780, continent: 'asia' },
			{ name: 'Hong Kong', lat: 22.3193, lon: 114.1694, continent: 'asia' },
			{ name: 'Singapore', lat: 1.3521, lon: 103.8198, continent: 'asia' },
			{ name: 'New Delhi', lat: 28.6139, lon: 77.2090, continent: 'asia' },
			{ name: 'Hanoi', lat: 21.0285, lon: 105.8542, continent: 'asia' },

			// Africa
			{ name: 'Cairo', lat: 30.0444, lon: 31.2357, continent: 'africa' },
			{ name: 'Rabat', lat: 34.0209, lon: -6.8416, continent: 'africa' },
			{ name: 'Nairobi', lat: -1.2921, lon: 36.8219, continent: 'africa' },
			{ name: 'Pretoria', lat: -25.7479, lon: 28.2293, continent: 'africa' },

			// Oceania
			{ name: 'Canberra', lat: -35.2809, lon: 149.1300, continent: 'oceania' },
			{ name: 'Sydney', lat: -33.8688, lon: 151.2093, continent: 'oceania' }
		];

		// Continent colors
		const continentColors = {
			'north-america': '#4a90e2',
			'south-america': '#50c878',
			'europe': '#9b59b6',
			'asia': '#e74c3c',
			'africa': '#f39c12',
			'oceania': '#1abc9c'
		};

		const stateIcons = {
			'hq': 'â˜…',
			'active': 'â—„',
			'locked': 'â–’',
			'conquered': 'âš”',
			'royal': 'â™›'
		};

		const stateLabels = {
			'hq': 'HQ Active',
			'active': 'Active',
			'locked': 'Locked',
			'conquered': 'Conquered',
			'royal': 'Royal'
		};

		// Setup SVG
		const svg = d3.select('#world-map');
		const width = svg.node().getBoundingClientRect().width;
		const height = svg.node().getBoundingClientRect().height;

		// Projection
		const projection = d3.geoMercator()
			.scale(width / 6)
			.translate([width / 2, height / 2]);

		const path = d3.geoPath().projection(projection);

		// Zoom behavior
		const zoom = d3.zoom()
			.scaleExtent([0.5, 8])
			.on('zoom', (event) => {
				g.attr('transform', event.transform);
			});

		svg.call(zoom);

		const g = svg.append('g');

		// Ocean background
		g.append('rect')
			.attr('class', 'ocean')
			.attr('width', width)
			.attr('height', height);

		// Load world map data
		d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
			.then(data => {
				const world = topojson.feature(data, data.objects.countries);

				// Draw countries
				g.selectAll('path')
					.data(world.features)
					.enter()
					.append('path')
					.attr('class', 'land')
					.attr('d', path)
					.on('dblclick', function (event, d) {
						const centroid = d3.geoCentroid(d);
						zoomToLocation(centroid[1], centroid[0], 4);
					});

				// Draw connection lines between active Continental nodes
				const activeNodes = locations.filter(d => d.state === 'hq' || d.state === 'active');
				const connectionPairs = [];
				for (let i = 0; i < activeNodes.length; i++) {
					for (let j = i + 1; j < activeNodes.length; j++) {
						const c1 = projection([activeNodes[i].lon, activeNodes[i].lat]);
						const c2 = projection([activeNodes[j].lon, activeNodes[j].lat]);
						connectionPairs.push({
							x1: c1[0], y1: c1[1], x2: c2[0], y2: c2[1],
							from: activeNodes[i].name, to: activeNodes[j].name
						});
					}
				}

				g.selectAll('.connection-line')
					.data(connectionPairs)
					.enter()
					.insert('line', '.country-node')
					.attr('class', d => {
						const hasHQ = d.from === 'New York' || d.to === 'New York';
						return 'connection-line' + (hasHQ ? ' active-route' : '');
					})
					.attr('x1', d => d.x1)
					.attr('y1', d => d.y1)
					.attr('x2', d => d.x2)
					.attr('y2', d => d.y2);

				// Draw additional country nodes (interactive)
				const countryNodes = g.selectAll('.country-node')
					.data(additionalCountries)
					.enter()
					.append('g')
					.attr('class', 'country-node')
					.attr('transform', d => {
						const coords = projection([d.lon, d.lat]);
						return `translate(${coords[0]},${coords[1]})`;
					});

				countryNodes.append('circle')
					.attr('r', 3)
					.attr('fill', d => continentColors[d.continent] || '#444');

				countryNodes.append('text')
					.attr('class', 'country-label')
					.attr('dy', 12)
					.attr('text-anchor', 'middle')
					.style('font-size', '8px')
					.style('fill', '#666')
					.style('pointer-events', 'none')
					.text(d => d.name);

				// Country node tooltip
				countryNodes.on('mouseover', function (event, d) {
					const tooltip = d3.select('#tooltip');
					const mapRect = document.querySelector('.map-container').getBoundingClientRect();
					tooltip.style('display', 'block');
					tooltip.style('left', (event.clientX - mapRect.left + 12) + 'px');
					tooltip.style('top', (event.clientY - mapRect.top - 10) + 'px');
					d3.select('#tooltip-title').text(d.name);
					d3.select('#tooltip-state').text(d.continent.replace('-', ' '));
					d3.select('#tooltip-prestige').text('â€”');
					d3.select('#tooltip-income').text('â€”');
				})
					.on('mouseout', function () {
						d3.select('#tooltip').style('display', 'none');
					})
					.on('click', function (event, d) {
						zoomToLocation(d.lat, d.lon, 4);
					});

				// Draw Continental nodes
				const nodes = g.selectAll('.node')
					.data(locations)
					.enter()
					.append('g')
					.attr('class', 'node')
					.attr('transform', d => {
						const coords = projection([d.lon, d.lat]);
						return `translate(${coords[0]},${coords[1]})`;
					});

				// Pulse rings for HQ and active nodes
				nodes.filter(d => d.state === 'hq' || d.state === 'active')
					.append('circle')
					.attr('class', 'node-pulse')
					.attr('r', 8)
					.style('stroke', d => d.state === 'hq' ? '#ffd700' : '#4caf50');

				// Hover ring (hidden by default, shown on hover)
				nodes.append('circle')
					.attr('class', 'node-ring')
					.attr('r', 12)
					.style('stroke', d => d.state === 'hq' ? '#ffd700' : d.state === 'active' ? '#4caf50' : '#888');

				// Node circles
				nodes.append('circle')
					.attr('r', 8)
					.attr('class', d => `node-${d.state} node-circle`);

				// Node icons
				nodes.append('text')
					.attr('class', 'node-icon')
					.attr('dy', 4)
					.text(d => stateIcons[d.state]);

				// Node labels
				nodes.append('text')
					.attr('class', 'node-label')
					.attr('dy', 20)
					.text(d => d.name);

				// Node interactions: hover, click, long-press
				let pressTimer = null;
				const mapContainer = document.querySelector('.map-container');

				nodes.on('mouseover', function (event, d) {
					const tooltip = d3.select('#tooltip');
					const mapRect = mapContainer.getBoundingClientRect();
					tooltip.style('display', 'block');
					tooltip.style('left', (event.clientX - mapRect.left + 12) + 'px');
					tooltip.style('top', (event.clientY - mapRect.top - 10) + 'px');

					d3.select('#tooltip-title').text(d.name);
					d3.select('#tooltip-state').text(stateLabels[d.state]);
					d3.select('#tooltip-prestige').text(d.prestige);
					d3.select('#tooltip-income').text(d.income);

					d3.select(this).select('.node-ring').classed('visible', true);
				})
					.on('mousemove', function (event, d) {
						const tooltip = d3.select('#tooltip');
						const mapRect = mapContainer.getBoundingClientRect();
						tooltip.style('left', (event.clientX - mapRect.left + 12) + 'px');
						tooltip.style('top', (event.clientY - mapRect.top - 10) + 'px');
					})
					.on('mouseout', function () {
						d3.select('#tooltip').style('display', 'none');
						d3.select(this).select('.node-ring').classed('visible', false);
					})
					.on('mousedown', function (event, d) {
						pressTimer = setTimeout(() => {
							showNodeDetail(d);
							pressTimer = null;
						}, 600);
					})
					.on('mouseup', function () {
						if (pressTimer) {
							clearTimeout(pressTimer);
							pressTimer = null;
						}
					})
					.on('click', function (event, d) {
						if (pressTimer !== null) return;
						g.selectAll('.node').classed('node-selected', false);
						d3.select(this).classed('node-selected', true);

						if (d.state === 'locked') {
							alert(`${d.name} is locked. Need Prestige ${d.prestige} to unlock.`);
						} else {
							zoomToLocation(d.lat, d.lon, 3);
						}
					});

				// Fit view to all nodes
				const nodeCoords = locations.map(d => projection([d.lon, d.lat]));
				const bounds = d3.geoBounds({ type: 'MultiPoint', coordinates: locations.map(d => [d.lon, d.lat]) });
				const [[x0, y0], [x1, y1]] = bounds.map(projection);

				const scale = Math.min(width / (x1 - x0), height / (y1 - y0)) * 0.8;
				const translate = [width / 2 - (x0 + x1) / 2 * scale, height / 2 - (y0 + y1) / 2 * scale];

				svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
			})
			.catch(err => {
				console.error('Error loading map data:', err);
				// Fallback: draw nodes without map
				const nodes = g.selectAll('.node')
					.data(locations)
					.enter()
					.append('g')
					.attr('class', 'node')
					.attr('transform', (d, i) => {
						const x = (width / 8) * (i % 3 + 1);
						const y = (height / 4) * (Math.floor(i / 3) + 1);
						return `translate(${x},${y})`;
					});

				nodes.append('circle')
					.attr('r', 8)
					.attr('class', d => `node-${d.state}`);

				nodes.append('text')
					.attr('class', 'node-icon')
					.attr('dy', 4)
					.text(d => stateIcons[d.state]);

				nodes.append('text')
					.attr('class', 'node-label')
					.attr('dy', 20)
					.text(d => d.name);
			});

		// Zoom to a specific lat/lon location
		function zoomToLocation(lat, lon, targetScale) {
			const coords = projection([lon, lat]);
			const svgRect = svg.node().getBoundingClientRect();
			const tx = svgRect.width / 2 - coords[0] * targetScale;
			const ty = svgRect.height / 2 - coords[1] * targetScale;
			svg.transition().duration(600).call(
				zoom.transform,
				d3.zoomIdentity.translate(tx, ty).scale(targetScale)
			);
		}

		// Show detailed node info panel (long-press)
		function showNodeDetail(d) {
			const panel = document.getElementById('node-detail');
			document.getElementById('detail-title').textContent = d.name;
			document.getElementById('detail-state').textContent = stateLabels[d.state];
			document.getElementById('detail-prestige').textContent = d.prestige;
			document.getElementById('detail-income').textContent = d.income;

			const repMap = { hq: 723, active: Math.floor(200 + Math.random() * 300), locked: 0 };
			document.getElementById('detail-rep').textContent = repMap[d.state] || 0;
			document.getElementById('detail-heat').textContent = d.state === 'locked' ? 'â€”' : Math.floor(Math.random() * 5) + '/10';

			const tkPct = d.state === 'hq' ? 40 : d.state === 'active' ? 15 : 0;
			document.getElementById('detail-takeover-bar').style.width = tkPct + '%';
			document.getElementById('detail-takeover-text').textContent = tkPct + '%';
			document.getElementById('detail-takeover-req').textContent = `P.${d.prestige} ${d.prestige <= 12 ? 'âœ“' : 'âœ—'} | 1e15 âœ—`;

			if (d.state === 'locked') {
				document.getElementById('detail-uw-arm').textContent = 'â€”';
				document.getElementById('detail-uw-troop').textContent = 'â€”';
				document.getElementById('detail-uw-contra').textContent = 'â€”';
				document.getElementById('detail-uw-intel').textContent = 'â€”';
			} else {
				document.getElementById('detail-uw-arm').textContent = Math.floor(underworldResources.armaments.value) + '/500';
				document.getElementById('detail-uw-troop').textContent = Math.floor(underworldResources.troopers.value) + '/100';
				document.getElementById('detail-uw-contra').textContent = Math.floor(underworldResources.contraband.value) + '/1000';
				document.getElementById('detail-uw-intel').textContent = Math.floor(underworldResources.intel.value) + '/200';
			}

			panel.style.display = 'block';
		}

		function closeNodeDetail() {
			document.getElementById('node-detail').style.display = 'none';
		}

		// Country search
		function handleSearch(query) {
			const resultsDiv = document.getElementById('search-results');
			const searchTerm = query.toLowerCase().trim();

			if (!searchTerm) {
				resultsDiv.style.display = 'none';
				clearSearchHighlight();
				return;
			}

			const allLocations = [...locations, ...additionalCountries];
			const matches = allLocations.filter(d => d.name.toLowerCase().includes(searchTerm));

			if (matches.length === 0) {
				resultsDiv.style.display = 'none';
				return;
			}

			resultsDiv.innerHTML = matches.map(d =>
				`<div class="search-result-item" onclick="selectSearchResult('${d.name}', ${d.lat}, ${d.lon})">${d.name}</div>`
			).join('');
			resultsDiv.style.display = 'block';

			// Highlight matching nodes
			clearSearchHighlight();
			g.selectAll('.country-node')
				.classed('country-dim', d => !d.name.toLowerCase().includes(searchTerm));
			g.selectAll('.node')
				.classed('country-dim', d => !d.name.toLowerCase().includes(searchTerm));
		}

		function selectSearchResult(name, lat, lon) {
			zoomToLocation(lat, lon, 4);
			document.getElementById('country-search').value = name;
			document.getElementById('search-results').style.display = 'none';
			clearSearchHighlight();
			g.selectAll('.country-node').classed('country-dim', d => d.name !== name);
			g.selectAll('.node').classed('country-dim', d => d.name !== name);
		}

		function clearSearchHighlight() {
			g.selectAll('.country-node').classed('country-dim', false);
			g.selectAll('.node').classed('country-dim', false);
		}

		// Hide search results when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.search-box')) {
				document.getElementById('search-results').style.display = 'none';
				clearSearchHighlight();
			}
		});

		// Zoom functions
		function zoomIn() {
			svg.transition().call(zoom.scaleBy, 1.3);
		}

		function zoomOut() {
			svg.transition().call(zoom.scaleBy, 0.7);
		}

		function resetZoom() {
			svg.transition().call(zoom.transform, d3.zoomIdentity);
		}

		// Underworld Resource System
		const underworldResources = {
			armaments: { value: 340, rate: 2, cap: 500, icon: 'ðŸ”«', name: 'Armaments' },
			troopers: { value: 24, rate: 1, cap: 100, icon: 'ðŸ›¡ï¸', name: 'Troopers' },
			contraband: { value: 612, rate: 3, cap: 1000, icon: 'ðŸ“¦', name: 'Contraband' },
			intel: { value: 45, rate: 1, cap: 200, icon: 'ðŸ“‹', name: 'Intel' },
			bloodCoins: { value: 847, rate: 0.5, cap: Infinity, icon: 'ðŸ©¸', name: 'Blood Coins' }
		};

		const blackMarketShop = [
			{ id: 'arms', name: 'Black Market Arms', desc: '+500 Armaments instantly', cost: 50, category: 'Resource Bundle', action: () => { underworldResources.armaments.value = Math.min(underworldResources.armaments.value + 500, underworldResources.armaments.cap); } },
			{ id: 'mercs', name: 'Mercenary Squad', desc: '+20 Troopers instantly', cost: 100, category: 'Resource Bundle', action: () => { underworldResources.troopers.value = Math.min(underworldResources.troopers.value + 20, underworldResources.troopers.cap); } },
			{ id: 'cache', name: "Smuggler's Cache", desc: '+300 Contraband instantly', cost: 75, category: 'Resource Bundle', action: () => { underworldResources.contraband.value = Math.min(underworldResources.contraband.value + 300, underworldResources.contraband.cap); } },
			{ id: 'broker', name: 'Information Broker', desc: '+100 Intel instantly', cost: 60, category: 'Resource Bundle', action: () => { underworldResources.intel.value = Math.min(underworldResources.intel.value + 100, underworldResources.intel.cap); } },
			{ id: 'contact', name: 'Underworld Contact', desc: 'Trigger random underworld event (2Ã— rewards)', cost: 200, category: 'Event', action: () => { alert('Underworld event triggered with 2Ã— rewards!'); } },
			{ id: 'oath', name: 'Blood Oath Token', desc: 'Next Blood Oath wager auto-wins', cost: 150, category: 'Event Manipulation', action: () => { alert('Blood Oath Token activated!'); } },
			{ id: 'bribe', name: 'Excommunicado Bribe', desc: 'Cancel next excommunicado for free', cost: 300, category: 'Event Manipulation', action: () => { alert('Excommunicado bribe set!'); } },
			{ id: 'heat', name: 'Heat Reduction', desc: 'Reduce Heat by 3 levels instantly', cost: 80, category: 'Utility', action: () => { document.getElementById('heat-level').textContent = Math.max(0, parseInt(document.getElementById('heat-level').textContent) - 3); } },
			{ id: 'sArmory', name: 'Shadow Armory', desc: 'Permanent +50% Armament generation', cost: 500, category: 'Permanent Upgrade', action: () => { underworldResources.armaments.rate *= 1.5; } },
			{ id: 'sBarracks', name: 'Shadow Barracks', desc: 'Permanent +50% Trooper generation', cost: 500, category: 'Permanent Upgrade', action: () => { underworldResources.troopers.rate *= 1.5; } },
			{ id: 'sPipeline', name: 'Shadow Pipeline', desc: 'Permanent +50% Contraband generation', cost: 500, category: 'Permanent Upgrade', action: () => { underworldResources.contraband.rate *= 1.5; } },
			{ id: 'sNetwork', name: 'Shadow Intelligence', desc: 'Permanent +50% Intel generation', cost: 500, category: 'Permanent Upgrade', action: () => { underworldResources.intel.rate *= 1.5; } },
			{ id: 'empire', name: 'Underworld Empire', desc: 'All resources +25% generation (all themes)', cost: 2000, category: 'Global Permanent', action: () => { Object.keys(underworldResources).forEach(k => { underworldResources[k].rate *= 1.25; }); } }
		];

		function updateUnderworldUI() {
			Object.keys(underworldResources).forEach(key => {
				const res = underworldResources[key];
				const idMap = { armaments: 'uw-armaments', troopers: 'uw-troopers', contraband: 'uw-contraband', intel: 'uw-intel', bloodCoins: 'uw-blood-coins' };
				const barIdMap = { armaments: 'uw-bar-armaments', troopers: 'uw-bar-troopers', contraband: 'uw-bar-contraband', intel: 'uw-bar-intel', bloodCoins: 'uw-bar-blood-coins' };
				const el = document.getElementById(idMap[key]);
				const barEl = document.getElementById(barIdMap[key]);
				if (el) el.textContent = Math.floor(res.value);
				if (barEl) barEl.style.width = Math.min(100, (res.value / res.cap) * 100) + '%';
			});
		}

		function tickUnderworld() {
			Object.keys(underworldResources).forEach(key => {
				const res = underworldResources[key];
				res.value = Math.min(res.value + res.rate, res.cap);
			});
			updateUnderworldUI();
		}

		setInterval(tickUnderworld, 1000);

		function spendResource(key) {
			const res = underworldResources[key];
			if (!res) return;
			const usage = {
				armaments: 'Sell at Black Market Vault for theme currency.\nEach assassin consumes 5/hr for +25% effectiveness.',
				troopers: 'Each Trooper reduces event penalty by 2% (max -40%).\nAuto-defends during Excommunicado (-1s each).',
				contraband: 'Sell at Black Market Vault for theme currency.\nUsed as wager in Smuggling Run events.',
				intel: 'Spend 5 Intel to preview event outcomes.\nPassively reduces Heat by 0.1/hr per Intel.',
				bloodCoins: 'Global underworld currency.\nSpend at the Black Market Shop for exclusive upgrades.'
			};
			alert(`${res.icon} ${res.name}: ${Math.floor(res.value)}\n\n${usage[key] || ''}`);
		}

		function openBlackMarket() {
			const modal = document.getElementById('black-market-modal');
			const content = modal.querySelector('.underworld-shop-content');
			const balanceEl = content.querySelector('.blood-coin-count');
			balanceEl.textContent = Math.floor(underworldResources.bloodCoins.value);

			const listEl = document.getElementById('black-market-list');
			listEl.innerHTML = '';

			let currentCategory = '';
			blackMarketShop.forEach(item => {
				if (item.category !== currentCategory) {
					currentCategory = item.category;
					const catEl = document.createElement('div');
					catEl.className = 'underworld-shop-category';
					catEl.textContent = 'â”€â”€ ' + item.category + ' â”€â”€';
					listEl.appendChild(catEl);
				}
				const itemEl = document.createElement('div');
				const canAfford = underworldResources.bloodCoins.value >= item.cost;
				itemEl.className = 'underworld-shop-item' + (canAfford ? '' : ' disabled');
				itemEl.innerHTML = `
					<div class="underworld-shop-item-info">
						<span class="underworld-shop-item-name">${item.name}</span>
						<span class="underworld-shop-item-desc">${item.desc}</span>
					</div>
					<span class="underworld-shop-item-cost">ðŸ©¸ ${item.cost}</span>
				`;
				if (canAfford) {
					itemEl.onclick = () => {
						underworldResources.bloodCoins.value -= item.cost;
						item.action();
						updateUnderworldUI();
						openBlackMarket();
					};
				}
				listEl.appendChild(itemEl);
			});

			modal.classList.add('active');
		}

		function closeBlackMarket() {
			document.getElementById('black-market-modal').classList.remove('active');
		}

		// ==================== GAME ENGINE ====================
		const BUILDINGS = [
			{ id: 'reception', name: 'Reception Desk', baseRate: 1, baseCost: 0, unlock: 'Start' },
			{ id: 'guestRooms', name: 'Guest Rooms', baseRate: 5, baseCost: 50, unlock: '50 coins' },
			{ id: 'bar', name: 'Bar/Lounge', baseRate: 15, baseCost: 500, unlock: '500 coins' },
			{ id: 'kitchen', name: 'Kitchen', baseRate: 40, baseCost: 2000, unlock: '2K' },
			{ id: 'laundry', name: 'Laundry Service', baseRate: 100, baseCost: 8000, unlock: '8K' },
			{ id: 'underground', name: 'Underground Services', baseRate: 300, baseCost: 25000, unlock: '25K' },
			{ id: 'safeHouse', name: 'Safe House', baseRate: 800, baseCost: 75000, unlock: '75K' },
			{ id: 'armory', name: 'Armory', baseRate: 2000, baseCost: 200000, unlock: '200K' },
			{ id: 'intel', name: 'Intelligence Network', baseRate: 5000, baseCost: 600000, unlock: '600K' },
			{ id: 'vip', name: 'VIP Penthouse', baseRate: 15000, baseCost: 2000000, unlock: '2M' },
			{ id: 'blackMarket', name: 'Black Market Vault', baseRate: 50000, baseCost: 10000000, unlock: '10M' },
			{ id: 'vault', name: 'Continental Vault', baseRate: 200000, baseCost: 100000000, unlock: '100M' }
		];

		const STAFF_TYPES = [
			{ id: 'concierge', name: 'Concierge', hireCost: 1000, unlock: 'Start', maxLevel: 20, effect: '+10% guest income/lvl', maxAbility: 'Auto-collect guest tips (+5% passive income)' },
			{ id: 'bartender', name: 'Bartender', hireCost: 3000, unlock: 'Bar built', maxLevel: 20, effect: '+10% lounge income/lvl', maxAbility: 'Bar income continues during excommunicado' },
			{ id: 'chef', name: 'Chef', hireCost: 8000, unlock: 'Kitchen built', maxLevel: 15, effect: '+15% kitchen income/lvl', maxAbility: 'Kitchen boosts ALL building income +10%' },
			{ id: 'cleaner', name: 'Cleaner (Disposal)', hireCost: 15000, unlock: 'Underground built', maxLevel: 15, effect: '-5% event penalty/lvl, -3% Trooper casualty/lvl', maxAbility: 'All negative event penalties negated + Trooper casualty 0%' },
			{ id: 'sommelier', name: 'Sommelier', hireCost: 50000, unlock: 'Private Wing', maxLevel: 10, effect: '+20% VIP income/lvl', maxAbility: 'VIP guests arrive 50% more frequently' },
			{ id: 'intelOfficer', name: 'Intelligence Officer', hireCost: 100000, unlock: 'Intel Network built', maxLevel: 10, effect: '-3% event cooldown/lvl, reveals Heat, +0.5x Intel/lvl', maxAbility: 'All event outcomes revealed (no Intel cost)' },
			{ id: 'adjudicator', name: 'Adjudicator', hireCost: 250000, unlock: 'Prestige 3', maxLevel: 10, effect: '+5% prestige favor/lvl', maxAbility: 'Prestige keeps 80% reputation instead of 50%' },
			{ id: 'vaultKeeper', name: 'Vault Keeper', hireCost: 500000, unlock: 'Continental Vault built', maxLevel: 10, effect: '+0.5% interest/lvl on Safe House + Vault, +5% Blood Coin/lvl', maxAbility: 'Safe House interest doubles to 4%/min + Vault favor x2' }
		];

		const STAFF_BUILDING_MATCH = {
			'concierge': ['reception', 'guestRooms', 'vip'],
			'bartender': ['bar'],
			'chef': ['kitchen'],
			'cleaner': ['underground'],
			'sommelier': ['vip', 'bar', 'guestRooms'],
			'intelOfficer': ['intel', 'underground'],
			'adjudicator': ['vault'],
			'vaultKeeper': ['safeHouse', 'blackMarket', 'vault']
		};

		const ASSASSIN_RANKS = ['C', 'B', 'A', 'S', 'SS', 'SSS'];

		const GLOBAL_ASSASSINS = [
			{ id: 'theGhost', name: 'The Ghost', rank: 'A', hireCost: 500000, ability: 'Auto-resolve 1 event per hour' },
			{ id: 'theHammer', name: 'The Hammer', rank: 'A', hireCost: 750000, ability: '+200% underground services income' },
			{ id: 'theWhisper', name: 'The Whisper', rank: 'S', hireCost: 5000000, ability: 'Reveals upcoming events 30s early' },
			{ id: 'theWolf', name: 'The Wolf', rank: 'S', hireCost: 8000000, ability: '+100% staff XP gain for all staff' },
			{ id: 'theShade', name: 'The Shade', rank: 'S', hireCost: 15000000, ability: 'Halves excommunicado penalty duration' },
			{ id: 'theBishop', name: 'The Bishop', rank: 'SS', hireCost: 100000000, ability: 'Unlocks dual-currency trading between themes' },
			{ id: 'theAdjudicatorsHand', name: "The Adjudicator's Hand", rank: 'SS', hireCost: 500000000, ability: '+50% Table Favor on prestige reset' }
		];

		const SYNERGY_PAIRS = [
			['theGhost', 'theWhisper'],
			['theHammer', 'theShade'],
			['theWolf', 'theBishop'],
			['theAdjudicatorsHand', 'theGhost']
		];

		const POSITIVE_TRAITS = [
			{ id: 'workaholic', name: 'Workaholic', type: 'positive', effect: '+25% XP gain' },
			{ id: 'nightOwl', name: 'Night Owl', type: 'positive', effect: '+50% effectiveness during excommunicado' },
			{ id: 'silverTongue', name: 'Silver Tongue', type: 'positive', effect: '+20% loyalty restoration' },
			{ id: 'luckyCharm', name: 'Lucky Charm', type: 'positive', effect: '+5% artifact drop chance' },
			{ id: 'perfectionist', name: 'Perfectionist', type: 'positive', effect: '+15% ability, -10% XP' },
			{ id: 'naturalLeader', name: 'Natural Leader', type: 'positive', effect: '+10% XP to nearby staff' },
			{ id: 'shadowTouched', name: 'Shadow Touched', type: 'positive', effect: '+30% synergy bonus' },
			{ id: 'bloodhound', name: 'Bloodhound', type: 'positive', effect: '+50% event detection' },
			{ id: 'oldGuard', name: 'Old Guard', type: 'positive', effect: 'Starts at Lv.3, +50% hire cost' },
			{ id: 'efficient', name: 'Efficient', type: 'positive', effect: '-20% rehire cost on prestige' }
		];

		const NEGATIVE_TRAITS = [
			{ id: 'lazy', name: 'Lazy', type: 'negative', effect: '-20% XP gain' },
			{ id: 'hotHeaded', name: 'Hot-Headed', type: 'negative', effect: 'Loyalty decays 2x faster' },
			{ id: 'clumsy', name: 'Clumsy', type: 'negative', effect: '-10% ability effectiveness' },
			{ id: 'superstitious', name: 'Superstitious', type: 'negative', effect: '-15% during seasonal events' },
			{ id: 'greedy', name: 'Greedy', type: 'negative', effect: '+50% rehire cost on prestige' }
		];

		const RARE_TRAITS = [
			{ id: 'legendary', name: 'Legendary', type: 'rare', effect: 'All stats +3 (max 13)' },
			{ id: 'untouchable', name: 'Untouchable', type: 'rare', effect: 'Immune to loyalty decay' },
			{ id: 'mentor', name: 'Mentor', type: 'rare', effect: '+15% XP to all staff in theme' },
			{ id: 'shadowBond', name: 'Shadow Bond', type: 'rare', effect: 'Synergy with ANY assassin' },
			{ id: 'goldenTouch', name: 'Golden Touch', type: 'rare', effect: '+10% income for entire theme' }
		];

		const DAILY_CONTRACTS = [
			{ id: 'incomeGoal', name: 'Income Goal', desc: 'Earn 100x current income/sec in 10 min', reward: '+5 Table Favor', rewardType: 'tableFavor', rewardAmt: 5 },
			{ id: 'eventMaster', name: 'Event Master', desc: 'Resolve 5 events without penalties', reward: '+50 Blood Coins', rewardType: 'bloodCoins', rewardAmt: 50 },
			{ id: 'staffTrainer', name: 'Staff Trainer', desc: 'Level up any staff 3 times', reward: '+1 Artifact drop chance', rewardType: 'artifact', rewardAmt: 1 },
			{ id: 'themeHopper', name: 'Theme Hopper', desc: 'Switch themes 3 times in 1 session', reward: '+10 Royal Marks or +15 Table Favor', rewardType: 'tableFavor', rewardAmt: 15 },
			{ id: 'loyaltyKeeper', name: 'Loyalty Keeper', desc: 'Keep all assassins above 80% loyalty for 1 hour', reward: '+20 Table Favor', rewardType: 'tableFavor', rewardAmt: 20 },
			{ id: 'buildingBoom', name: 'Building Boom', desc: 'Purchase 20 building levels in one session', reward: '+100 Blood Coins', rewardType: 'bloodCoins', rewardAmt: 100 },
			{ id: 'prestigeSprint', name: 'Prestige Sprint', desc: 'Reach 2x current theme lifetime earnings', reward: '+10 Table Favor', rewardType: 'tableFavor', rewardAmt: 10 }
		];

		const EVENTS = [
			{
				id: 'contractOpen', name: 'Contract Open', desc: 'A bounty has been placed. Accept for 2x income for 90s, but risk staff loss.', choices: [
					{ text: 'Accept (2x income, 90s)', effect: 'accept' },
					{ text: 'Decline', effect: 'decline' }
				]
			},
			{
				id: 'excommunicado', name: 'Excommunicado', desc: 'All income paused for 60s. Mitigate with Cleaner staff.', choices: [
					{ text: 'Wait it out', effect: 'wait' },
					{ text: 'Pay tribute (-10% gold)', effect: 'pay' }
				]
			},
			{
				id: 'marker', name: 'Marker Called In', desc: 'A favor is owed. Complete a mini-objective for a permanent buff.', choices: [
					{ text: 'Complete objective (+5% income)', effect: 'complete' },
					{ text: 'Refuse (marker debt accrues)', effect: 'refuse' }
				]
			},
			{
				id: 'sommelier', name: 'Sommelier Visit', desc: 'A rare guest arrives. Huge income burst if staffed correctly.', choices: [
					{ text: 'Welcome guest (income burst)', effect: 'welcome' },
					{ text: 'Turn away', effect: 'turnaway' }
				]
			}
		];

		const ACHIEVEMENTS = [
			{ id: 'firstMillion', name: 'First Million', desc: 'Reach 1M gold', reward: '+2% global income' },
			{ id: 'firstPrestige', name: 'First Ascension', desc: 'Prestige for the first time', reward: 'Unlock auto-buy' },
			{ id: 'allSS', name: 'Elite Roster', desc: 'Hire all SS-rank assassins', reward: 'Cosmetic badge' },
			{ id: 'survive100', name: 'Survivor', desc: 'Survive 100 excommunicados', reward: 'Permanent penalty -10%' },
			{ id: 'allThemes', name: 'High Table Member', desc: 'Unlock all 7 themes', reward: 'Title unlock' },
			{ id: 'defectRehire', name: 'Second Chances', desc: 'Defect an assassin then re-hire', reward: 'Lore unlock' },
			{ id: 'legendaryHire', name: 'Eye for Talent', desc: 'Hire a character with Legendary trait', reward: 'Title unlock' },
			{ id: 'fiveRare', name: 'Rare Collector', desc: 'Hire 5 characters with rare traits', reward: '+1 stat budget (21 total)' },
			{ id: 'threeVeterans', name: 'Old Guard', desc: 'Earn 3 Veteran staff across any themes', reward: 'Title + +5% staff XP global' },
			{ id: 'maxStat', name: 'Perfectionist', desc: 'Max a single stat to 10 on any character', reward: 'Title unlock' }
		];

		const TUTORIAL_STEPS = [
			'Welcome to the Continental. You manage a hotel for the underworld elite.',
			'Buy buildings to generate income. Start with Guest Rooms â€” tap [BUY].',
			'Hire staff to boost building income. Each staff type enhances specific buildings.',
			'Staff have unique Stats (Precision, Speed, Charisma, Luck) and Traits. Use Reroll to find the best!',
			'Assign staff to buildings using the dropdown for maximum effect.',
			'Watch the Heat meter. Ignoring events raises Heat, which increases danger.',
			'Events trigger randomly â€” Contract Open gives 2x income, Excommunicado pauses it.',
			'Open the Assassin Network to hire global assassins with unique abilities and synergies.',
			'Prestige resets buildings but grants Table Favor for permanent global upgrades.',
			'Staff who survive 3 prestiges become Veterans with boosted stats!',
			'Unlock new Continental branches by prestiging. Each has unique mechanics.',
			'Conquer all 7 Continentals to reach the endgame. Good luck, Manager.'
		];

		const COST_GROWTH = 1.15;
		const BUILDING_GROWTH = 1.07;
		const PRESTIGE_FAVOR_SCALE = 1e9;
		const EVENT_COOLDOWN = 45000;
		const LOYALTY_DECAY = 0.01;
		const HEAT_PER_IGNORED = 5;
		const HEAT_MAX = 10;

		let gameState = {
			gold: 1250000,
			totalEarnings: 0,
			prestige: 12,
			tableFavor: 0,
			heatLevel: 2,
			heatDecayTimer: 600,
			buyMult: 1,
			buildings: {},
			staff: {},
			assassins: [],
			eventCooldown: 0,
			activeEvent: null,
			eventTimer: 0,
			eventLog: [],
			incomeMultiplier: 1,
			incomeMultiplierTimer: 0,
			incomePaused: false,
			incomePauseTimer: 0,
			tutorialStep: 0,
			tutorialCompleted: false,
			achievements: {},
			stats: { totalEvents: 0, excommunicadosSurvived: 0, rareTraitsHired: 0, veteranCount: 0 },
			dailyContracts: [],
			dailyContractsRefresh: 0,
			loginStreak: { current: 5, lastLogin: Date.now(), bonus: 1 },
			boostTokens: [],
			lastSave: Date.now()
		};

		BUILDINGS.forEach(b => {
			gameState.buildings[b.id] = { level: b.id === 'reception' ? 50 : b.id === 'guestRooms' ? 35 : b.id === 'bar' ? 20 : b.id === 'kitchen' ? 15 : b.id === 'laundry' ? 10 : 0 };
		});
		gameState.staff['concierge'] = { level: 15, assignedTo: 'guestRooms', stats: { precision: 7, speed: 5, charisma: 2, luck: 6 }, traits: ['perfectionist', 'luckyCharm'], veteran: false, veteranPerk: null, prestigeSurvivedCount: 1 };
		gameState.staff['bartender'] = { level: 10, assignedTo: 'bar', stats: { precision: 5, speed: 7, charisma: 4, luck: 4 }, traits: ['nightOwl'], veteran: false, veteranPerk: null, prestigeSurvivedCount: 0 };

		function formatNum(n) {
			if (n < 0) return '-' + formatNum(-n);
			if (n < 1000) return Math.floor(n).toString();
			if (n < 1e6) return (n / 1e3).toFixed(2) + 'K';
			if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
			if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
			if (n < 1e15) return (n / 1e12).toFixed(2) + 'T';
			if (n < 1e18) return (n / 1e15).toFixed(2) + 'Qa';
			if (n < 1e21) return (n / 1e18).toFixed(2) + 'Qi';
			if (n < 1e24) return (n / 1e21).toFixed(2) + 'Sx';
			if (n < 1e27) return (n / 1e24).toFixed(2) + 'Sp';
			if (n < 1e30) return (n / 1e27).toFixed(2) + 'Oc';
			if (n < 1e33) return (n / 1e30).toFixed(2) + 'No';
			if (n < 1e36) return (n / 1e33).toFixed(2) + 'Dc';
			const tiers = 'abcdefghijklmnopqrstuvwxyz';
			const tierIndex = Math.floor(Math.log10(n) / 3) - 11;
			const tierChar = tiers[Math.floor(tierIndex / 26)] + tiers[tierIndex % 26];
			return (n / Math.pow(1000, tierIndex + 11)).toFixed(2) + tierChar;
		}

		function formatTime(seconds) {
			if (seconds < 60) return Math.ceil(seconds) + 's';
			if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + Math.ceil(seconds % 60) + 's';
			return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
		}

		function getBuildingCost(b, level, count) {
			let total = 0;
			for (let i = 0; i < count; i++) {
				total += b.baseCost * Math.pow(COST_GROWTH, level + i);
			}
			return total;
		}

		function getBuildingIncome(b, level) {
			return b.baseRate * Math.pow(BUILDING_GROWTH, level);
		}

		function getTotalIncome() {
			if (gameState.incomePaused) return 0;
			let total = 0;
			BUILDINGS.forEach(b => {
				const bd = gameState.buildings[b.id];
				if (bd && bd.level > 0) {
					let income = getBuildingIncome(b, bd.level);
					Object.entries(gameState.staff).forEach(([sid, sd]) => {
						if (sd.assignedTo === b.id && sd.level > 0) {
							const prec = sd.stats ? sd.stats.precision : 5;
							const statMult = 1 + prec * 0.02;
							const traitMult = getTraitIncomeMultiplier(sd.traits);
							if (sid === 'concierge' && b.id === 'guestRooms') income *= (1 + 0.10 * sd.level) * statMult * traitMult;
							if (sid === 'bartender' && b.id === 'bar') income *= (1 + 0.10 * sd.level) * statMult * traitMult;
							if (sid === 'chef' && b.id === 'kitchen') income *= (1 + 0.15 * sd.level) * statMult * traitMult;
							if (sid === 'sommelier' && b.id === 'vip') income *= (1 + 0.20 * sd.level) * statMult * traitMult;
						}
					});
					total += income;
				}
			});
			return total * gameState.incomeMultiplier;
		}

		function getTraitIncomeMultiplier(traits) {
			if (!traits) return 1;
			let mult = 1;
			if (traits.includes('goldenTouch')) mult *= 1.10;
			if (traits.includes('perfectionist')) mult *= 1.15;
			if (traits.includes('clumsy')) mult *= 0.90;
			if (traits.includes('superstitious')) mult *= 0.85;
			return mult;
		}

		function getTraitXpMultiplier(traits) {
			if (!traits) return 1;
			let mult = 1;
			if (traits.includes('workaholic')) mult *= 1.25;
			if (traits.includes('perfectionist')) mult *= 0.90;
			if (traits.includes('lazy')) mult *= 0.80;
			return mult;
		}

		function getTraitLoyaltyMultiplier(traits) {
			if (!traits) return 1;
			let mult = 1;
			if (traits.includes('hotHeaded')) mult *= 2.0;
			if (traits.includes('untouchable')) mult *= 0;
			return mult;
		}

		function rollStats() {
			const budget = 20;
			const stats = { precision: 2, speed: 2, charisma: 2, luck: 2 };
			let remaining = budget - 8;
			const keys = ['precision', 'speed', 'charisma', 'luck'];
			while (remaining > 0) {
				const key = keys[Math.floor(Math.random() * 4)];
				if (stats[key] < 10) {
					stats[key]++;
					remaining--;
				}
			}
			return stats;
		}

		function rollTraits() {
			const traits = [];
			const maxPositive = 2;
			for (let i = 0; i < maxPositive; i++) {
				if (Math.random() < 0.60) {
					const available = POSITIVE_TRAITS.filter(t => !traits.includes(t.id));
					if (available.length > 0) {
						traits.push(available[Math.floor(Math.random() * available.length)].id);
					}
				}
			}
			if (Math.random() < 0.10 && traits.length > 0) {
				const rareTrait = RARE_TRAITS[Math.floor(Math.random() * RARE_TRAITS.length)];
				traits.push(rareTrait.id);
				if (traits.length > 2) traits.shift();
			}
			if (Math.random() < 0.30) {
				const negTrait = NEGATIVE_TRAITS[Math.floor(Math.random() * NEGATIVE_TRAITS.length)];
				traits.push(negTrait.id);
			}
			return traits;
		}

		function getTraitInfo(traitId) {
			return POSITIVE_TRAITS.find(t => t.id === traitId) ||
				NEGATIVE_TRAITS.find(t => t.id === traitId) ||
				RARE_TRAITS.find(t => t.id === traitId);
		}

		function renderStatBars(stats) {
			const keys = [
				{ key: 'precision', label: 'PRE', cls: 'pre' },
				{ key: 'speed', label: 'SPD', cls: 'spd' },
				{ key: 'charisma', label: 'CHA', cls: 'cha' },
				{ key: 'luck', label: 'LCK', cls: 'lck' }
			];
			return keys.map(k => {
				const val = stats[k.key] || 1;
				const pct = Math.min(100, val * 10);
				return `<div class="stat-row"><span class="stat-label">${k.label}</span><div class="stat-bar-bg"><div class="stat-bar-fill ${k.cls}" style="width:${pct}%"></div></div><span class="stat-value">${val}</span></div>`;
			}).join('');
		}

		function renderTraitBadges(traits) {
			if (!traits || traits.length === 0) return '<span style="color:#555;font-size:9px">Plain</span>';
			return traits.map(tid => {
				const info = getTraitInfo(tid);
				if (!info) return '';
				return `<span class="trait-badge ${info.type}" title="${info.effect}">${info.name}</span>`;
			}).join('');
		}

		let hirePreviewData = null;

		function startHirePreview(staffId) {
			const s = STAFF_TYPES.find(x => x.id === staffId);
			if (!s) return;
			hirePreviewData = {
				staffId: staffId,
				stats: rollStats(),
				traits: rollTraits(),
				rerollCount: 0
			};
			renderHirePreview(s);
		}

		function renderHirePreview(s) {
			const panel = document.getElementById('hire-preview-panel');
			const content = panel.querySelector('.game-panel-content');
			const rerollCost = Math.floor(s.hireCost * 0.05 * (hirePreviewData.rerollCount + 1));
			content.innerHTML = `
				<h2>Hire ${s.name}</h2>
				<div class="hire-preview">
					<div class="hire-preview-title">Preview</div>
					${renderStatBars(hirePreviewData.stats)}
					<div class="trait-badges" style="margin-top:8px">${renderTraitBadges(hirePreviewData.traits)}</div>
				</div>
				<div class="hire-preview-actions">
					<button class="hire-reroll-btn" onclick="rerollHire('${s.id}')">Reroll: ${formatNum(rerollCost)}</button>
					<button class="hire-confirm-btn" onclick="confirmHire('${s.id}')">Hire: ${formatNum(s.hireCost)}</button>
					<button class="hire-skip-btn" onclick="closePanel('hire-preview-panel')">Skip</button>
				</div>
				<p style="color:#555;font-size:10px;margin-top:8px">Rerolls: ${hirePreviewData.rerollCount}/10 | Traits are permanent</p>
			`;
			panel.classList.add('active');
		}

		function rerollHire(staffId) {
			if (hirePreviewData.rerollCount >= 10) return;
			const s = STAFF_TYPES.find(x => x.id === staffId);
			if (!s) return;
			const cost = Math.floor(s.hireCost * 0.05 * (hirePreviewData.rerollCount + 1));
			if (gameState.gold < cost) return;
			gameState.gold -= cost;
			hirePreviewData.stats = rollStats();
			hirePreviewData.traits = rollTraits();
			hirePreviewData.rerollCount++;
			renderHirePreview(s);
			updateCurrencyDisplay();
		}

		function confirmHire(staffId) {
			const s = STAFF_TYPES.find(x => x.id === staffId);
			if (!s) return;
			if (gameState.gold < s.hireCost) return;
			gameState.gold -= s.hireCost;
			const sd = gameState.staff[staffId] || { level: 0, assignedTo: null };
			sd.level = Math.max(sd.level, 1);
			if (!sd.stats) sd.stats = hirePreviewData.stats;
			if (!sd.traits) sd.traits = hirePreviewData.traits;
			if (sd.veteran === undefined) sd.veteran = false;
			if (sd.veteranPerk === undefined) sd.veteranPerk = null;
			if (sd.prestigeSurvivedCount === undefined) sd.prestigeSurvivedCount = 0;
			gameState.staff[staffId] = sd;
			if (hirePreviewData.traits.includes('legendary') && !gameState.achievements.legendaryHire) {
				gameState.achievements.legendaryHire = true;
				showToast('Achievement: Eye for Talent!', 'success');
			}
			if (hirePreviewData.traits.some(t => RARE_TRAITS.find(rt => rt.id === t))) {
				gameState.stats.rareTraitsHired++;
				if (gameState.stats.rareTraitsHired >= 5 && !gameState.achievements.fiveRare) {
					gameState.achievements.fiveRare = true;
					showToast('Achievement: Rare Collector!', 'success');
				}
			}
			closePanel('hire-preview-panel');
			openStaffPanel();
			updateCurrencyDisplay();
		}

		function getMaxBuyCount(b, level) {
			let count = 0;
			let cost = 0;
			while (true) {
				const nextCost = b.baseCost * Math.pow(COST_GROWTH, level + count);
				if (cost + nextCost > gameState.gold) break;
				cost += nextCost;
				count++;
				if (count >= 9999) break;
			}
			return Math.max(1, count);
		}

		function buyBuilding(buildingId) {
			const b = BUILDINGS.find(x => x.id === buildingId);
			if (!b) return;
			const bd = gameState.buildings[buildingId];
			if (!bd) return;
			let count = gameState.buyMult === 0 ? getMaxBuyCount(b, bd.level) : gameState.buyMult;
			const cost = getBuildingCost(b, bd.level, count);
			if (gameState.gold >= cost && count > 0) {
				gameState.gold -= cost;
				bd.level += count;
				renderBuildings();
				updateCurrencyDisplay();
			}
		}

		function setBuyMult(mult) {
			gameState.buyMult = mult;
			document.querySelectorAll('.buy-mult-btn').forEach(btn => {
				btn.classList.remove('active');
				if ((mult === 1 && btn.textContent === 'x1') ||
					(mult === 10 && btn.textContent === 'x10') ||
					(mult === 100 && btn.textContent === 'x100') ||
					(mult === 0 && btn.textContent === 'MAX')) {
					btn.classList.add('active');
				}
			});
			renderBuildings();
		}

		function renderBuildings() {
			const list = document.getElementById('building-list');
			if (!list) return;
			list.innerHTML = '';
			BUILDINGS.forEach(b => {
				const bd = gameState.buildings[b.id];
				if (!bd) return;
				const income = getBuildingIncome(b, bd.level);
				const count = gameState.buyMult === 0 ? getMaxBuyCount(b, bd.level) : gameState.buyMult;
				const cost = getBuildingCost(b, bd.level, count);
				const affordable = gameState.gold >= cost;
				const div = document.createElement('div');
				div.className = 'building-item';
				div.innerHTML = `
					<div class="building-name">${b.name}</div>
					<div class="building-level">Lv. ${bd.level}</div>
					<div class="building-rate">${formatNum(income)}/s</div>
					<div class="building-cost ${affordable ? 'affordable' : ''}">Cost: ${formatNum(cost)}${gameState.buyMult === 0 ? ' (x' + count + ')' : ' (x' + count + ')'}</div>
					<button class="building-buy-btn ${affordable ? '' : 'disabled'}" onclick="buyBuilding('${b.id}')">BUY</button>
				`;
				div.onmouseenter = (e) => showIncomeTooltip(e, b, bd);
				div.onmouseleave = () => hideIncomeTooltip();
				list.appendChild(div);
			});
		}

		function showIncomeTooltip(e, b, bd) {
			const tooltip = document.getElementById('income-tooltip');
			const baseIncome = getBuildingIncome(b, bd.level);
			let staffBonus = 0;
			let staffLines = '';
			Object.entries(gameState.staff).forEach(([sid, sd]) => {
				if (sd.assignedTo === b.id && sd.level > 0) {
					const prec = sd.stats ? sd.stats.precision : 5;
					const statMult = 1 + prec * 0.02;
					const traitMult = getTraitIncomeMultiplier(sd.traits);
					const bonus = baseIncome * (0.10 * sd.level) * statMult * traitMult;
					staffBonus += bonus;
					const sName = STAFF_TYPES.find(x => x.id === sid);
					staffLines += `<div class="income-tooltip-row">+ ${sName ? sName.name : sid} Lv.${sd.level}: +${formatNum(bonus)}/s</div>`;
				}
			});
			const total = baseIncome + staffBonus;
			tooltip.innerHTML = `
				<div class="income-tooltip-row" style="color:#ffd700">${b.name} â€” Lv.${bd.level}</div>
				<div class="income-tooltip-row">Base: ${formatNum(baseIncome)}/s</div>
				${staffLines}
				<div class="income-tooltip-row total">Total: ${formatNum(total)}/s</div>
			`;
			tooltip.style.display = 'block';
			tooltip.style.left = (e.clientX + 15) + 'px';
			tooltip.style.top = (e.clientY + 15) + 'px';
		}

		function hideIncomeTooltip() {
			document.getElementById('income-tooltip').style.display = 'none';
		}

		function updateCurrencyDisplay() {
			const goldEl = document.getElementById('gold-display');
			const incomeEl = document.getElementById('income-display');
			const prestigeEl = document.getElementById('prestige-display');
			const favorEl = document.getElementById('favor-display');
			const heatEl = document.getElementById('heat-display');
			const heatBar = document.getElementById('heat-bar-fill');
			if (goldEl) goldEl.textContent = formatNum(gameState.gold);
			if (incomeEl) incomeEl.textContent = formatNum(getTotalIncome()) + '/s';
			if (prestigeEl) prestigeEl.textContent = gameState.prestige;
			if (favorEl) favorEl.textContent = gameState.tableFavor;
			if (heatEl) heatEl.textContent = gameState.heatLevel + '/10';
			if (heatBar) heatBar.style.width = (gameState.heatLevel / HEAT_MAX * 100) + '%';
			updateActiveBuffs();
		}

		// Income loop
		let lastTick = Date.now();
		setInterval(() => {
			const now = Date.now();
			const dt = (now - lastTick) / 1000;
			lastTick = now;
			const income = getTotalIncome();
			gameState.gold += income * dt;
			gameState.totalEarnings += income * dt;
			if (gameState.incomeMultiplierTimer > 0) {
				gameState.incomeMultiplierTimer -= dt;
				if (gameState.incomeMultiplierTimer <= 0) gameState.incomeMultiplier = 1;
			}
			if (gameState.incomePauseTimer > 0) {
				gameState.incomePauseTimer -= dt;
				if (gameState.incomePauseTimer <= 0) gameState.incomePaused = false;
			}
			if (gameState.eventTimer > 0) {
				gameState.eventTimer -= dt;
				const timerEl = document.getElementById('event-timer');
				const promptTimerEl = document.getElementById('event-prompt-timer');
				if (timerEl) timerEl.textContent = Math.ceil(gameState.eventTimer) + 's';
				if (promptTimerEl) promptTimerEl.textContent = Math.ceil(gameState.eventTimer) + 's';
				if (gameState.eventTimer <= 0) {
					declineEvent();
					hideEventPrompt();
				}
			}
			if (gameState.heatDecayTimer > 0 && gameState.heatLevel > 0) {
				gameState.heatDecayTimer -= dt;
				if (gameState.heatDecayTimer <= 0) {
					gameState.heatLevel = Math.max(0, gameState.heatLevel - 1);
					gameState.heatDecayTimer = 600;
				}
			}
			gameState.eventCooldown -= dt * 1000;
			if (gameState.eventCooldown <= 0 && !gameState.activeEvent) {
				maybeTriggerEvent();
			}
			updateCurrencyDisplay();
			updateHeatDisplay();
		}, 100);

		// Event system
		function maybeTriggerEvent() {
			if (gameState.tutorialCompleted === false) return;
			gameState.eventCooldown = EVENT_COOLDOWN;
			const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
			showEventPrompt(event);
			gameState.stats.totalEvents++;
		}

		function resolveEvent(effect) {
			const event = gameState.activeEvent;
			if (!event) return;
			let resultText = '';
			let resultType = 'good';
			if (event.id === 'contractOpen') {
				if (effect === 'accept') {
					gameState.incomeMultiplier = 2;
					gameState.incomeMultiplierTimer = 90;
					resultText = 'Accepted: 2x income for 90s';
					resultType = 'good';
				} else {
					resultText = 'Declined';
					resultType = '';
				}
			} else if (event.id === 'excommunicado') {
				if (effect === 'wait') {
					gameState.incomePaused = true;
					gameState.incomePauseTimer = 60;
					gameState.stats.excommunicadosSurvived++;
					resultText = 'Survived: income paused 60s';
					resultType = 'bad';
				} else if (effect === 'pay') {
					gameState.gold *= 0.9;
					resultText = 'Paid tribute: -10% gold';
					resultType = 'bad';
				}
			} else if (event.id === 'marker') {
				if (effect === 'complete') {
					gameState.incomeMultiplier = Math.max(gameState.incomeMultiplier, 1.05);
					resultText = 'Completed: +5% income';
					resultType = 'good';
				} else {
					resultText = 'Refused: marker debt accrues';
					resultType = 'bad';
				}
			} else if (event.id === 'sommelier') {
				if (effect === 'welcome') {
					const burst = getTotalIncome() * 60;
					gameState.gold += burst;
					resultText = 'Welcome: +' + formatNum(burst) + ' gold burst';
					resultType = 'good';
				} else {
					resultText = 'Turned away';
					resultType = '';
				}
			}
			gameState.eventLog.push({ name: event.name, result: resultText, resultType: resultType, time: Date.now() });
			if (gameState.eventLog.length > 50) gameState.eventLog.shift();
			closePanel('event-panel');
			gameState.activeEvent = null;
			gameState.eventTimer = 0;
			hideEventPrompt();
		}

		function declineEvent() {
			if (gameState.activeEvent) {
				gameState.heatLevel = Math.min(HEAT_MAX, gameState.heatLevel + 1);
				gameState.eventLog.push({ name: gameState.activeEvent.name, result: 'Ignored: +1 Heat', resultType: 'bad', time: Date.now() });
				if (gameState.eventLog.length > 50) gameState.eventLog.shift();
				gameState.activeEvent = null;
				gameState.eventTimer = 0;
				closePanel('event-panel');
				hideEventPrompt();
			}
		}

		// Prestige
		function openPrestigePanel() {
			const favor = Math.floor(Math.pow(gameState.totalEarnings / PRESTIGE_FAVOR_SCALE, 0.5));
			document.getElementById('prestige-current').textContent = gameState.prestige;
			document.getElementById('prestige-favor-est').textContent = favor;
			const content = document.getElementById('prestige-panel').querySelector('.game-panel-content');
			let previewHtml = content.querySelector('.prestige-preview');
			if (!previewHtml) {
				const div = document.createElement('div');
				div.className = 'prestige-preview';
				div.id = 'prestige-preview-calc';
				content.insertBefore(div, content.querySelector('.prestige-btn'));
			}
			const previewEl = content.querySelector('#prestige-preview-calc');
			const nextFavor = Math.floor(Math.pow((gameState.totalEarnings + getTotalIncome() * 3600) / PRESTIGE_FAVOR_SCALE, 0.5));
			previewEl.innerHTML = `
				<div class="prestige-preview-tier">Current Favor: <span class="prestige-preview-favor">${gameState.tableFavor}</span></div>
				<div class="prestige-preview-tier">Prestige Reward: <span class="prestige-preview-favor">+${favor}</span> Table Favor</div>
				<div class="prestige-preview-tier">In 1 hour: <span class="prestige-preview-next">+${nextFavor}</span> Table Favor</div>
				<div class="prestige-preview-tier" style="color:#555">Reputation kept: 50% (80% with Adjudicator max)</div>
			`;
			setActiveNav('prestige');
			document.getElementById('prestige-panel').classList.add('active');
		}

		function doPrestige() {
			const favor = Math.floor(Math.pow(gameState.totalEarnings / PRESTIGE_FAVOR_SCALE, 0.5));
			gameState.tableFavor += favor;
			gameState.prestige++;
			gameState.gold = 0;
			gameState.totalEarnings = 0;
			gameState.heatLevel = 0;
			gameState.heatDecayTimer = 600;
			gameState.incomeMultiplier = 1;
			gameState.incomePaused = false;
			BUILDINGS.forEach(b => {
				gameState.buildings[b.id] = { level: 0 };
			});
			Object.entries(gameState.staff).forEach(([sid, sd]) => {
				sd.prestigeSurvivedCount = (sd.prestigeSurvivedCount || 0) + 1;
				if (sd.prestigeSurvivedCount >= 3 && !sd.veteran) {
					sd.veteran = true;
					sd.veteranPerk = 'stat_boost';
					if (sd.stats) {
						Object.keys(sd.stats).forEach(k => {
							sd.stats[k] = Math.min(13, sd.stats[k] + 2);
						});
					}
					gameState.stats.veteranCount++;
					if (gameState.stats.veteranCount >= 3 && !gameState.achievements.threeVeterans) {
						gameState.achievements.threeVeterans = true;
						showToast('Achievement: Old Guard!', 'success');
					}
					showToast(sd.veteran ? sid + ' became a Veteran!' : '', 'success');
				}
			});
			if (!gameState.achievements.firstPrestige) {
				gameState.achievements.firstPrestige = true;
			}
			closePanel('prestige-panel');
			renderBuildings();
			updateCurrencyDisplay();
		}

		// Staff & Assassin panel
		function openStaffPanel() {
			const staffList = document.getElementById('staff-list');
			staffList.innerHTML = '';
			STAFF_TYPES.forEach(s => {
				const sd = gameState.staff[s.id];
				const level = sd ? sd.level : 0;
				const isMax = level >= s.maxLevel;
				const div = document.createElement('div');
				div.className = 'staff-card-enhanced' + (sd && sd.veteran ? ' veteran' : '');
				let statsHtml = '';
				if (sd && sd.stats) {
					statsHtml = `<div class="staff-card-stats">${renderStatBars(sd.stats)}</div>`;
					statsHtml += `<div class="trait-badges">${renderTraitBadges(sd.traits)}</div>`;
				}
				let assignHtml = '';
				if (level > 0 && STAFF_BUILDING_MATCH[s.id]) {
					const options = STAFF_BUILDING_MATCH[s.id].map(bid => {
						const b = BUILDINGS.find(x => x.id === bid);
						const sel = sd && sd.assignedTo === bid ? 'selected' : '';
						return `<option value="${bid}" ${sel}>${b ? b.name : bid}</option>`;
					}).join('');
					assignHtml = `<select class="staff-assign-dropdown" onchange="assignStaff('${s.id}', this.value)"><option value="">-- Assign --</option>${options}</select>`;
				}
				let abilityHtml = '';
				if (isMax) {
					abilityHtml = `<div style="color:#ffd700;font-size:10px;margin-top:4px">â˜… MAX: ${s.maxAbility}</div>`;
				}
				div.innerHTML = `
					<div class="staff-card-header">
						<span class="staff-card-name">${sd && sd.veteran ? 'â˜… ' : ''}${s.name}</span>
						<span class="staff-card-level">Lv.${level}/${s.maxLevel}</span>
					</div>
					<div class="staff-card-effect">${s.effect}</div>
					${abilityHtml}
					${statsHtml}
					${assignHtml}
					<button class="building-buy-btn" style="margin-top:6px;width:100%" onclick="startHirePreview('${s.id}')">${level > 0 ? 'Upgrade (' + formatNum(s.hireCost * Math.pow(2, level)) + ')' : 'Hire (' + formatNum(s.hireCost) + ')'}</button>
				`;
				staffList.appendChild(div);
			});
			const assassinList = document.getElementById('assassin-list');
			assassinList.innerHTML = '';
			if (gameState.assassins.length === 0) {
				assassinList.innerHTML = '<p style="color:#666;font-size:11px">No assassins hired. Visit the Assassin Network to hire.</p>';
			} else {
				gameState.assassins.forEach((a, i) => {
					const div = document.createElement('div');
					div.className = 'assassin-card';
					let statsHtml = '';
					if (a.stats) {
						statsHtml = `<div class="staff-card-stats">${renderStatBars(a.stats)}</div>`;
						statsHtml += `<div class="trait-badges">${renderTraitBadges(a.traits)}</div>`;
					}
					div.innerHTML = `
						<div class="assassin-name">${a.awakened ? 'â˜… ' : ''}${a.name} [${a.rank}]</div>
						<div class="assassin-stats">Lv.${a.level} | XP: ${Math.floor(a.xp)}/${Math.floor(a.xpNeeded)} | Loyalty: ${Math.floor(a.loyalty)}%</div>
						<div class="loyalty-bar"><div class="loyalty-bar-fill" style="width:${a.loyalty}%;background:${a.loyalty < 30 ? '#e74c3c' : '#4caf50'}"></div></div>
						${statsHtml}
					`;
					assassinList.appendChild(div);
				});
			}
			setActiveNav('staff');
			document.getElementById('staff-panel').classList.add('active');
		}

		function assignStaff(staffId, buildingId) {
			if (!gameState.staff[staffId]) return;
			gameState.staff[staffId].assignedTo = buildingId || null;
		}

		function hireStaff(staffId) {
			const s = STAFF_TYPES.find(x => x.id === staffId);
			if (!s) return;
			const sd = gameState.staff[staffId] || { level: 0, assignedTo: null };
			const cost = s.hireCost * Math.pow(2, sd.level);
			if (gameState.gold >= cost) {
				gameState.gold -= cost;
				sd.level++;
				gameState.staff[staffId] = sd;
				openStaffPanel();
				updateCurrencyDisplay();
			}
		}

		function hireAssassin() {
			if (gameState.gold < 100000 || gameState.assassins.length >= 3) return;
			const available = GLOBAL_ASSASSINS.filter(a => !gameState.assassins.find(ga => ga.id === a.id));
			if (available.length === 0) return;
			const assassin = available[0];
			gameState.gold -= assassin.hireCost;
			gameState.assassins.push({
				id: assassin.id,
				name: assassin.name,
				rank: assassin.rank,
				level: 1,
				xp: 0,
				xpNeeded: 100,
				loyalty: 100,
				assignedTo: null,
				ability: assassin.ability,
				stats: rollStats(),
				traits: rollTraits(),
				awakened: false,
				synergyTriggers: 0
			});
			openStaffPanel();
			updateCurrencyDisplay();
		}

		// Achievements
		function openAchievementsPanel() {
			const list = document.getElementById('achievements-list');
			list.innerHTML = '';
			ACHIEVEMENTS.forEach(a => {
				const unlocked = gameState.achievements[a.id];
				const div = document.createElement('div');
				div.className = 'achievement-row ' + (unlocked ? 'unlocked' : 'locked');
				div.innerHTML = `
					<div><span style="color:${unlocked ? '#ffd700' : '#666'}">${a.name}</span><br><span style="color:#555;font-size:10px">${a.desc}</span></div>
					<div style="color:#888;font-size:10px">${a.reward}</div>
				`;
				list.appendChild(div);
			});
			setActiveNav('awards');
			document.getElementById('achievements-panel').classList.add('active');
		}

		// Tutorial
		function startTutorial() {
			if (gameState.tutorialCompleted) return;
			gameState.tutorialStep = 0;
			showTutorialStep();
			document.getElementById('tutorial-panel').classList.add('active');
		}

		function showTutorialStep() {
			const text = TUTORIAL_STEPS[gameState.tutorialStep];
			document.getElementById('tutorial-text').textContent = text;
			const progress = document.getElementById('tutorial-progress');
			progress.innerHTML = '';
			TUTORIAL_STEPS.forEach((_, i) => {
				const dot = document.createElement('div');
				dot.className = 'tutorial-progress-dot' + (i <= gameState.tutorialStep ? ' done' : '');
				progress.appendChild(dot);
			});
		}

		function nextTutorialStep() {
			gameState.tutorialStep++;
			if (gameState.tutorialStep >= TUTORIAL_STEPS.length) {
				gameState.tutorialCompleted = true;
				closePanel('tutorial-panel');
			} else {
				showTutorialStep();
			}
		}

		// Panel helpers
		function setActiveNav(name) {
			let activeTab = null;
			document.querySelectorAll('.horizon-tab').forEach(b => {
				const isActive = b.dataset.nav === name;
				b.classList.toggle('active', isActive);
				if (isActive) activeTab = b;
			});
			if (activeTab) {
				activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
			}
		}

		function openPanel(name) {
			if (name === 'buildings') {
				setActiveNav('buildings');
			}
		}

		function closePanel(id) {
			document.getElementById(id).classList.remove('active');
			setActiveNav('buildings');
		}

		// Toast Notifications
		function showToast(msg, type) {
			const container = document.getElementById('toast-container');
			const toast = document.createElement('div');
			toast.className = 'toast' + (type ? ' ' + type : '');
			toast.textContent = msg;
			container.appendChild(toast);
			setTimeout(() => toast.remove(), 3000);
		}

		// Daily Contracts
		function openContractsPanel() {
			document.getElementById('streak-count').textContent = gameState.loginStreak.current;
			const bonus = gameState.loginStreak.current >= 7 ? '+20% income for 2h' : '+' + (gameState.loginStreak.current * 2) + '% income for 1h';
			document.getElementById('streak-bonus').textContent = 'Bonus: ' + bonus;
			const list = document.getElementById('contracts-list');
			list.innerHTML = '';
			if (gameState.dailyContracts.length === 0) {
				const shuffled = [...DAILY_CONTRACTS].sort(() => Math.random() - 0.5).slice(0, 3);
				gameState.dailyContracts = shuffled.map(c => ({ ...c, progress: 0, complete: false }));
			}
			gameState.dailyContracts.forEach(c => {
				const div = document.createElement('div');
				div.className = 'contract-card' + (c.complete ? ' complete' : '');
				div.innerHTML = `
					<div class="contract-name">${c.name}</div>
					<div class="contract-desc">${c.desc}</div>
					<div class="contract-reward">Reward: ${c.reward}</div>
					<div class="contract-progress"><div class="contract-progress-fill ${c.complete ? 'done' : ''}" style="width:${c.complete ? 100 : (c.progress || 0)}%"></div></div>
				`;
				list.appendChild(div);
			});
			setActiveNav('contracts');
			document.getElementById('contracts-panel').classList.add('active');
		}

		// Manager's Objectives
		function openObjectivesPanel() {
			const list = document.getElementById('objectives-list');
			list.innerHTML = '';
			const objectives = [
				{ name: 'Reach Prestige 15', done: gameState.prestige >= 15, status: gameState.prestige + '/15' },
				{ name: 'Hire 5 staff members', done: Object.keys(gameState.staff).length >= 5, status: Object.keys(gameState.staff).length + '/5' },
				{ name: 'Earn 10M total', done: gameState.totalEarnings >= 1e7, status: formatNum(gameState.totalEarnings) + '/10M' },
				{ name: 'Hire 2 assassins', done: gameState.assassins.length >= 2, status: gameState.assassins.length + '/2' },
				{ name: 'Survive 10 excommunicados', done: gameState.stats.excommunicadosSurvived >= 10, status: gameState.stats.excommunicadosSurvived + '/10' },
				{ name: 'Unlock Rome (Prestige 3)', done: gameState.prestige >= 3, status: gameState.prestige >= 3 ? 'âœ“' : 'P.3 required' }
			];
			objectives.forEach(o => {
				const div = document.createElement('div');
				div.className = 'objective-row' + (o.done ? ' complete' : '');
				div.innerHTML = `
					<div><span style="color:${o.done ? '#4caf50' : '#ccc'}">${o.done ? 'âœ“' : 'â—‹'} ${o.name}</span></div>
					<span class="objective-status ${o.done ? 'done' : ''}">${o.status}</span>
				`;
				list.appendChild(div);
			});
			setActiveNav('objectives');
			document.getElementById('objectives-panel').classList.add('active');
		}

		// Assassin Network
		function openAssassinNetwork() {
			const list = document.getElementById('assassin-network-list');
			list.innerHTML = '';
			if (gameState.assassins.length === 0) {
				list.innerHTML = '<p style="color:#666;font-size:11px;margin-bottom:10px">No assassins hired.</p>';
				GLOBAL_ASSASSINS.forEach(a => {
					const div = document.createElement('div');
					div.className = 'assassin-network-row';
					div.innerHTML = `
						<div class="assassin-network-header">
							<span class="assassin-network-name">${a.name} [${a.rank}]</span>
							<span style="color:#888;font-size:10px">${formatNum(a.hireCost)} gold</span>
						</div>
						<div style="color:#666;font-size:10px;margin-top:4px">${a.ability}</div>
						<button class="building-buy-btn" style="margin-top:6px;width:100%" onclick="hireAssassin(); openAssassinNetwork()">Hire</button>
					`;
					list.appendChild(div);
				});
			} else {
				gameState.assassins.forEach((a, i) => {
					const div = document.createElement('div');
					div.className = 'assassin-network-row' + (a.awakened ? ' awakened' : '');
					let statsHtml = a.stats ? `<div class="staff-card-stats">${renderStatBars(a.stats)}</div><div class="trait-badges">${renderTraitBadges(a.traits)}</div>` : '';
					div.innerHTML = `
						<div class="assassin-network-header">
							<span class="assassin-network-name ${a.awakened ? 'awakened' : ''}">${a.awakened ? 'â˜… ' : ''}${a.name} [${a.rank}]</span>
							<span style="color:#888;font-size:10px">Lv.${a.level} | Loyalty: ${Math.floor(a.loyalty)}%</span>
						</div>
						<div style="color:#666;font-size:10px;margin-top:4px">${a.ability || ''}</div>
						<div class="loyalty-bar"><div class="loyalty-bar-fill" style="width:${a.loyalty}%;background:${a.loyalty < 30 ? '#e74c3c' : '#4caf50'}"></div></div>
						${statsHtml}
					`;
					list.appendChild(div);
				});
			}
			setActiveNav('network');
			document.getElementById('assassin-network-panel').classList.add('active');
		}

		function recallAllAssassins() {
			gameState.assassins.forEach(a => { a.assignedTo = null; });
			showToast('All assassins recalled to HQ', 'success');
		}

		// Event History Log
		function openEventLogPanel() {
			const list = document.getElementById('event-log-list');
			list.innerHTML = '';
			if (gameState.eventLog.length === 0) {
				list.innerHTML = '<p style="color:#555;font-size:11px;text-align:center;padding:20px">No events recorded yet.</p>';
			} else {
				gameState.eventLog.slice(-20).reverse().forEach(entry => {
					const div = document.createElement('div');
					div.className = 'event-log-row';
					div.innerHTML = `
						<span class="event-log-name">${entry.name}</span>
						<span class="event-log-result ${entry.resultType || ''}">${entry.result}</span>
					`;
					list.appendChild(div);
				});
			}
			setActiveNav('eventLog');
			document.getElementById('event-log-panel').classList.add('active');
		}

		// Enhanced Heat Meter Update
		function updateHeatDisplay() {
			const heatBar = document.getElementById('heat-bar-fill');
			const heatWarning = document.getElementById('heat-warning');
			const heatCountdown = document.getElementById('heat-countdown');
			if (heatBar) {
				heatBar.className = 'heat-bar-fill';
				if (gameState.heatLevel >= 8) heatBar.classList.add('heat-critical');
				else if (gameState.heatLevel >= 6) heatBar.classList.add('heat-high');
				else if (gameState.heatLevel >= 4) heatBar.classList.add('heat-mid');
				else if (gameState.heatLevel >= 1) heatBar.classList.add('heat-low');
				heatBar.style.width = (gameState.heatLevel / HEAT_MAX * 100) + '%';
			}
			if (heatWarning) {
				heatWarning.style.display = gameState.heatLevel >= 6 ? 'block' : 'none';
			}
			if (heatCountdown) {
				heatCountdown.textContent = 'Next decay: ' + formatTime(gameState.heatDecayTimer);
			}
		}

		// Theme switching
		const THEME_NAMES = {
			newYork: 'NEW YORK',
			rome: 'ROME',
			casablanca: 'CASABLANCA',
			osaka: 'OSAKA',
			paris: 'PARIS',
			berlin: 'BERLIN',
			dubai: 'DUBAI'
		};

		const THEME_UNLOCKS = {
			newYork: 0,
			rome: 3,
			casablanca: 5,
			osaka: 12,
			paris: 22,
			berlin: 35,
			dubai: 55
		};

		let currentTheme = 'newYork';
		const themeStates = {
			newYork: { prestige: 12, currency: 'Gold', income: '1.2M/s', unlocked: true },
			rome: { prestige: 3, currency: 'Lira', income: '340K/s', unlocked: true },
			casablanca: { prestige: 5, currency: 'Dirham', income: '180K/s', unlocked: true },
			osaka: { prestige: 12, currency: 'Yen', income: 'Locked', unlocked: false },
			paris: { prestige: 22, currency: 'Franc', income: 'Locked', unlocked: false },
			berlin: { prestige: 35, currency: 'Mark', income: 'Locked', unlocked: false },
			dubai: { prestige: 55, currency: 'Riyal', income: 'Locked', unlocked: false }
		};

		function switchTheme(themeKey) {
			if (!themeStates[themeKey].unlocked && gameState.prestige < THEME_UNLOCKS[themeKey]) {
				showToast(`Unlock ${THEME_NAMES[themeKey]} at Prestige ${THEME_UNLOCKS[themeKey]}`, 'warning');
				return;
			}
			currentTheme = themeKey;
			updateThemeTabs();
			showToast(`Switched to ${THEME_NAMES[themeKey]}`, 'success');
			renderBuildings();
			updateCurrencyDisplay();
		}

		function updateThemeTabs() {
			document.querySelectorAll('.theme-tab').forEach(tab => {
				const key = tab.dataset.theme;
				const unlocked = gameState.prestige >= THEME_UNLOCKS[key];
				tab.classList.toggle('active', key === currentTheme);
				tab.disabled = !unlocked;
			});
		}

		// Boost tokens
		function activateBoostToken(type) {
			if (gameState.boostTokens.length === 0) {
				showToast('No boost tokens available', 'warning');
				return;
			}
			const token = gameState.boostTokens.pop();
			if (type === 'income') {
				gameState.incomeMultiplier = Math.max(gameState.incomeMultiplier, 2);
				gameState.incomeMultiplierTimer = Math.max(gameState.incomeMultiplierTimer, 60);
				showToast('Boost: +100% income for 60s', 'success');
			} else if (type === 'staffxp') {
				showToast('Boost: +100% Staff XP for 60s', 'success');
			} else if (type === 'event') {
				showToast('Boost: +50% Event Rewards for 60s', 'success');
			}
			updateActiveBuffs();
			updateCurrencyDisplay();
		}

		function updateActiveBuffs() {
			const bar = document.getElementById('active-buffs-bar');
			if (!bar) return;
			let buffs = [];
			if (gameState.incomeMultiplier > 1 && gameState.incomeMultiplierTimer > 0) {
				buffs.push(`[+${Math.round((gameState.incomeMultiplier - 1) * 100)}% Income]`);
			}
			bar.innerHTML = buffs.length ? buffs.map(b => `<span class="active-buff">${b}</span>`).join('') : '<span style="color:#555;font-size:10px">No active buffs</span>';
		}

		// Event prompt bar
		let currentPromptEvent = null;
		function showEventPrompt(event) {
			const bar = document.getElementById('event-prompt-bar');
			const text = document.getElementById('event-prompt-text');
			currentPromptEvent = event;
			gameState.activeEvent = event;
			gameState.eventTimer = 30;
			if (text) text.textContent = event.name.toUpperCase() + ': ' + event.desc;
			bar.style.display = 'flex';
		}

		function hideEventPrompt() {
			document.getElementById('event-prompt-bar').style.display = 'none';
			currentPromptEvent = null;
		}

		function promptAcceptEvent() {
			if (currentPromptEvent) {
				showEventModal(currentPromptEvent);
				hideEventPrompt();
			}
		}

		function promptDeclineEvent() {
			if (currentPromptEvent) {
				declineEvent();
				hideEventPrompt();
			}
		}

		function showEventModal(event) {
			gameState.activeEvent = event;
			gameState.eventTimer = 30;
			document.getElementById('event-title').textContent = event.name;
			document.getElementById('event-desc').textContent = event.desc;
			const choicesEl = document.getElementById('event-choices');
			choicesEl.innerHTML = '';
			event.choices.forEach(c => {
				const btn = document.createElement('button');
				btn.className = 'event-choice-btn';
				btn.textContent = c.text;
				btn.onclick = () => resolveEvent(c.effect);
				choicesEl.appendChild(btn);
			});
			document.getElementById('event-panel').classList.add('active');
			gameState.stats.totalEvents++;
		}

		// High Table Skill Tree
		const SKILL_TREE = [
			{ branch: 'Commerce', nodes: [
				{ id: 'income1', name: 'Income I', cost: 1, effect: '+5% income', max: 1 },
				{ id: 'income2', name: 'Income II', cost: 3, effect: '+5% income', max: 1 },
				{ id: 'income3', name: 'Income III', cost: 8, effect: '+5% income', max: 1 },
				{ id: 'income4', name: 'Income IV', cost: 15, effect: '+5% income', max: 1 },
				{ id: 'income5', name: 'Income V', cost: 25, effect: '+5% income', max: 1 }
			]},
			{ branch: 'Personnel', nodes: [
				{ id: 'staff1', name: 'Staff I', cost: 1, effect: '+10% staff XP', max: 1 },
				{ id: 'staff2', name: 'Staff II', cost: 4, effect: '+10% staff XP', max: 1 },
				{ id: 'staff3', name: 'Staff III', cost: 10, effect: '+10% staff XP', max: 1 },
				{ id: 'mastery', name: 'Mastery', cost: 20, effect: 'Building mastery bonus +50%', max: 1 },
				{ id: 'autoAssign', name: 'Auto-Assign', cost: 35, effect: 'Auto-assign staff at prestige', max: 1 }
			]},
			{ branch: 'Shadow', nodes: [
				{ id: 'network1', name: 'Network I', cost: 2, effect: '+10% assassin income', max: 1 },
				{ id: 'network2', name: 'Network II', cost: 6, effect: '+10% assassin income', max: 1 },
				{ id: 'network3', name: 'Network III', cost: 14, effect: '+10% assassin income', max: 1 },
				{ id: 'assassinPlus', name: 'Assassin+', cost: 24, effect: '+1 max assassin slot', max: 1 },
				{ id: 'noDefect', name: 'No Defect', cost: 40, effect: 'Assassin loyalty decay halved', max: 1 }
			]},
			{ branch: 'Diplomacy', nodes: [
				{ id: 'forgive1', name: 'Forgive I', cost: 2, effect: '-1 Heat on prestige', max: 1 },
				{ id: 'forgive2', name: 'Forgive II', cost: 7, effect: '-2 Heat on prestige', max: 1 },
				{ id: 'clearAll', name: 'Clear All', cost: 18, effect: 'Clear all heat on prestige', max: 1 }
			]},
			{ branch: 'Ascension', nodes: [
				{ id: 'deeper1', name: 'Deeper I', cost: 3, effect: '+10% prestige favor', max: 1 },
				{ id: 'deeper2', name: 'Deeper II', cost: 9, effect: '+10% prestige favor', max: 1 },
				{ id: 'autoPrestige', name: 'Auto-Prestige', cost: 30, effect: 'Auto-prestige when favor gain threshold met', max: 1 }
			]}
		];

		let selectedSkillNode = null;
		gameState.skillTree = gameState.skillTree || {};

		function openSkillTreePanel() {
			document.getElementById('skill-tree-favor').textContent = gameState.tableFavor;
			renderSkillTree();
			setActiveNav('skillTree');
			document.getElementById('skill-tree-panel').classList.add('active');
		}

		function renderSkillTree() {
			const container = document.getElementById('skill-tree-branches');
			container.innerHTML = '';
			SKILL_TREE.forEach(branch => {
				const div = document.createElement('div');
				div.className = 'skill-tree-branch';
				div.innerHTML = `<div class="skill-tree-branch-title">${branch.branch}</div>`;
				branch.nodes.forEach((node, i) => {
					const level = gameState.skillTree[node.id] || 0;
					const unlocked = i === 0 || (gameState.skillTree[branch.nodes[i - 1].id] || 0) > 0;
					const maxed = level >= node.max;
					const nodeEl = document.createElement('div');
					nodeEl.className = 'skill-tree-node' + (maxed ? ' maxed' : level > 0 ? ' unlocked' : unlocked ? ' unlocked' : ' locked');
					nodeEl.innerHTML = `<span>${node.name}</span><span>${level}/${node.max}</span>`;
					nodeEl.onclick = () => selectSkillNode(node, level, unlocked, maxed);
					div.appendChild(nodeEl);
				});
				container.appendChild(div);
			});
		}

		function selectSkillNode(node, level, unlocked, maxed) {
			selectedSkillNode = node;
			const nameEl = document.getElementById('skill-tree-detail-name');
			const descEl = document.getElementById('skill-tree-detail-desc');
			const btn = document.getElementById('skill-tree-unlock-btn');
			nameEl.textContent = node.name + ' (' + level + '/' + node.max + ')';
			descEl.innerHTML = `Cost: ${node.cost} Table Favor<br>Effect: ${node.effect}`;
			btn.disabled = maxed || !unlocked || gameState.tableFavor < node.cost;
			btn.textContent = maxed ? 'MAXED' : !unlocked ? 'LOCKED' : 'UNLOCK';
		}

		function unlockSkillNode() {
			if (!selectedSkillNode) return;
			const node = selectedSkillNode;
			const level = gameState.skillTree[node.id] || 0;
			if (level >= node.max || gameState.tableFavor < node.cost) return;
			gameState.tableFavor -= node.cost;
			gameState.skillTree[node.id] = level + 1;
			showToast(`Unlocked ${node.name}`, 'success');
			renderSkillTree();
			selectSkillNode(node, level + 1, true, level + 1 >= node.max);
			updateCurrencyDisplay();
		}

		// Royal Hotel
		const ROYAL_BUILDINGS = [
			{ id: 'royalSuite', name: 'Royal Suite', baseRate: 100000, baseCost: 1000000, effect: '+1% global income per level' },
			{ id: 'throneRoom', name: 'Throne Room', baseRate: 500000, baseCost: 5000000, effect: '+1% Table Favor per level' },
			{ id: 'diplomaticWing', name: 'Diplomatic Wing', baseRate: 250000, baseCost: 2500000, effect: '+5% trade rate per level' },
			{ id: 'imperialVault', name: 'Imperial Vault', baseRate: 1000000, baseCost: 10000000, effect: '+1% Royal Marks per level' }
		];

		gameState.royalMarks = gameState.royalMarks || 0;
		gameState.royalBuildings = gameState.royalBuildings || {};
		ROYAL_BUILDINGS.forEach(b => {
			if (!gameState.royalBuildings[b.id]) gameState.royalBuildings[b.id] = { level: 0 };
		});
		gameState.royalDecrees = gameState.royalDecrees || [
			{ id: 'taxHoliday', name: 'Tax Holiday', desc: 'No trade fees for 1 hour', active: false },
			{ id: 'royalPardon', name: 'Royal Pardon', desc: 'Reduce heat to 0', active: false },
			{ id: 'mercantile', name: 'Mercantile Edict', desc: '+50% exchange rate for 1 hour', active: false }
		];

		function openRoyalHotelPanel() {
			document.getElementById('royal-marks-display').textContent = formatNum(gameState.royalMarks);
			renderRoyalBuildings();
			renderRoyalDecrees();
			setActiveNav('royal');
			document.getElementById('royal-hotel-panel').classList.add('active');
		}

		function renderRoyalBuildings() {
			const list = document.getElementById('royal-buildings-list');
			list.innerHTML = '';
			ROYAL_BUILDINGS.forEach(b => {
				const bd = gameState.royalBuildings[b.id];
				const cost = b.baseCost * Math.pow(1.2, bd.level);
				const affordable = gameState.royalMarks >= cost;
				const div = document.createElement('div');
				div.className = 'royal-building-item';
				div.innerHTML = `
					<div class="royal-building-name">${b.name} Lv.${bd.level}</div>
					<div class="royal-building-level">${formatNum(b.baseRate * Math.pow(1.1, bd.level))}/s</div>
					<div class="royal-building-effect">${b.effect}</div>
					<button class="building-buy-btn ${affordable ? '' : 'disabled'}" style="margin-top:6px;width:100%" onclick="buyRoyalBuilding('${b.id}')">Buy (${formatNum(cost)} RM)</button>
				`;
				list.appendChild(div);
			});
		}

		function buyRoyalBuilding(buildingId) {
			const b = ROYAL_BUILDINGS.find(x => x.id === buildingId);
			const bd = gameState.royalBuildings[b.id];
			const cost = b.baseCost * Math.pow(1.2, bd.level);
			if (gameState.royalMarks >= cost) {
				gameState.royalMarks -= cost;
				bd.level++;
				renderRoyalBuildings();
				updateCurrencyDisplay();
				showToast(`${b.name} upgraded to Lv.${bd.level}`, 'success');
			}
		}

		function renderRoyalDecrees() {
			const list = document.getElementById('royal-decree-list');
			list.innerHTML = '';
			gameState.royalDecrees.forEach(d => {
				const div = document.createElement('div');
				div.className = 'royal-decree-item' + (d.active ? ' active' : '');
				div.innerHTML = `
					<div style="color:${d.active ? '#1e88e5' : '#ccc'}">${d.name}</div>
					<div style="color:#666;font-size:10px">${d.desc}</div>
					<button class="building-buy-btn" style="margin-top:4px;width:100%" onclick="activateRoyalDecree('${d.id}')">${d.active ? 'Active' : 'Activate'}</button>
				`;
				list.appendChild(div);
			});
		}

		function activateRoyalDecree(decreeId) {
			const decree = gameState.royalDecrees.find(d => d.id === decreeId);
			if (!decree) return;
			gameState.royalDecrees.forEach(d => d.active = false);
			decree.active = true;
			renderRoyalDecrees();
			showToast(`Royal Decree activated: ${decree.name}`, 'success');
		}

		// Currency Exchange
		const EXCHANGE_RATES = {
			newYork: { rome: 12.5, casablanca: 8.3, newYork: 1 },
			rome: { newYork: 0.08, casablanca: 0.66, rome: 1 },
			casablanca: { newYork: 0.12, rome: 1.5, casablanca: 1 }
		};

		function openCurrencyExchangePanel() {
			updateExchangeRate();
			setActiveNav('exchange');
			document.getElementById('currency-exchange-panel').classList.add('active');
		}

		function updateExchangeRate() {
			const from = document.getElementById('exchange-from').value;
			const to = document.getElementById('exchange-to').value;
			const amount = parseFloat(document.getElementById('exchange-amount').value) || 0;
			const rate = EXCHANGE_RATES[from][to] || 1;
			const fee = gameState.assassins.find(a => a.id === 'theBishop') ? 0.02 : 0.05;
			const result = amount * rate * (1 - fee);
			document.getElementById('exchange-rate').textContent = `Rate: 1 ${THEME_NAMES[from]} = ${rate.toFixed(2)} ${THEME_NAMES[to]}`;
			document.getElementById('exchange-result').textContent = `= ${formatNum(result)} ${THEME_NAMES[to]}`;
			document.getElementById('exchange-fee').textContent = `Fee: ${Math.round(fee * 100)}%${fee === 0.02 ? ' (The Bishop active)' : ' (unlock The Bishop to reduce to 2%)'}`;
		}

		function executeTrade() {
			const from = document.getElementById('exchange-from').value;
			const to = document.getElementById('exchange-to').value;
			const amount = parseFloat(document.getElementById('exchange-amount').value) || 0;
			if (amount <= 0) return;
			showToast(`Trade executed: ${formatNum(amount)} ${THEME_NAMES[from]} â†’ ${THEME_NAMES[to]}`, 'success');
		}

		// Conquest Roadmap
		function openConquestRoadmapPanel() {
			renderConquestRoadmap();
			setActiveNav('roadmap');
			document.getElementById('conquest-roadmap-panel').classList.add('active');
		}

		function renderConquestRoadmap() {
			const list = document.getElementById('roadmap-list');
			const progress = document.getElementById('roadmap-progress');
			list.innerHTML = '';
			let conquered = 0;
			locations.forEach(loc => {
				const isConquered = loc.state === 'conquered';
				const isActive = loc.state === 'active' || loc.state === 'hq';
				const isLocked = loc.state === 'locked';
				if (isConquered) conquered++;
				const div = document.createElement('div');
				div.className = 'roadmap-row' + (isConquered ? ' conquered' : isActive ? ' active' : ' locked');
				div.innerHTML = `
					<span>${isConquered ? 'âš”' : isActive ? 'â—„' : 'â–’'} ${loc.name}</span>
					<span class="roadmap-status">${isConquered ? 'Conquered' : isActive ? 'Active' : 'Locked (P.' + loc.prestige + ')'}</span>
				`;
				list.appendChild(div);
			});
			progress.textContent = `Conquered: ${conquered}/7`;
		}

		// Statistics Dashboard
		const MANAGERS_LEDGER = [
			{ id: 'ledger1', name: 'First Blood', desc: 'Prestige for the first time', condition: () => gameState.prestige >= 1 },
			{ id: 'ledger2', name: 'The Continental', desc: 'Unlock all 7 themes', condition: () => gameState.prestige >= 55 },
			{ id: 'ledger3', name: 'Old Guard', desc: 'Earn 3 Veteran staff', condition: () => gameState.stats.veteranCount >= 3 },
			{ id: 'ledger4', name: 'High Table', desc: 'Reach 100 Table Favor', condition: () => gameState.tableFavor >= 100 },
			{ id: 'ledger5', name: 'Shadow King', desc: 'Hire an SS-rank assassin', condition: () => gameState.assassins.some(a => a.rank === 'SS') }
		];

		function openStatisticsDashboardPanel() {
			renderStatisticsDashboard();
			setActiveNav('ledger');
			document.getElementById('statistics-dashboard-panel').classList.add('active');
		}

		function renderStatisticsDashboard() {
			const grid = document.getElementById('stats-grid');
			grid.innerHTML = '';
			const stats = [
				{ label: 'Total Earnings', value: formatNum(gameState.totalEarnings) },
				{ label: 'Prestige', value: gameState.prestige },
				{ label: 'Table Favor', value: gameState.tableFavor },
				{ label: 'Events', value: gameState.stats.totalEvents },
				{ label: 'Veterans', value: gameState.stats.veteranCount },
				{ label: 'Assassins', value: gameState.assassins.length }
			];
			stats.forEach(s => {
				const div = document.createElement('div');
				div.className = 'stats-card';
				div.innerHTML = `<div class="stats-value">${s.value}</div><div class="stats-label">${s.label}</div>`;
				grid.appendChild(div);
			});

			const ledger = document.getElementById('ledger-entries-list');
			ledger.innerHTML = '';
			MANAGERS_LEDGER.forEach(entry => {
				const unlocked = entry.condition();
				const div = document.createElement('div');
				div.className = 'ledger-entry' + (unlocked ? ' unlocked' : ' locked');
				div.innerHTML = `<span style="color:${unlocked ? '#ffd700' : '#555'}">${unlocked ? 'âœ“' : 'â—‹'} ${entry.name}</span><br><span style="color:#666;font-size:10px">${entry.desc}</span>`;
				ledger.appendChild(div);
			});
		}

		// Theme Comparison
		function openThemeComparisonPanel() {
			renderThemeComparison();
			setActiveNav('compare');
			document.getElementById('theme-comparison-panel').classList.add('active');
		}

		function renderThemeComparison() {
			const table = document.getElementById('theme-comparison-table');
			table.innerHTML = '';
			const header = document.createElement('div');
			header.className = 'comparison-row comparison-header';
			header.innerHTML = '<div>Metric</div><div>New York</div><div>Rome</div><div>Casablanca</div>';
			table.appendChild(header);
			const rows = [
				{ label: 'Prestige', values: [12, 3, 5] },
				{ label: 'Income', values: ['1.2M/s', '340K/s', '180K/s'] },
				{ label: 'Currency', values: ['Gold', 'Lira', 'Dirham'] },
				{ label: 'Status', values: ['HQ', 'Active', 'Active'] }
			];
			rows.forEach(row => {
				const div = document.createElement('div');
				div.className = 'comparison-row';
				div.innerHTML = `<div class="comparison-cell">${row.label}</div>${row.values.map(v => `<div class="comparison-cell">${v}</div>`).join('')}`;
				table.appendChild(div);
			});
		}

		// Bulk Staff Management
		function openBulkStaffPanel() {
			const list = document.getElementById('bulk-staff-list');
			list.innerHTML = '';
			STAFF_TYPES.forEach(s => {
				const sd = gameState.staff[s.id] || { level: 0 };
				const div = document.createElement('div');
				div.className = 'staff-card-enhanced';
				div.innerHTML = `
					<div class="staff-card-header">
						<span class="staff-card-name">${s.name}</span>
						<span class="staff-card-level">Lv.${sd.level}/${s.maxLevel}</span>
					</div>
					<div class="staff-card-effect">${s.effect}</div>
					<select class="staff-assign-dropdown" onchange="assignStaff('${s.id}', this.value)">
						<option value="">Unassigned</option>
						${STAFF_BUILDING_MATCH[s.id] ? STAFF_BUILDING_MATCH[s.id].map(bid => {
							const b = BUILDINGS.find(x => x.id === bid);
							return `<option value="${bid}" ${sd.assignedTo === bid ? 'selected' : ''}>${b ? b.name : bid}</option>`;
						}).join('') : ''}
					</select>
				`;
				list.appendChild(div);
			});
			setActiveNav('bulk');
			document.getElementById('bulk-staff-panel').classList.add('active');
		}

		function unassignAllStaff() {
			Object.values(gameState.staff).forEach(sd => sd.assignedTo = null);
			showToast('All staff unassigned', 'success');
			openBulkStaffPanel();
		}

		function upgradeAllStaff() {
			STAFF_TYPES.forEach(s => {
				const sd = gameState.staff[s.id] || { level: 0 };
				const cost = s.hireCost * Math.pow(2, sd.level);
				if (gameState.gold >= cost && sd.level < s.maxLevel) {
					gameState.gold -= cost;
					if (!gameState.staff[s.id]) gameState.staff[s.id] = sd;
					gameState.staff[s.id].level = sd.level + 1;
					if (!gameState.staff[s.id].stats) gameState.staff[s.id].stats = rollStats();
					if (!gameState.staff[s.id].traits) gameState.staff[s.id].traits = rollTraits();
				}
			});
			showToast('All affordable staff upgraded', 'success');
			updateCurrencyDisplay();
			openBulkStaffPanel();
		}

		function assignAllOptimal() {
			STAFF_TYPES.forEach(s => {
				const sd = gameState.staff[s.id];
				if (sd && sd.level > 0 && STAFF_BUILDING_MATCH[s.id]) {
					// Assign to first matching building
					sd.assignedTo = STAFF_BUILDING_MATCH[s.id][0];
				}
			});
			showToast('All staff assigned to optimal buildings', 'success');
			openBulkStaffPanel();
		}

		// Error/Loading UI
		function showErrorModal(title, message, actions) {
			document.getElementById('error-modal-title').textContent = title;
			document.getElementById('error-modal-message').textContent = message;
			const actionsDiv = document.getElementById('error-modal-actions');
			actionsDiv.innerHTML = actions || '<button class="game-panel-close" onclick="closePanel(\'error-modal-panel\')">Close</button>';
			document.getElementById('error-modal-panel').classList.add('active');
		}

		function showLoading(status) {
			const overlay = document.getElementById('loading-overlay');
			const statusEl = document.getElementById('loading-status');
			const bar = document.getElementById('loading-bar-fill');
			overlay.classList.add('active');
			if (statusEl) statusEl.textContent = status || 'Loading...';
			if (bar) bar.style.width = '0%';
		}

		function hideLoading() {
			document.getElementById('loading-overlay').classList.remove('active');
		}

		function setLoadingProgress(percent, status) {
			const bar = document.getElementById('loading-bar-fill');
			const statusEl = document.getElementById('loading-status');
			if (bar) bar.style.width = percent + '%';
			if (statusEl && status) statusEl.textContent = status;
		}

		// Save/Load
		function saveGame() {
			gameState.lastSave = Date.now();
			localStorage.setItem('continentalIdle', JSON.stringify(gameState));
		}

		function loadGame() {
			const saved = localStorage.getItem('continentalIdle');
			if (saved) {
				try {
					const loaded = JSON.parse(saved);
					Object.assign(gameState, loaded);
					return true;
				} catch (e) {
					return false;
				}
			}
			return false;
		}

		function exportSave() {
			const data = btoa(JSON.stringify(gameState));
			const textarea = document.createElement('textarea');
			textarea.value = data;
			textarea.style.width = '100%';
			textarea.style.height = '100px';
			textarea.style.background = '#1a1a1a';
			textarea.style.color = '#ccc';
			textarea.style.border = '1px solid #333';
			textarea.readOnly = true;
			const w = window.open('', '_blank', 'width=400,height=300');
			w.document.body.style.background = '#0d0d0d';
			w.document.body.style.fontFamily = 'Courier New, monospace';
			w.document.body.appendChild(textarea);
		}

		function importSave() {
			const input = prompt('Paste save data:');
			if (input) {
				try {
					const data = JSON.parse(atob(input));
					Object.assign(gameState, data);
					renderBuildings();
					updateCurrencyDisplay();
				} catch (e) {
					alert('Invalid save data');
				}
			}
		}

		// Offline progress
		function calculateOfflineProgress() {
			const saved = localStorage.getItem('continentalIdle');
			if (!saved) return;
			const data = JSON.parse(saved);
			const lastSave = data.lastSave || Date.now();
			const awaySeconds = Math.min((Date.now() - lastSave) / 1000, 4 * 3600);
			if (awaySeconds < 60) return;
			const income = getTotalIncome();
			const earnings = income * awaySeconds * 0.5;
			if (earnings > 0) {
				gameState.gold += earnings;
				document.getElementById('welcome-back-duration').textContent = 'You were away for ' + Math.floor(awaySeconds / 60) + ' minutes.';
				document.getElementById('welcome-back-earnings').textContent = 'Earnings: ' + formatNum(earnings) + ' gold';
				document.getElementById('welcome-back-events').textContent = 'Events do not trigger during offline. Heat decayed by ' + Math.floor(awaySeconds / 3600) + ' levels.';
				document.getElementById('welcome-back-panel').classList.add('active');
			}
		}

		// Autosave
		setInterval(() => { saveGame(); }, 30000);

		// Init
		function initGame() {
			showLoading('Initializing Continental OS...');
			let progress = 0;
			const loadInterval = setInterval(() => {
				progress += 25;
				setLoadingProgress(progress, 'Loading module ' + (progress / 25) + '/4');
				if (progress >= 100) {
					clearInterval(loadInterval);
					hideLoading();
					const loaded = loadGame();
					renderBuildings();
					updateCurrencyDisplay();
					updateThemeTabs();
					if (!loaded && !gameState.tutorialCompleted) {
						startTutorial();
					} else if (loaded) {
						calculateOfflineProgress();
					}
				}
			}, 100);
		}

		// Handle window resize
		window.addEventListener('resize', () => {
			const newWidth = svg.node().getBoundingClientRect().width;
			const newHeight = svg.node().getBoundingClientRect().height;
			projection.translate([newWidth / 2, newHeight / 2]);
		});

		initGame();