// Mock data generators for Osiris - synced with api-gateway

export function generateFlights(count: number = 50) {
  const airlines = ['UA', 'AA', 'DL', 'BA', 'LH', 'AF', 'EK', 'QF', 'SQ', 'JL'];
  const flights = [];
  
  for (let i = 0; i < count; i++) {
    const lat = (Math.random() - 0.5) * 140;
    const lon = (Math.random() - 0.5) * 340;
    flights.push({
      id: `FL${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      callsign: airlines[Math.floor(Math.random() * airlines.length)] + Math.floor(Math.random() * 9000),
      lat,
      lon,
      altitude: Math.floor(Math.random() * 40000) + 25000,
      speed: Math.floor(Math.random() * 300) + 400,
      heading: Math.floor(Math.random() * 360),
      origin: ['JFK', 'LAX', 'LHR', 'FRA', 'HND', 'SYD'][Math.floor(Math.random() * 6)],
      destination: ['JFK', 'LAX', 'LHR', 'FRA', 'HND', 'SYD'][Math.floor(Math.random() * 6)],
      lastUpdate: Date.now() - Math.floor(Math.random() * 60000)
    });
  }
  return flights;
}

export function generateShips(count: number = 30) {
  const ships = [];
  const types = ['cargo', 'tanker', 'container', 'bulk'];
  
  for (let i = 0; i < count; i++) {
    const lat = (Math.random() - 0.5) * 120;
    const lon = (Math.random() - 0.5) * 280;
    ships.push({
      id: `SHIP${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name: `MV ${['Pacific', 'Atlantic', 'Arctic', 'Indian', 'Southern'][Math.floor(Math.random() * 5)]} ${['Star', 'Pride', 'Glory', 'Fortune', 'Voyager'][Math.floor(Math.random() * 5)]}`,
      type: types[Math.floor(Math.random() * types.length)],
      lat,
      lon,
      speed: Math.floor(Math.random() * 20) + 5,
      heading: Math.floor(Math.random() * 360),
      destination: ['Shanghai', 'Rotterdam', 'Singapore', 'LA', 'Dubai'][Math.floor(Math.random() * 5)],
      lastUpdate: Date.now() - Math.floor(Math.random() * 300000)
    });
  }
  return ships;
}

export function generateSatellites(count: number = 20) {
  const sats = [];
  const names = ['ISS', 'HUBBLE', 'LANDSAT-9', 'SENTINEL-2', 'NOAA-20', 'AQUA', 'TERRA', 'GPM-CORE', 'SMAP', 'OCO-3'];
  
  for (let i = 0; i < count; i++) {
    sats.push({
      id: `SAT${i.toString().padStart(4, '0')}`,
      name: names[i % names.length],
      lat: (Math.random() - 0.5) * 180,
      lon: (Math.random() - 0.5) * 360,
      altitude: Math.floor(Math.random() * 600) + 400,
      velocity: Math.floor(Math.random() * 8) + 7,
      period: Math.floor(Math.random() * 30) + 90,
      lastUpdate: Date.now() - Math.floor(Math.random() * 30000)
    });
  }
  return sats;
}

export function generateFires(count: number = 15) {
  const fires = [];
  const regions = ['Mediterranean', 'California', 'Australia', 'Amazon', 'Siberia', 'West Africa', 'Indonesia'];
  
  for (let i = 0; i < count; i++) {
    fires.push({
      id: `FIRE${i.toString().padStart(4, '0')}`,
      lat: (Math.random() - 0.5) * 100,
      lon: (Math.random() - 0.5) * 300,
      brightness: Math.floor(Math.random() * 100) + 250,
      region: regions[Math.floor(Math.random() * regions.length)],
      confidence: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      frp: Math.floor(Math.random() * 100) + 10,
      acqDate: new Date().toISOString().split('T')[0],
      acqTime: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
    });
  }
  return fires;
}

export function generateEarthquakes(count: number = 8) {
  const earthquakes = [];
  const locations = ['Pacific Ring', 'Alpine Fault', 'Himalayan Region', 'Mid-Atlantic Ridge', 'Caribbean', 'Philippine Sea'];
  
  for (let i = 0; i < count; i++) {
    earthquakes.push({
      id: `EQ${Date.now()}-${i}`,
      lat: (Math.random() - 0.5) * 140,
      lon: (Math.random() - 0.5) * 280,
      magnitude: (Math.random() * 5 + 2).toFixed(1),
      depth: Math.floor(Math.random() * 300) + 10,
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: Date.now() - Math.floor(Math.random() * 86400000)
    });
  }
  return earthquakes;
}