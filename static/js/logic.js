// Create the Leaflet map
let map = L.map('map').setView([37.5, -98.35], 4); // Set initial view to [latitude, longitude, zoom]

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(map);

// Create a layer group for the earthquake markers
let earthquakeLayerGroup = L.layerGroup();

// Fetch earthquake data from USGS API
fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson')
  .then(response => response.json())
  .then(data => {
    console.log('Received earthquake data:', data);

    // Process the received data
    let earthquakes = data.features.map(feature => ({
      magnitude: feature.properties.mag,
      location: feature.properties.place,
      depth: feature.geometry.coordinates[2],
      coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] 
    }));

    console.log('Processed earthquakes:', earthquakes);

    // Function to calculate marker color based on depth
    // Didn't like the defaults so I worked with the Chat AIs and came up with the below -little more complaicated- code to get the desired color palet
    // I was trying to emulpate the example from the lesson plan and the below was what worked
    let getMarkerColor = depth => {
      let depthRanges = [0, 15, 30, 45, 60, 90];
      let colorRanges = ['#00FF00', '#9ACD32', '#FFD700', '#FFA500', '#FF4500', '#FF0000'];

      // Iterate through the depth ranges to find the appropriate color for the given depth
      for (let i = 0; i < depthRanges.length - 1; i++) {
        if (depth >= depthRanges[i] && depth < depthRanges[i + 1]) {
          return colorRanges[i];
        }
      }

      // If the depth is greater than the last range, return the color of the last range
      // This part was key to get all the really deep ones the same color, anything over 90 km is deep enough ;)
      return colorRanges[colorRanges.length - 1];
    };

    // Function to calculate marker radius based on magnitude
    let getMarkerRadius = magnitude => {
      
      let scalingFactor = 35;
      let minRadius = 5;
      let maxRadius = 200;

      // Calculate the radius based on the logarithm of the magnitude
      // I didn't like the way the ciricles looked so again asked the Chat AI for help with creating a log scale to take away some of the extream sizes
      let radius = Math.log10(magnitude) * scalingFactor;

      // Ensure the radius is within the minimum and maximum bounds
      return Math.max(minRadius, Math.min(radius, maxRadius));
    };

    // Add markers for earthquakes to the layer group
    earthquakes.forEach(earthquake => {
      let circleMarker = L.circleMarker(earthquake.coordinates, {
        radius: getMarkerRadius(earthquake.magnitude),
        fillColor: getMarkerColor(earthquake.depth),
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6
      })
        .bindPopup(`Magnitude: ${earthquake.magnitude}<br>Location: ${earthquake.location}<br>Depth: ${earthquake.depth} km`)
        .addTo(earthquakeLayerGroup);

      // Update marker radius when zooming
      // This may be more than needed but I was having issues while zomming in 
      map.on('zoomend', () => {
        circleMarker.setRadius(getMarkerRadius(earthquake.magnitude));
      });
    });

    // Add the layer group to the map
    // With so may recored earth quick with the above call I wanted to "paint" them all onto one layer then add one layer to the map
    earthquakeLayerGroup.addTo(map);

    console.log('Added markers to map.');
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Create a legend control
let legend = L.control({ position: 'bottomright' });

// Define the legend content and colors
legend.onAdd = function (map) {
  let div = L.DomUtil.create('div', 'legend');
  let depthRanges = [0, 15, 30, 45, 60, 90];

  div.innerHTML += '<div class="legend-title">Depth Range</div>';

  // Iterate through the depth ranges to create the legend boxes and labels
  //  Big help from the AIs on this one --did I mention I don't like JS and this was painful--
  for (let i = 0; i < depthRanges.length; i++) {
    let rangeStart = depthRanges[i];
    let rangeEnd = depthRanges[i + 1] ? depthRanges[i + 1] : '+';
    let color = getMarkerColor(rangeStart);

    let box = `<span class="legend-color" style="background: ${color}"></span>`;
    let label = `<span class="legend-label">${rangeStart} - ${rangeEnd}</span>`;

    // Create a legend item with the color box and label
    div.innerHTML += `<div>${box}${label}</div>`;
  }

  return div;
};

// Add the legend control to the map
legend.addTo(map);
