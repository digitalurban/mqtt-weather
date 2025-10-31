# MQTT Weather & Environment Dashboard

This repository hosts a simple, static web dashboard for displaying real-time weather and environmental data. It is built with plain HTML, CSS, and JavaScript, and it is hosted live on GitHub Pages.

It works by using the [Paho MQTT JavaScript client](https://github.com/eclipse/paho.mqtt-javascript) to connect directly to an MQTT broker over secure WebSockets (`wss://`) and subscribe to data topics.

### ➡️ **Live Demo Main: [https://digitalurban.github.io/mqtt-weather/](https://digitalurban.github.io/mqtt-weather/)**

### ➡️ **Live Demo Mixed: [https://digitalurban.github.io/mqtt-weather/mixed_dashboard.html](https://digitalurban.github.io/mqtt-weather/mixed_dashboard.html)**

### ➡️ **Live Demo eink: [https://digitalurban.github.io/mqtt-weather/eink.html](https://digitalurban.github.io/mqtt-weather/eink.html)**

---

## Dashboards

This repository contains three different dashboard examples:

### 1. Main Dashboard (`index.html`)

The main dashboard is a grid-based layout designed for a full browser. It displays a wide range of data, including temperature, wind, rain, air quality, and more, all updated in real-time via MQTT.

![Main Dashboard Screenshot](https://github.com/digitalurban/mqtt-weather/blob/main/Screenshot%202025-10-31%20at%2010.06.16.png)

### 2. Mixed Dashboard (`mixed_dashboard.html`)

This dashboard combines the real-time MQTT data (like temperature and wind) from the main page with a multi-day forecast from the Open-Meteo API and an embedded live rain radar.

![Mixed Dashboard Screenshot](https://raw.githubusercontent.com/digitalurban/mqtt-weather/main/Screenshot%202025-10-31%20at%2010.17.39.png)

### 3. E-Ink Version (`eink.html`)

A simplified, high-contrast version designed specifically for e-ink or other low-power displays. It removes most of the styling to focus on clear data presentation.

![E-Ink Dashboard Screenshot](https://github.com/digitalurban/mqtt-weather/blob/main/Screenshot%202025-10-31%20at%2010.07.21.png)

---

## ⚙️ How It Works

This is a purely **client-side** application. There is no backend server component in this repository. The page uses three different techniques to get its data:

### 1. Real-Time Data (MQTT)

* **How:** The `mqtt.js` script (using the Paho library) creates a secure WebSocket (`wss://`) connection to your MQTT broker.
* **What:** It subscribes to topics (e.g., `/weather/temp`). When new messages arrive, the script updates the HTML to display the new numbers.
* **Used for:** All the real-time data like current temperature, wind, pressure, etc.

### 2. Weather Forecast (Open-Meteo API)

* **How:** On page load, a JavaScript function makes a `fetch` request to the **Open-Meteo API** (e.g., `api.open-meteo.com/...`).
* **What:** The API returns a large **JSON** file containing the forecast for the coming days (max temps, rain probability, etc.). The script then parses this JSON and dynamically updates the HTML of the forecast section.
* **Used for:** The multi-day weather forecast on the "Mixed Dashboard".

### 3. Rain Radar (Rainviewer Widget)

* **How:** The HTML page includes a `<script>` tag from `rainviewer.com`.
* **What:** This external JavaScript runs, finds its placeholder `<div>` on the page, and dynamically builds the interactive rain radar map inside it.
* **Used for:** The live radar map on the "Mixed Dashboard".

## 🚀 How to Use or Adapt

You can easily fork this repository to create your own dashboard:

1.  **Fork** this repository to your own GitHub account.
2.  **Enable GitHub Pages:** In your new repository, go to `Settings` > `Pages` and deploy from the `main` branch.
3.  **Edit the Connection:** Open `mqtt.js` (or your main JavaScript file) and update the connection details to point to your own MQTT broker:
    * Change the `broker_address` and `port`.
    * Ensure your broker is configured to accept secure WebSockets (`wss://`), as this is required by GitHub Pages.
    * Update your `clientId` and any `username`/`password` details if your broker requires authentication.
4.  **Edit the Topics:** In the `onConnect` function, change the `client.subscribe(...)` topics to match the topics your own devices are publishing to.
5.  **Edit the API/Widgets:** In `mixed_dashboard.html`, you can change the latitude/longitude for the Open-Meteo API call and the Rainviewer widget to match your location.
