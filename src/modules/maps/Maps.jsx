import { useEffect, useRef, useState } from 'react'
import {
  MapPin,
  Navigation,
  Search,
  X,
  Navigation2,
  Car,
  Compass,
  Layers,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import styles from './Maps.module.css'

export default function Maps() {
  const { addToast } = useAppStore()
  
  // Refs
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const routePolylineRef = useRef(null)
  const userMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)

  // Map state
  const [mapTheme, setMapTheme] = useState('light') // 'light' | 'dark'
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Route state
  const [startLocation, setStartLocation] = useState(null) // { lat, lng }
  const [destLocation, setDestLocation] = useState(null)   // { lat, lng, name }
  const [activeVehicle, setActiveVehicle] = useState('motorcycle') // 'car' | 'motorcycle' | 'bicycle' | 'walk'
  const [routeStats, setRouteStats] = useState(null) // { distance, duration, trafficStatus, trafficBadge }

  // Search Debouncer
  const searchTimeout = useRef(null)

  // 1. Map Initialization
  useEffect(() => {
    if (!window.L || mapRef.current) return

    // Initialize Map
    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false
    }).setView([-6.2000, 106.8167], 13) // Default to Jakarta center

    // Load Tile Layer based on theme
    const tileUrl = mapTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    
    const baseLayer = window.L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapRef.current = map
    mapRef.current.tileLayer = baseLayer

    // Try to auto-detect user location on load
    detectUserLocation(false) // silent check

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    
    if (map.tileLayer) {
      map.removeLayer(map.tileLayer)
    }

    const tileUrl = mapTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

    map.tileLayer = window.L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)
  }, [mapTheme])

  // Recalculate route when start, destination, or vehicle changes
  useEffect(() => {
    if (startLocation && destLocation) {
      calculateRoute()
    }
  }, [startLocation, destLocation, activeVehicle])

  // 2. Geolocation Detector
  const detectUserLocation = (showToast = true) => {
    if (!navigator.geolocation) {
      if (showToast) addToast('Browser tidak mendukung GPS', 'warning')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setStartLocation({ lat: latitude, lng: longitude })

        if (!window.L || !mapRef.current) return
        const map = mapRef.current

        // Custom Blue Marker for User Location
        const userIcon = window.L.divIcon({
          className: 'custom-user-icon',
          html: `<div style="
            width: 16px; height: 16px; 
            background: #3b82f6; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude])
        } else {
          userMarkerRef.current = window.L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('Lokasi Saya')
        }

        if (showToast) {
          map.setView([latitude, longitude], 15)
          addToast('Lokasi GPS terdeteksi!', 'success')
        }
      },
      (err) => {
        if (showToast) addToast('Gagal melacak lokasi GPS', 'error')
        // Fallback: Default dummy start location near UI campus
        if (!startLocation) {
          setStartLocation({ lat: -6.3620, lng: 106.8240 }) // UI Depok campus
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  // 3. Nominatim Geocoding Search
  const handleSearchChange = (val) => {
    setSearchQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (!val.trim()) {
      setSuggestions([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&countrycodes=id`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 600)
  }

  const selectSuggestion = (sug) => {
    const lat = parseFloat(sug.lat)
    const lng = parseFloat(sug.lon)
    const name = sug.name || sug.display_name.split(',')[0]
    
    setDestLocation({ lat, lng, name })
    setSearchQuery(name)
    setSuggestions([])

    if (!window.L || !mapRef.current) return
    const map = mapRef.current

    // Red Pin for Destination
    const destIcon = window.L.divIcon({
      className: 'custom-dest-icon',
      html: `<div style="
        width: 24px; height: 24px; 
        background: #ef4444; 
        border: 2px solid white; 
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      "><div style="
        width: 8px; height: 8px; 
        background: white; 
        border-radius: 50%;
        transform: rotate(45deg);
      "></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    })

    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng([lat, lng])
    } else {
      destMarkerRef.current = window.L.marker([lat, lng], { icon: destIcon })
        .addTo(map)
    }

    destMarkerRef.current.bindPopup(name).openPopup()
    map.setView([lat, lng], 15)
  }

  // 4. OSRM Routing + Congestion Estimation
  const calculateRoute = async () => {
    if (!startLocation || !destLocation || !window.L || !mapRef.current) return

    setIsLoadingRoute(true)
    const start = `${startLocation.lng},${startLocation.lat}`
    const dest = `${destLocation.lng},${destLocation.lat}`
    
    // Choose OSRM profile
    let profile = 'driving' // car / motorcycle
    if (activeVehicle === 'bicycle') profile = 'bike'
    if (activeVehicle === 'walk') profile = 'foot'

    try {
      const url = `https://router.project-osrm.org/route/v1/${profile}/${start};${dest}?overview=full&geometries=geojson`
      const res = await fetch(url)
      
      if (!res.ok) throw new Error('Rute tidak ditemukan')

      const data = await res.json()
      if (!data.routes || data.routes.length === 0) throw new Error('Tidak ada rute')

      const route = data.routes[0]
      const distanceKm = route.distance / 1000
      let durationMins = route.duration / 60

      // Simulate Jakarta/Local traffic delay factor based on hour and vehicle type
      const h = new Date().getHours()
      const isRushHour = (h >= 7 && h <= 9) || (h >= 16 && h <= 19)

      let trafficStatus = 'Lancar'
      let trafficBadge = styles.trafficLancar
      let delayFactor = 1.0

      if (activeVehicle === 'car') {
        if (isRushHour) {
          delayFactor = 1.95 // 95% delay
          trafficStatus = 'Macet Parah'
          trafficBadge = styles.trafficMacet
        } else {
          delayFactor = 1.3 // 30% delay
          trafficStatus = 'Padat Merayap'
          trafficBadge = styles.trafficPadat
        }
      } else if (activeVehicle === 'motorcycle') {
        // Motorcycle can filter through traffic
        if (isRushHour) {
          delayFactor = 1.25
          trafficStatus = 'Padat Lancar'
          trafficBadge = styles.trafficPadat
        } else {
          delayFactor = 1.05
          trafficStatus = 'Lancar'
          trafficBadge = styles.trafficLancar
        }
        // Motorbike is generally faster than default car profile speed
        durationMins = durationMins * 0.8 
      } else {
        // Bike & Foot are unaffected by road traffic
        trafficStatus = 'Bebas Macet'
        trafficBadge = styles.trafficLancar
      }

      const estimatedMins = Math.round(durationMins * delayFactor)

      setRouteStats({
        distance: distanceKm.toFixed(1) + ' km',
        duration: estimatedMins >= 60 
          ? `${Math.floor(estimatedMins / 60)} j ${estimatedMins % 60} m`
          : `${estimatedMins} menit`,
        trafficStatus,
        trafficBadge
      })

      // Draw Polyline
      const map = mapRef.current
      const coords = route.geometry.coordinates.map(c => [c[1], c[0]]) // GeoJSON [lng, lat] -> Leaflet [lat, lng]

      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(coords)
      } else {
        routePolylineRef.current = window.L.polyline(coords, {
          color: activeVehicle === 'walk' ? '#10b981' : 'var(--color-primary)',
          weight: 5,
          opacity: 0.85,
          dashArray: activeVehicle === 'walk' ? '5, 8' : null
        }).addTo(map)
      }

      // Re-style depending on vehicle
      routePolylineRef.current.setStyle({
        color: activeVehicle === 'walk' ? '#10b981' : activeVehicle === 'bicycle' ? '#f59e0b' : 'var(--color-primary)',
        dashArray: activeVehicle === 'walk' ? '5, 8' : null
      })

      // Fit map bounds to show route
      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 80] })

    } catch (err) {
      addToast('Gagal merencanakan rute: ' + err.message, 'error')
    } finally {
      setIsLoadingRoute(false)
    }
  }

  const clearDestination = () => {
    setDestLocation(null)
    setSearchQuery('')
    setRouteStats(null)
    if (destMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(destMarkerRef.current)
      destMarkerRef.current = null
    }
    if (routePolylineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routePolylineRef.current)
      routePolylineRef.current = null
    }
  }

  const toggleTheme = () => {
    setMapTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return (
    <div className={styles.page}>
      {/* Search HUD */}
      <div className={styles.overlayControls}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            className={styles.input}
            placeholder="Cari gedung kampus, kost, kafe..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={clearDestination}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Suggestion Dropdown */}
        {isSearching && (
          <div className={styles.suggestions} style={{ padding: '12px', textAlign: 'center' }}>
            <Loader2 size={16} className={`${styles.spinner} anim-spin`} style={{ display: 'inline' }} /> Mencari...
          </div>
        )}
        {!isSearching && suggestions.length > 0 && (
          <ul className={styles.suggestions}>
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                className={styles.suggestionItem}
                onClick={() => selectSuggestion(s)}
              >
                <span className={styles.suggestionName}>{s.name || s.display_name.split(',')[0]}</span>
                <span className={styles.suggestionAddr}>{s.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leaflet DOM Node */}
      <div ref={mapContainerRef} className={styles.mapContainer} />

      {/* Floating Buttons */}
      <div className={styles.floatingActions}>
        <button className={styles.floatBtn} onClick={toggleTheme} title="Ganti Tema Map">
          <Layers size={18} />
        </button>
        <button className={styles.floatBtn} onClick={() => detectUserLocation(true)} title="Lokasi Saya">
          <Compass size={18} />
        </button>
      </div>

      {/* Route Info HUD */}
      <AnimatePresence>
        {destLocation && (
          <motion.div
            className={styles.routePanel}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <div className={styles.vehicleRow}>
              {[
                { id: 'motorcycle', label: 'Motor', icon: Compass },
                { id: 'car', label: 'Mobil', icon: Car },
                { id: 'bicycle', label: 'Sepeda', icon: Compass },
                { id: 'walk', label: 'Jalan', icon: Compass }
              ].map(veh => {
                const isAct = activeVehicle === veh.id
                return (
                  <button
                    key={veh.id}
                    className={`${styles.vehicleBtn} ${isAct ? styles.vehicleActive : ''}`}
                    onClick={() => setActiveVehicle(veh.id)}
                  >
                    <veh.icon size={16} />
                    <span className={styles.vehicleLabel}>{veh.label}</span>
                  </button>
                )
              })}
            </div>

            {isLoadingRoute ? (
              <div className={styles.loader}>
                <Loader2 size={16} className={styles.spinner} />
                <span>Menghitung estimasi rute OSRM...</span>
              </div>
            ) : routeStats ? (
              <div className={styles.metricsRow}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Jarak Tempuh</span>
                  <span className={styles.metricVal}>{routeStats.distance}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Waktu Perjalanan (ETA)</span>
                  <span className={styles.metricVal}>{routeStats.duration}</span>
                </div>
                <span className={`${styles.trafficBadge} ${routeStats.trafficBadge}`}>
                  {routeStats.trafficStatus}
                </span>
              </div>
            ) : (
              <div className={styles.loader} style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={16} />
                <span>Gagal menghitung rute</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
