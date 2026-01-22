import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { api, getConfig } from '../services/api';

export default function Tracking() {
  const { orderId } = useParams();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [config, shipmentData, historyData] = await Promise.all([
          getConfig(),
          api.get(`/shipments/order/${orderId}`),
          api.get(`/shipments/order/${orderId}/history`)
        ]);

        mapboxgl.accessToken = config.mapboxToken;
        setShipment(shipmentData.shipment);
        setHistory(historyData.history);
      } catch (err) {
        console.error('Failed to fetch tracking data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  useEffect(() => {
    if (!shipment || map.current || !mapboxgl.accessToken) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [shipment.currentLocation.lng, shipment.currentLocation.lat],
      zoom: 4
    });

    map.current.on('load', () => {
      setMapLoaded(true);

      // Add route line
      if (shipment.route && shipment.route.length > 1) {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: shipment.route.map(p => [p.lng, p.lat])
            }
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#1a73e8',
            'line-width': 4,
            'line-opacity': 0.6
          }
        });
      }

      // Origin marker
      new mapboxgl.Marker({ color: '#34a853' })
        .setLngLat([shipment.origin.lng, shipment.origin.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>Origin</strong><br>${shipment.origin.label}`))
        .addTo(map.current);

      // Destination marker
      new mapboxgl.Marker({ color: '#ea4335' })
        .setLngLat([shipment.destination.lng, shipment.destination.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>Destination</strong><br>${shipment.destination.label}`))
        .addTo(map.current);

      // Current location marker (if not delivered)
      if (shipment.status !== 'delivered') {
        const currentMarker = document.createElement('div');
        currentMarker.className = 'current-location-marker';
        currentMarker.style.cssText = `
          width: 20px;
          height: 20px;
          background: #1a73e8;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        `;

        new mapboxgl.Marker(currentMarker)
          .setLngLat([shipment.currentLocation.lng, shipment.currentLocation.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Current Location</strong><br>${shipment.statusLabel}`))
          .addTo(map.current);
      }

      // Fit bounds to show entire route
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([shipment.origin.lng, shipment.origin.lat]);
      bounds.extend([shipment.destination.lng, shipment.destination.lat]);
      bounds.extend([shipment.currentLocation.lng, shipment.currentLocation.lat]);

      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 10
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [shipment]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading tracking information...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="empty-state">
        <h3>Shipment not found</h3>
        <p>Unable to load tracking information for this order.</p>
        <Link to="/orders" className="btn btn-primary">
          View Orders
        </Link>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <Link to={`/orders/${orderId}`} className="btn btn-outline btn-sm" style={{ marginBottom: '1.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Order
      </Link>

      <div className="page-header">
        <h1 className="page-title">Track Your Order</h1>
        <p className="page-subtitle">Tracking # {shipment.trackingNumber}</p>
      </div>

      <div className="tracking-container">
        <div className="tracking-map" ref={mapContainer}>
          {!mapLoaded && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'var(--background)'
            }}>
              <div className="spinner"></div>
            </div>
          )}
        </div>

        <div className="tracking-info">
          <div className="tracking-status">
            <h2>{shipment.statusLabel}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Carrier: {shipment.carrier}
            </p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${shipment.progress}%` }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {shipment.progress}% complete
            </p>
          </div>

          {shipment.estimatedDelivery && (
            <div style={{
              background: 'var(--primary-blue-light)',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Estimated Delivery
              </p>
              <p style={{ fontWeight: '600', color: 'var(--primary-blue)' }}>
                {new Date(shipment.estimatedDelivery).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          <div className="tracking-timeline">
            <h3 style={{ marginBottom: '1rem' }}>Shipment History</h3>
            {history.map((event, index) => (
              <div key={index} className="timeline-item">
                <div
                  className={`timeline-dot ${index === 0 ? 'active' : index < history.length - 1 ? 'completed' : ''}`}
                />
                <div className="timeline-content">
                  <h4>{event.status}</h4>
                  <p>{event.description}</p>
                  <p>{event.location}</p>
                  <time>{formatDate(event.timestamp)}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
