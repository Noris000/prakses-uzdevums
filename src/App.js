import React, { useState, useEffect, Fragment } from 'react';
import logo from './logo.svg';
import './App.css';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import axios from 'axios';

// Map styling
const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

// Mapon API details
const maponApiBaseUrl = 'https://mapon.com/api/v1';
const maponApiKey = process.env.REACT_APP_MAPON_KEY;

function App() {
  // State variables
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  const [center] = useState({ lat: 56.95, lng: 24.11 });
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState({ hours: 0, minutes: 0 });

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await axios.get(`${maponApiBaseUrl}/unit/list.json?key=${maponApiKey}`);
        setVehicleList(response.data.data.units);
      } catch (error) {
        console.error('Error fetching vehicle data from Mapon API:', error);
      }
    };

    fetchVehicleData();
  }, []);

  // Generate route based on user input
  async function generateRoute() {
    const formattedStartDateISO = startDate ? new Date(startDate) : null;
    const formattedEndDateISO = endDate ? new Date(endDate) : null;

    try {
      const routeResponse = await axios.get(`${maponApiBaseUrl}/route/list.json`, {
        params: {
          key: maponApiKey,
          from: formattedStartDateISO.toISOString().slice(0, -5) + 'Z',
          till: formattedEndDateISO.toISOString().slice(0, -5) + 'Z',
          include: ['decoded_route'],
          unit_id: selectedVehicle,
        },
      });

      const filteredRoutes = routeResponse.data.data.units[0].routes.filter(route => route.type === 'route');
      setRouteCoordinates(filteredRoutes);

      let totalDistance = 0;
      let totalTimeInSeconds = 0;

      filteredRoutes.forEach(route => {
        totalDistance += route.distance;

        const startTime = new Date(route.start.time);
        const endTime = new Date(route.end.time);
        const durationInSeconds = (endTime - startTime) / 1000; // Convert milliseconds to seconds
        totalTimeInSeconds += durationInSeconds;
      });

      // Convert totalDistance from meters to kilometers
      const totalDistanceInKm = totalDistance / 1000;

      // Convert totalTimeInSeconds to hours and minutes
      const totalHours = Math.floor(totalTimeInSeconds / 3600);
      const totalMinutes = Math.floor((totalTimeInSeconds % 3600) / 60);

      setTotalDistance(totalDistanceInKm);
      setTotalTime({ hours: totalHours, minutes: totalMinutes });

    } catch (error) {
      console.error('Error fetching route data from Mapon API:', error);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>

      <div className="container">
        <div className="container-report">
          <h1>Route Report</h1>
          <form>
            {/* Vehicle selection */}
            <div className="vehicle">
              <label htmlFor="vehicleNumber">
                Vehicle Number<span className="required">*</span>
              </label>
              <div className="vehi-margin">
                <select
                  id="vehicleNumber"
                  name="vehicleNumber"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                >
                  <option value="">Select vehicle</option>
                  {vehicleList.map((vehicle) => (
                    <option key={vehicle.number} value={vehicle.unit_id}>
                      {vehicle.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time period selection */}
            <div className="time">
              <span>Period</span>
              <div className="time-margin">
                <div className="column">
                  <label htmlFor="startDate">From</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    pattern="\d{4}-\d{2}-\d{2}"
                    required
                  />
                </div>
                <div className="column">
                  <label htmlFor="endDate">To</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    pattern="\d{4}-\d{2}-\d{2}"
                    required
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Map container */}
          <div className="map-container">
            {routeCoordinates && routeCoordinates.length > 0 ? (
              <LoadScript
                googleMapsApiKey={process.env.REACT_APP_MAP_KEY}
                onError={() => alert('Error loading Google Maps. Please check the console for details.')}
              >
                <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={10}>
                  {routeCoordinates.map((route, index) => (
                    <Fragment key={index}>
                      <Marker position={{ lat: route.start.lat, lng: route.start.lng }} />
                      <Marker position={{ lat: route.start.lat, lng: route.start.lng }} />
                      <Polyline
                        path={route.decoded_route.points.map((point) => ({
                          lat: point.lat,
                          lng: point.lng
                        }))}
                        options={{ strokeColor: '#FF0000', strokeWeight: 4 }}
                      />
                    </Fragment>
                  ))}
                </GoogleMap>
              </LoadScript>
            ) : (
              <div></div>
            )}
          </div>

        {/* Route details */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <div className="containers-details">
            <div className="distance">
              <p>{totalDistance.toFixed(0)}</p>
              <p className="text">Km Driven</p>
            </div>
            <div className="driving-time">
              <p>{totalTime.hours}h {totalTime.minutes}m</p>
              <p className="text">Driving Time</p>
            </div>
          </div>
        )}

          {/* Generate route button */}
          <div className="container-button">
            <button type="button" onClick={generateRoute}>
              GENERATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;