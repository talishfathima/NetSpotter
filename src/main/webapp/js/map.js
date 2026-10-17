// Shared variables used by the map, speed test, and save form.
let userMarker = null;
let userLatitude = null;
let userLongitude = null;
let latestSpeedTest = null;

document.addEventListener('DOMContentLoaded', function () {
    const mapElement = document.getElementById('map');

    // Initialize the map if this page contains one.
    let map = null;

    if (mapElement && typeof L !== 'undefined') {
        map = L.map('map').setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add the download-speed legend once.
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'map-legend');

            div.style.background = '#ffffff';
            div.style.padding = '10px 12px';
            div.style.borderRadius = '8px';
            div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.25)';
            div.style.lineHeight = '1.8';

            div.innerHTML = `
                <strong>Download speed</strong><br>
                <span style="color:#16a34a">●</span> Good: 25+ Mbps<br>
                <span style="color:#eab308">●</span> Moderate: 5–24.9 Mbps<br>
                <span style="color:#dc2626">●</span> Slow: under 5 Mbps<br>
                <span style="color:#64748b">●</span> No speed recorded
            `;

            return div;
        };

        legend.addTo(map);

        // Load saved measurements from the backend.
        async function loadMeasurements() {
            try {
                const response = await fetch('/api/measurements');

                if (!response.ok) {
                    throw new Error('Could not load measurements.');
                }

                const measurements = await response.json();

                measurements.forEach(function (measurement) {
                    if (
                        measurement.latitude == null ||
                        measurement.longitude == null
                    ) {
                        return;
                    }

                    const speed = measurement.downloadSpeed;
                    let markerColor = '#64748b';

                    if (speed != null && Number.isFinite(Number(speed))) {
                        if (Number(speed) >= 25) {
                            markerColor = '#16a34a';
                        } else if (Number(speed) >= 5) {
                            markerColor = '#eab308';
                        } else {
                            markerColor = '#dc2626';
                        }
                    }

                    const marker = L.circleMarker(
                        [
                            Number(measurement.latitude),
                            Number(measurement.longitude)
                        ],
                        {
                            radius: 9,
                            color: '#ffffff',
                            weight: 2,
                            fillColor: markerColor,
                            fillOpacity: 0.9
                        }
                    ).addTo(map);

                    const popupContent = document.createElement('div');

                    const provider = document.createElement('strong');
                    provider.textContent =
                        measurement.provider || 'Unknown provider';
                    popupContent.appendChild(provider);

                    const details = document.createElement('p');
                    details.textContent =
                        'Record ID: ' + (measurement.id ?? 'N/A') +
                        '\nNetwork: ' + (measurement.networkType || 'Not specified') +
                        '\nDownload: ' + (measurement.downloadSpeed ?? 'N/A') + ' Mbps' +
                        '\nUpload: ' + (measurement.uploadSpeed ?? 'N/A') + ' Mbps' +
                        '\nLatency: ' + (measurement.latency ?? 'N/A') + ' ms';

                    details.style.whiteSpace = 'pre-line';
                    popupContent.appendChild(details);

                    marker.bindPopup(popupContent);
                });
            } catch (error) {
                console.error('Error loading measurements:', error);
            }
        }

        loadMeasurements();

        // Location detection.
        window.getLocation = function () {
            const status = document.getElementById('status');

            if (!navigator.geolocation) {
                status.textContent =
                    'Location is not supported by this browser.';
                return;
            }

            status.textContent = 'Requesting your location...';

            navigator.geolocation.getCurrentPosition(
                function (position) {
                    userLatitude = position.coords.latitude;
                    userLongitude = position.coords.longitude;

                    status.textContent =
                        'Location detected! Latitude: ' +
                        userLatitude.toFixed(6) +
                        ', Longitude: ' +
                        userLongitude.toFixed(6);

                    map.setView(
                        [userLatitude, userLongitude],
                        15
                    );

                    if (userMarker) {
                        userMarker.setLatLng([
                            userLatitude,
                            userLongitude
                        ]);
                    } else {
                        userMarker = L.marker([
                            userLatitude,
                            userLongitude
                        ])
                            .addTo(map)
                            .bindPopup('Your detected location');
                    }

                    userMarker.openPopup();
                },
                function (error) {
                    const messages = {
                        1: 'Location permission was denied. Allow access in your browser settings.',
                        2: 'Your location is unavailable. Please try again.',
                        3: 'The location request timed out. Please try again.'
                    };

                    status.textContent =
                        messages[error.code] ||
                        'Unable to detect your location.';
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        };
    }

    // Measurement save form.
    const form = document.getElementById('measurementForm');

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            const status = document.getElementById('saveStatus');

            if (!status) {
                console.error('The saveStatus element was not found.');
                return;
            }

            if (userLatitude === null || userLongitude === null) {
                status.textContent =
                    'Please detect your location before saving.';
                return;
            }

            if (!latestSpeedTest) {
                status.textContent =
                    'Please complete a successful speed test first.';
                return;
            }

            const providerElement = document.getElementById('provider');
            const networkTypeElement = document.getElementById('networkType');

            if (!providerElement || !networkTypeElement) {
                status.textContent =
                    'Provider or network type field was not found.';
                return;
            }

            const measurement = {
                latitude: userLatitude,
                longitude: userLongitude,
                provider: providerElement.value.trim(),
                networkType: networkTypeElement.value,
                downloadSpeed: latestSpeedTest.downloadSpeed,
                uploadSpeed: latestSpeedTest.uploadSpeed,
                latency: latestSpeedTest.latency
            };

            if (!measurement.provider) {
                status.textContent = 'Please enter your network provider.';
                return;
            }

            status.textContent = 'Saving measurement...';

            try {
                const response = await fetch('/api/measurements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(measurement)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        errorText || 'Server returned HTTP ' + response.status
                    );
                }

                const saved = await response.json();

                if (saved.id == null) {
                    throw new Error(
                        'Measurement was returned without a record ID.'
                    );
                }

                status.textContent =
                    'Measurement saved successfully! Record ID: ' +
                    saved.id;

                // Refresh map markers to include the new record.
                if (map) {
                    // Reload the page's map data by refreshing the page.
                    // The saved measurement remains in the database.
                    setTimeout(function () {
                        window.location.reload();
                    }, 1500);
                }
            } catch (error) {
                console.error('Measurement save failed:', error);
                status.textContent =
                    'Could not save measurement: ' + error.message;
            }
        });
    }

    // Speed test.
    const startButton = document.getElementById('startSpeedTest');

    if (startButton) {
        const status = document.getElementById('speedTestStatus');
        const downloadResult = document.getElementById('downloadResult');
        const uploadResult = document.getElementById('uploadResult');
        const latencyResult = document.getElementById('latencyResult');

        startButton.addEventListener('click', async function () {
            startButton.disabled = true;
            latestSpeedTest = null;

            downloadResult.textContent = '--';
            uploadResult.textContent = '--';
            latencyResult.textContent = '--';

            try {
                status.textContent = 'Testing connection latency...';

                const latencySamples = [];

                for (let i = 0; i < 3; i++) {
                    const start = performance.now();

                    const response = await fetch(
                        'https://speed.cloudflare.com/__down?bytes=0',
                        { cache: 'no-store' }
                    );

                    if (!response.ok) {
                        throw new Error('Latency test server returned an error.');
                    }

                    await response.arrayBuffer();

                    latencySamples.push(performance.now() - start);
                }

                const latency =
                    latencySamples.reduce((a, b) => a + b, 0) /
                    latencySamples.length;

                latencyResult.textContent = latency.toFixed(0);

                status.textContent = 'Measuring download speed...';

                const downloadStart = performance.now();

                const downloadResponse = await fetch(
                    'https://speed.cloudflare.com/__down?bytes=1000000&cache=' +
                    Date.now(),
                    { cache: 'no-store' }
                );

                if (!downloadResponse.ok) {
                    throw new Error('Download test failed.');
                }

                const downloadData = await downloadResponse.arrayBuffer();

                const downloadSeconds =
                    (performance.now() - downloadStart) / 1000;

                const downloadMbps =
                    (downloadData.byteLength * 8) /
                    downloadSeconds / 1000000;

                downloadResult.textContent = downloadMbps.toFixed(2);

                status.textContent = 'Measuring upload speed...';

                const uploadBytes = new Uint8Array(250000);

                for (let i = 0; i < uploadBytes.length; i += 65536) {
                    const chunk = uploadBytes.subarray(
                        i,
                        Math.min(i + 65536, uploadBytes.length)
                    );

                    window.crypto.getRandomValues(chunk);
                }

                const uploadStart = performance.now();

                const uploadResponse = await fetch(
                    'https://speed.cloudflare.com/__up',
                    {
                        method: 'POST',
                        body: uploadBytes,
                        cache: 'no-store'
                    }
                );

                if (!uploadResponse.ok) {
                    throw new Error(
                        'Upload test failed. The test service may be unavailable.'
                    );
                }

                await uploadResponse.arrayBuffer();

                const uploadSeconds =
                    (performance.now() - uploadStart) / 1000;

                const uploadMbps =
                    (uploadBytes.byteLength * 8) /
                    uploadSeconds / 1000000;

                uploadResult.textContent = uploadMbps.toFixed(2);

                // Save results in the shared variable for the form handler.
                latestSpeedTest = {
                    downloadSpeed: Number(downloadMbps.toFixed(2)),
                    uploadSpeed: Number(uploadMbps.toFixed(2)),
                    latency: Number(latency.toFixed(0))
                };

                status.textContent =
                    'Speed test complete. Results are ready to save.';
            } catch (error) {
                console.error('Speed test error:', error);

                status.textContent =
                    'Speed test failed: ' + error.message +
                    ' Check your internet connection and try again.';
            } finally {
                startButton.disabled = false;
            }
        });
    }
});