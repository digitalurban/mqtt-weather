# MQTT Weather & Environment Dashboard

This repository hosts a simple, static web dashboard for displaying real-time weather and environmental data. It is built with plain HTML, CSS, and JavaScript, and it is hosted live on GitHub Pages.

It works by using the [Paho MQTT JavaScript client](https://github.com/eclipse/paho.mqtt.javascript) to connect directly to an MQTT broker over secure WebSockets (`wss://`) and subscribe to data topics.

### ➡️ **Live Demo: [https://digitalurban.github.io/mqtt-weather/](https://digitalurban.github.io/mqtt-weather/)**

---

## 🖥️ Main Dashboard (`index.html`)

The main dashboard is a grid-based layout designed for a full browser. It displays a wide range of data, including temperature, wind, rain, air quality, and more, all updated in real-time.

![Main Dashboard Screenshot](https://github.com/digitalurban/mqtt-weather/blob/main/Screenshot%202025-10-31%20at%2010.06.16.png)

## ⚫ E-Ink Version (`eink.html`)

A second, simplified version is available, which is designed specifically for e-ink or other low-power, high-contrast displays. It removes most of the styling to focus on clear data presentation.

![E-Ink Dashboard Screenshot](https://github.com/digitalurban/mqtt-weather/blob/main/Screenshot%202025-10-31%20at%2010.07.21.png)

---

## ⚙️ How It Works

This is a purely **client-side** application. There is no backend server component in this repository.

1.  A user loads the static HTML page from GitHub Pages.
2.  The `mqtt.js` script (which uses the Paho library) creates a secure WebSocket connection to an MQTT broker.
3.  Once connected, the script subscribes to all the necessary data topics (e.g., `/weather/temp`, `/airquality/aqi`, etc.).
4.  As new messages are published to those topics by the weather station, the `onMessageArrived` function in the JavaScript is triggered.
5.  The script parses the message and uses `document.getElementById()` to update the content of the correct HTML element on the page.

This setup is extremely lightweight and fast, as it only requires a static file host and an accessible MQTT broker.

## 🚀 How to Use or Adapt

You can easily fork this repository to create your own dashboard:

1.  **Fork** this repository to your own GitHub account.
2.  **Enable GitHub Pages:** In your new repository, go to `Settings` > `Pages` and deploy from the `main` branch.
3.  **Edit the Connection:** Open `mqtt.js` (or your main JavaScript file) and update the connection details to point to your own MQTT broker:
    * Change the `broker_address` and `port`.
    * Ensure your broker is configured to accept secure WebSockets (`wss://`), as this is required by GitHub Pages.
    * Update your `clientId` and any `username`/`password` details if your broker requires authentication.
4.  **Edit the Topics:** In the `onConnect` function, change the `client.subscribe(...)` topics to match the topics your own devices are publishing to.
5.  **Edit the HTML:** Modify `index.html` and `eink.html` to add, remove, or change the display boxes to match your data.
