NetSpotter
NetSpotter is a web application for recording and visualizing network-quality measurements at geographic locations. It combines a Leaflet map, browser-based location detection, a browser speed test, a Spring Boot REST API, and a PostgreSQL database.
Project handoff: This README documents the features implemented so far and gives the next developer a suggested path forward. Confirm the current code and configuration before extending it.

Features implemented so far
- Interactive map: Leaflet displays an OpenStreetMap basemap.
- Location detection: The browser Geolocation API detects the user's coordinates and places a marker on the map.
- Speed test: The page measures approximate latency, download speed, and upload speed using Cloudflare's public speed-test endpoints.
- Measurement submission: A user selects a network provider and network type, then saves the detected location and latest successful speed-test results.
- REST API: Spring Boot exposes endpoints to create and list measurements.
- Database persistence: Spring Data JPA/Hibernate stores measurements in PostgreSQL.
- Measurement markers: Saved records are displayed on the map. Marker colors reflect download speed:
  - Green: 25 Mbps or higher
  - Yellow: 5 Mbps to below 25 Mbps
  - Red: below 5 Mbps
  - Grey: no usable download-speed value
- Record confirmation: After a successful save, the page displays the saved record's ID.
- Styling: The UI uses a dark red/burgundy theme.
Technology stack
- Java (project targets Java 21; the development machine has also been reported to run Java 25)
- Spring Boot 3.5.6
- JoinFaces 5.5.4 / JSF (Facelets)
- Maven
- Spring Web / REST
- Spring Data JPA and Hibernate
- PostgreSQL
- Leaflet 1.9.4
- OpenStreetMap tiles
- Cloudflare public speed-test endpoints
Check pom.xml for the authoritative dependency list and versions.
Project structure
jsf_project/
├── pom.xml
└── src/
    └── main/
        ├── java/
        │   └── com/netspotter/
        │       ├── NetSpotterApplication.java
        │       ├── Measurement.java
        │       ├── MeasurementRepository.java
        │       ├── MeasurementService.java
        │       └── MeasurementController.java
        ├── resources/
        │   └── application.properties
        └── webapp/
            ├── index.xhtml
            ├── map.xhtml
            ├── css/
            │   └── style.css
            └── js/
                └── map.js
Some files or names may have changed since this handoff was prepared; use the actual repository as the source of truth.
How the application works
1. The user opens index.xhtml.
2. map.js initializes the Leaflet map and requests saved measurements from the backend.
3. The user clicks the location-detection button. The browser asks for location permission and returns coordinates if permission is granted.
4. The user runs the speed test. map.js stores the latest successful results in a shared JavaScript variable.
5. The user selects a provider and network type and submits the measurement form.
6. JavaScript sends a JSON POST request to /api/measurements.
7. The Spring Boot controller passes the data through the service to the JPA repository.
8. PostgreSQL stores the measurement, and the API returns the saved record as JSON.
9. The UI displays the record ID. The page refreshes shortly afterward so saved markers can be loaded again.
API endpoints
GET /api/measurements
Returns the saved measurements as JSON.
Example local URL:
http://localhost:8080/api/measurements
POST /api/measurements
Creates a measurement. The request body is JSON, with fields such as:
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "provider": "Jio",
  "networkType": "5G",
  "downloadSpeed": 37.93,
  "uploadSpeed": 8.25,
  "latency": 28
}
The numbers above are illustrative examples, not real project measurements. Use the values and accepted validation rules in the current Measurement and MeasurementService code as the source of truth.
A successful POST returns the saved measurement, including its generated ID. The exact HTTP status and error response are defined by MeasurementController.
Run locally
Prerequisites
- A supported Java installation
- Maven
- PostgreSQL running locally or reachable from your machine
- A browser with location permission enabled for the local site
- Internet access for map tiles and the external speed-test service
1. Clone the repository
After the project has been pushed to GitHub:
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd jsf_project
Replace the placeholder URL with the actual repository URL.
2. Configure PostgreSQL
Review src/main/resources/application.properties. Configure the database URL, username, password, and any other required settings for your local PostgreSQL installation.
Do not commit real passwords, API secrets, or other credentials. Use environment variables or a local-only configuration file for secrets. If credentials have already been committed, changing the file alone does not remove them from Git history; rotate the credentials.
Create the database named in your configuration if it does not already exist. The exact database name and connection properties must be taken from application.properties.
3. Start the application
From the project root, run:
mvn spring-boot:run
If Maven is not on your Windows PATH, configure it for the current PowerShell session, using your own Maven installation path. For the current development setup, the command used was:
$env:Path += ";C:\Tools\apache-maven-3.10.0\bin"
Then run:
mvn spring-boot:run
4. Open the application
- Main page: http://localhost:8080/index.xhtml
- Measurements API: http://localhost:8080/api/measurements
If port 8080 is already in use, check the application configuration and logs.
5. Test the basic workflow
1. Open the main page.
2. Detect your location and confirm that the map zooms to it.
3. Run the speed test and wait for the completion message.
4. Select a provider and network type.
5. Save a measurement and confirm that a record ID is displayed.
6. Check the API endpoint to confirm that the new record appears.
7. Refresh the page and verify that the saved measurement appears on the map.
GitHub handoff checklist
Before pushing the project:
- [ ] Confirm the application runs from a clean terminal.
- [ ] Check git status and review every changed file.
- [ ] Inspect application.properties for passwords, usernames, private paths, or other sensitive values.
- [ ] Do not commit database dumps, build output (target/), IDE caches, or local secrets.
- [ ] Add or verify a .gitignore suitable for Java/Maven and the IDE being used.
- [ ] Commit the README and code together.
- [ ] Push to the intended GitHub repository and share the repository URL with your friend.
Suggested initial Git commands:
git status
git add README.md
git add .
git status
git commit -m "Document NetSpotter project and handoff"
git push
Review the staged files before committing. If the repository has no remote configured, add the correct GitHub remote first. Do not blindly push to a remote until you have verified that it is the intended repository.
Suggested next steps
Work through these in order, testing each change before moving on.
1. Make setup reproducible
- Document the exact PostgreSQL database name and required configuration keys without exposing credentials.
- Consider adding an application-local.properties.example or .env.example containing placeholders only.
- Add a clear .gitignore.
- Ask another developer to clone the repository and follow the README from scratch.
2. Improve validation and error handling
- Show field-specific validation messages for missing provider, missing location, or missing speed-test results.
- Ensure invalid or out-of-range coordinates and invalid speed values are rejected by the backend.
- Return consistent JSON error responses from the REST API.
- Avoid showing internal exception details to end users.
3. Improve speed-test reliability
- Clearly label results as estimates because browser timing and network conditions affect accuracy.
- Handle failed requests and external-service/CORS issues gracefully.
- Disable saving until a complete speed test has succeeded.
- Consider whether the chosen test payload sizes are sufficient for meaningful speed measurements.
- Do not describe latency measured by a browser fetch as a pure network ping; it includes request and browser overhead.
4. Improve map behavior
- Refresh map markers without reloading the whole page after saving.
- Avoid adding duplicate markers if measurements are reloaded more than once.
- Consider marker clustering when many measurements exist.
- Add filters for provider, network type, and speed range.
- Make the legend and popups responsive and accessible.
5. Add automated tests
- Add unit tests for MeasurementService validation.
- Add controller tests for successful and invalid GET/POST requests.
- Add repository/database integration tests, ideally using an isolated test database.
- Add a basic manual or automated browser test for the full save workflow.
6. Review data and privacy
- Explain to users that precise location is stored with measurements.
- Collect location only with explicit browser permission.
- Decide whether records should be anonymous, user-linked, or removable.
- Add deletion and retention behavior if required by the project's goals.
7. Polish the application
- Improve mobile layout and accessibility.
- Show loading and error states consistently.
- Add measurement history and detail views.
- Consider charts showing download/upload trends over time.
- Keep the existing burgundy theme unless the team agrees to change it.
Troubleshooting
The page does not load
- Check the Maven console for startup errors.
- Confirm PostgreSQL is running and the configured database is reachable.
- Check that the application is listening on port 8080.
Location detection fails
- Allow location permission in the browser.
- Check that the page is opened on localhost.
- Try again if the browser reports that the location is unavailable or times out.
The speed test fails
- Confirm internet access.
- Check the browser developer console for failed requests, CORS errors, or blocked requests to Cloudflare.
- Try again later if the external service is unavailable.
Saving says location must be detected
- Click the location button and wait for the detected-location confirmation before saving.
- Check the browser console for JavaScript errors.
Saving fails
- Check the browser developer console and the Spring Boot terminal.
- Open /api/measurements to see whether the API is responding.
- Verify the PostgreSQL connection and the JSON fields expected by MeasurementController and MeasurementService.
No saved markers appear
- Check that GET /api/measurements returns records.
- Verify each record has latitude and longitude.
- Check the browser console for API or Leaflet errors.
Notes for the next developer
- index.xhtml is a JSF/Facelets XHTML page. Keep XML syntax valid; boolean attributes should use explicit values where needed (for example, required="required").
- The stylesheet is src/main/webapp/css/style.css.
- The JavaScript is src/main/webapp/js/map.js.
- Leaflet is loaded by the page; verify its script and CSS links before debugging map behavior.
- PostgreSQL is part of the local development setup. Each developer needs their own suitable database configuration.
- Never assume that a successful browser speed test means the results have been saved; check the save confirmation and API response.
Current status: Core flow implemented: detect location → run speed test → save measurement → receive record ID → display saved measurements on the map.
Recommended next task: Make the project easy for another developer to clone and run, then add tests before expanding features.