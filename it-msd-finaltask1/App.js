import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

const geofences = [
  { id: 1, latitude: 37.78825, longitude: -122.4324, radius: 100 },
];

const getDistance = (point1, point2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000; // meters

  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const App = () => {
  const [location, setLocation] = useState(null);
  const [alertedGeofences, setAlertedGeofences] = useState([]);

  useEffect(() => {
    let subscription;
    const requestPermissions = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (newLocation) => {
          setLocation(newLocation.coords);
        }
      );
    };

    requestPermissions();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (location) {
      geofences.forEach((geofence) => {
        const distance = getDistance(location, geofence);
        if (distance < geofence.radius && !alertedGeofences.includes(geofence.id)) {
          setAlertedGeofences((prev) => [...prev, geofence.id]);
          Alert.alert('Geofence Alert', `You entered geofence ${geofence.id}!`);
        }
      });
    }
  }, [location]);

  const region = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : null;

  return (
    <View style={styles.container}>
      {region ? (
        <MapView
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
        >
          {geofences.map((geofence) => (
            <React.Fragment key={geofence.id}>
              <Marker
                coordinate={{
                  latitude: geofence.latitude,
                  longitude: geofence.longitude,
                }}
                title={`Geofence ${geofence.id}`}
              />
              <Circle
                center={{
                  latitude: geofence.latitude,
                  longitude: geofence.longitude,
                }}
                radius={geofence.radius}
                strokeColor="rgba(255, 0, 0, 0.5)"
                fillColor="rgba(255, 0, 0, 0.2)"
              />
            </React.Fragment>
          ))}
        </MapView>
      ) : (
        <Text>Loading location...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' },
});

export default App;
