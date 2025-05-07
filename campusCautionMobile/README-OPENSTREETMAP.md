# OpenStreetMap Integration for Campus Caution Mobile

This implementation adds OpenStreetMap support to the Campus Caution mobile app using a WebView-based approach that works on both iOS and Android.

## Components

### OSMMap Component

The `OSMMap` component is a React Native component that uses WebView to display an OpenStreetMap instance with Leaflet.js. This approach offers several advantages:

- Cross-platform compatibility (iOS and Android)
- Full access to Leaflet.js features
- Customizable markers and popups
- Interactive map features like zoom, pan, and click events

## How It Works

1. The implementation uses React Native WebView to render a Leaflet.js map in an HTML page
2. OpenStreetMap tiles are loaded from their public tile servers
3. Markers are added to the map with custom styling based on issue type
4. Communication between the WebView and React Native is handled through message passing

## Usage

```jsx
import OSMMap from '../../components/OSMMap';

// Usage example
<OSMMap
  style={styles.map}
  initialRegion={{
    latitude: 36.8969,
    longitude: 30.6882,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  }}
  markers={[
    {
      id: '1',
      coordinates: {
        latitude: 36.8969,
        longitude: 30.6882
      },
      title: 'Issue Title',
      description: 'Issue Description',
      color: 'red' // 'red', 'blue', or any valid CSS color
    }
  ]}
  onMarkerPress={(marker) => {
    console.log('Marker pressed:', marker);
    // Navigate or perform other actions with the marker data
  }}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| style | Object | Style for the map container |
| initialRegion | Object | Initial map view region with latitude, longitude, and deltas |
| markers | Array | Array of marker objects with id, coordinates, title, description, and color |
| onMarkerPress | Function | Callback function when a marker is pressed |

## Dependencies

- react-native-webview: For rendering the WebView component
- Leaflet.js: The JavaScript library for the map (loaded from CDN)

## Notes

- The implementation uses Leaflet.js version 1.7.1 loaded from CDN
- Marker click events are handled through message passing between the WebView and React Native
- Custom marker styling is implemented with CSS and HTML divs 