export interface BranchNode {
	id: string
	name: string
	lat: number
	lon: number
	accentColor: string
	city: string
	continent: string
}

export const BRANCHES: BranchNode[] = [
	{ id: 'bangkok', name: 'Bangkok', lat: 13.7563, lon: 100.5018, accentColor: '#ffd700', city: 'Bangkok', continent: 'Asia' },
	{ id: 'newyork', name: 'New York', lat: 40.7128, lon: -74.0060, accentColor: '#ff4444', city: 'New York', continent: 'North America' },
	{ id: 'london', name: 'London', lat: 51.5074, lon: -0.1278, accentColor: '#4488ff', city: 'London', continent: 'Europe' },
	{ id: 'paris', name: 'Paris', lat: 48.8566, lon: 2.3522, accentColor: '#88ccff', city: 'Paris', continent: 'Europe' },
	{ id: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503, accentColor: '#ff66aa', city: 'Tokyo', continent: 'Asia' },
	{ id: 'berlin', name: 'Berlin', lat: 52.5200, lon: 13.4050, accentColor: '#aaaaaa', city: 'Berlin', continent: 'Europe' },
	{ id: 'sydney', name: 'Sydney', lat: -33.8688, lon: 151.2093, accentColor: '#44ddaa', city: 'Sydney', continent: 'Oceania' },
	{ id: 'saopaulo', name: 'Sao Paulo', lat: -23.5505, lon: -46.6333, accentColor: '#66ff66', city: 'Sao Paulo', continent: 'South America' },
	{ id: 'cairo', name: 'Cairo', lat: 30.0444, lon: 31.2357, accentColor: '#ddaa44', city: 'Cairo', continent: 'Africa' },
	{ id: 'mumbai', name: 'Mumbai', lat: 19.0760, lon: 72.8777, accentColor: '#ff9944', city: 'Mumbai', continent: 'Asia' },
	{ id: 'moscow', name: 'Moscow', lat: 55.7558, lon: 37.6173, accentColor: '#cc66ff', city: 'Moscow', continent: 'Europe' },
	{ id: 'dubai', name: 'Dubai', lat: 25.2048, lon: 55.2708, accentColor: '#ffdd44', city: 'Dubai', continent: 'Asia' },
	{ id: 'singapore', name: 'Singapore', lat: 1.3521, lon: 103.8198, accentColor: '#44ffcc', city: 'Singapore', continent: 'Asia' },
	{ id: 'rome', name: 'Rome', lat: 41.9028, lon: 12.4964, accentColor: '#ffcc66', city: 'Rome', continent: 'Europe' },
	{ id: 'istanbul', name: 'Istanbul', lat: 41.0082, lon: 28.9784, accentColor: '#dd6644', city: 'Istanbul', continent: 'Europe' },
	{ id: 'seoul', name: 'Seoul', lat: 37.5665, lon: 126.9780, accentColor: '#ff77aa', city: 'Seoul', continent: 'Asia' },
	{ id: 'toronto', name: 'Toronto', lat: 43.6532, lon: -79.3832, accentColor: '#66aaff', city: 'Toronto', continent: 'North America' },
]
