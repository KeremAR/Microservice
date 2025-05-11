import React, { useRef, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface Marker {
  id: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description?: string;
  color?: string;
  isUserIssue?: boolean;
}

interface OSMMapProps {
  style?: any;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Marker[];
  onMarkerPress?: (marker: Marker) => void;
}

// Campus boundary coordinates
const campusBoundary = [
  [36.8900926, 30.6392717],
  [36.8884022, 30.6402588],
  [36.8876642, 30.6404412],
  [36.8876041, 30.6417286],
  [36.8882563, 30.6464386],
  [36.8882906, 30.6482625],
  [36.888548, 30.6501615],
  [36.8883249, 30.6545281],
  [36.8881834, 30.6553918],
  [36.8881147, 30.6568456],
  [36.8859008, 30.6613517],
  [36.88645, 30.6626177],
  [36.8969527, 30.6651711],
  [36.8996296, 30.6652999],
  [36.900865, 30.6633687],
  [36.9000757, 30.6559014],
  [36.9012082, 30.6461167],
  [36.8998226, 30.6341863],
  [36.8995995, 30.6339932],
  [36.8943486, 30.6370401],
  [36.8900926, 30.6392717] // Return to first point to close the polygon
];

// Mask boundary coordinates
const maskBoundary = [
  [[90, -180], [90, 180], [-90, 180], [-90, -180]],
  campusBoundary
];

// Map options
const mapOptions = {
  zoomControl: true,
  maxBounds: [
    [36.85, 30.62],
    [36.93, 30.68]
  ],
  maxBoundsViscosity: 0.8,
  minZoom: 13,
  maxZoom: 18
};

// Style options
const boundaryOptions = {
  color: "#2563eb",
  weight: 2,
  fillOpacity: 0
};

const maskOptions = {
  color: 'rgba(0,0,0,0.1)',
  fillColor: 'rgba(0,0,0,0.3)',
  fillOpacity: 0.35,
  stroke: false
};

const OSMMap: React.FC<OSMMapProps> = ({ 
  style, 
  initialRegion, 
  markers = [],
  onMarkerPress 
}) => {
  const webViewRef = useRef<WebView>(null);

  // Check if initialRegion has valid coordinates
  const hasValidCoordinates = initialRegion && 
    initialRegion.latitude !== 0 && 
    initialRegion.longitude !== 0;

  // Default to campus center if no valid coordinates
  const mapCenter = hasValidCoordinates 
    ? [initialRegion.latitude, initialRegion.longitude] 
    : [36.8945, 30.6520]; // Default to campus center
  
  const zoomLevel = hasValidCoordinates ? 16 : 14; // Zoom in more if we have specific coordinates

  const generateMarkers = () => {
    // Filter out markers with invalid coordinates
    const validMarkers = markers.filter(marker => 
      marker.coordinates && 
      marker.coordinates.latitude !== 0 && 
      marker.coordinates.longitude !== 0
    );
    
    return validMarkers.map(marker => {
      const color = marker.color || 'blue';
      return `
        L.marker([${marker.coordinates.latitude}, ${marker.coordinates.longitude}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          }),
          pane: 'markersPane'
        }).addTo(map).bindPopup("${marker.title}")
        .on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerClick',
            markerId: "${marker.id}"
          }));
        });
      `;
    }).join('\n');
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
      <style>
        body, html, #map {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
        }
        .custom-marker {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        /* Improve touch handling */
        .leaflet-touch .leaflet-control-zoom {
          border: none;
          background-clip: padding-box;
        }
        
        /* Prevent scrolling issues */
        .leaflet-container {
          background: #f0f0f0;
          outline: 0;
          touch-action: manipulation;
          -webkit-overflow-scrolling: touch;
        }

        /* Mask styling with filter for softer edges */
        .campus-mask {
          filter: blur(3px);
          transition: all 0.3s ease;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Prevent default touch behavior
        document.addEventListener('touchmove', function(e) {
          e.preventDefault();
        }, { passive: false });
        
        // Initialize map with options
        const map = L.map('map', {
          zoomControl: ${mapOptions.zoomControl},
          minZoom: ${mapOptions.minZoom},
          maxZoom: ${mapOptions.maxZoom},
          maxBoundsViscosity: ${mapOptions.maxBoundsViscosity},
          dragging: true,
          tap: true,
          inertia: true,
          bounceAtZoomLimits: false,
          touchZoom: true,
          doubleClickZoom: true
        }).setView([${mapCenter[0]}, ${mapCenter[1]}], ${zoomLevel});
        
        // Set max bounds
        map.setMaxBounds([
          [${mapOptions.maxBounds[0][0]}, ${mapOptions.maxBounds[0][1]}],
          [${mapOptions.maxBounds[1][0]}, ${mapOptions.maxBounds[1][1]}]
        ]);
        
        // Create custom panes for better layering
        map.createPane('tilesPane');
        map.createPane('maskPane');
        map.createPane('boundaryPane');
        map.createPane('markersPane');
        
        // Set z-index for panes
        map.getPane('tilesPane').style.zIndex = 200;
        map.getPane('maskPane').style.zIndex = 300;
        map.getPane('boundaryPane').style.zIndex = 400;
        map.getPane('markersPane').style.zIndex = 500;
        
        // Add class to mask pane for styling
        map.getPane('maskPane').classList.add('campus-mask');
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          pane: 'tilesPane'
        }).addTo(map);
        
        // Add campus boundary
        const campusBoundary = ${JSON.stringify(campusBoundary)};
        L.polygon(campusBoundary, {
          color: "${boundaryOptions.color}",
          weight: ${boundaryOptions.weight},
          fillOpacity: ${boundaryOptions.fillOpacity},
          pane: 'boundaryPane'
        }).addTo(map);
        
        // Add mask outside campus with smooth transition
        const maskBoundary = ${JSON.stringify(maskBoundary)};
        L.polygon(maskBoundary, {
          fillColor: "${maskOptions.fillColor}",
          fillOpacity: ${maskOptions.fillOpacity},
          stroke: ${maskOptions.stroke},
          pane: 'maskPane',
          className: 'campus-mask'
        }).addTo(map);
        
        // Add markers
        ${generateMarkers()}
        
        // Refresh map size after loading to handle any layout issues
        setTimeout(() => {
          map.invalidateSize();
        }, 500);
        
        // Send map ready message to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapReady'
        }));
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick' && onMarkerPress) {
        // Find marker by ID and call onMarkerPress with the full marker object
        const markerId = data.markerId;
        console.log('Marker clicked with ID:', markerId);
        
        if (markerId) {
          // Look for the marker in our markers array
          const marker = markers.find(m => m.id === markerId);
          if (marker) {
            onMarkerPress(marker);
          } else {
            // If marker not found, create minimal compliant object
            onMarkerPress({
              id: markerId,
              coordinates: {
                latitude: 0,
                longitude: 0
              },
              title: 'Unknown'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={[styles.webview, style]}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scrollEnabled={false}
      bounces={false}
      containerStyle={{ flex: 1 }}
      directionalLockEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    width: '100%',
    height: '100%',
  },
});

export default OSMMap; 