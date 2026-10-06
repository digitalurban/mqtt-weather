/*
   Banner forecast — day / night summary from Open-Meteo.

   Replaces the old Met Office headline that arrived on the MQTT topic
   personal/ucfnaps/eink/met/headline (that feed died with DataPoint).
   Same approach as the Fenland dashboard: call Open-Meteo's best-match
   forecast straight from the browser — no key, no server, no broker —
   and write the words ourselves.

   Daytime shows "Today … Tonight …"; after sunset it rolls on to
   "Tonight … Tomorrow …". Refreshes every 30 minutes.
   Writes into #currentcond. Self-contained; defines no globals.
 */
(function () {
  "use strict";

  var LAT = 52.6033, LON = 0.3822;          // Fincham — same as Fenland
  var TARGET = "currentcond";
  var REFRESH_MS = 30 * 60 * 1000;

  var WMO = {
    0: "clear", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "foggy", 48: "freezing fog",
    51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
    56: "freezing drizzle", 57: "freezing drizzle",
    61: "light rain", 63: "rain", 65: "heavy rain",
    66: "freezing rain", 67: "freezing rain",
    71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
    80: "light showers", 81: "showers", 82: "heavy showers",
    85: "snow showers", 86: "heavy snow showers",
    95: "thunderstorms", 96: "thunderstorms with hail", 99: "thunderstorms with hail"
  };
  // at night "clear" / "mainly clear" read better as this
  var NIGHT = { 0: "clear skies", 1: "mostly clear", 2: "partly cloudy" };

  // Erik Flowers' Weather Icons (already in the repo) for the current hour
  function iconClass(c, day) {
    var d = day ? "day-" : "night-alt-";
    if (c === 0) return day ? "wi-day-sunny" : "wi-night-clear";
    if (c === 1) return day ? "wi-day-sunny-overcast" : "wi-night-alt-partly-cloudy";
    if (c === 2) return "wi-" + d + "cloudy";
    if (c === 3) return "wi-cloudy";
    if (c === 45 || c === 48) return day ? "wi-day-fog" : "wi-night-fog";
    if (c >= 51 && c <= 57) return "wi-" + d + "sprinkle";
    if (c === 61 || c === 63) return "wi-" + d + "rain";
    if (c === 65) return "wi-rain";
    if (c === 66 || c === 67) return "wi-" + d + "sleet";
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return "wi-" + d + "snow";
    if (c >= 80 && c <= 82) return "wi-" + d + "showers";
    if (c >= 95) return "wi-" + d + "thunderstorm";
    return "wi-na";
  }

  var COMPASS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  function compass(d) { return d == null ? "" : COMPASS[Math.round(d / 22.5) % 16]; }
  function windWord(m) {
    return m >= 39 ? "gale-force" : m >= 25 ? "strong" : m >= 13 ? "fresh"
         : m >= 8 ? "moderate" : m >= 4 ? "light" : "calm";
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function round(v) { return Math.round(v); }
  function max(a) { return a.length ? Math.max.apply(null, a) : null; }
  function min(a) { return a.length ? Math.min.apply(null, a) : null; }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : null; }

  // Mean wind direction (vector average — a plain mean of 350° and 10° is 180°)
  function meanDir(a) {
    if (!a.length) return null;
    var x = 0, y = 0;
    a.forEach(function (d) { x += Math.sin(d * Math.PI / 180); y += Math.cos(d * Math.PI / 180); });
    return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
  }

  // The code that best describes a block of hours: anything wet or foggy
  // that lasts at least two hours wins over cloud cover; otherwise the
  // most common sky state.
  function dominantCode(codes) {
    var count = {};
    codes.forEach(function (c) { if (c != null) count[c] = (count[c] || 0) + 1; });
    var keys = Object.keys(count).map(Number);
    if (!keys.length) return null;
    var wet = keys.filter(function (c) { return c >= 45 && count[c] >= 2; });
    if (wet.length) return Math.max.apply(null, wet);
    return keys.sort(function (a, b) { return count[b] - count[a] || b - a; })[0];
  }

  function url() {
    return "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON +
      "&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m" +
      "&daily=sunrise,sunset&current=weather_code,is_day" +
      "&timezone=Europe%2FLondon&wind_speed_unit=mph&forecast_days=3&cacheburst=" + Date.now();
  }

  // Local-time strings from Open-Meteo ("2026-10-06T19:00") compare correctly
  // as strings, so we never have to fight Date's time-zone handling.
  function slice(h, from, to) {
    var out = [];
    for (var i = 0; i < h.time.length; i++) {
      if (h.time[i] >= from && h.time[i] < to) out.push(i);
    }
    return out;
  }

  function block(h, idx) {
    var pick = function (k) { return idx.map(function (i) { return h[k][i]; }).filter(function (v) { return v != null; }); };
    return {
      temps: pick("temperature_2m"),
      pop: max(pick("precipitation_probability")),
      code: dominantCode(pick("weather_code")),
      wind: mean(pick("wind_speed_10m")),
      gust: max(pick("wind_gusts_10m")),
      dir: meanDir(pick("wind_direction_10m"))
    };
  }

  function rainPhrase(pop) {
    if (pop == null) return "";
    if (pop >= 70) return "rain likely (" + round(pop) + "%)";
    if (pop >= 40) return round(pop) + "% chance of rain";
    if (pop >= 20) return "small chance of a shower";
    return "staying dry";
  }

  function windPhrase(b) {
    if (b.wind == null) return "";
    var w = windWord(b.wind);
    var s = w === "calm" ? "winds calm" : w + " " + compass(b.dir) + " winds";
    if (b.gust != null && b.gust >= 25 && b.gust > b.wind * 1.4) s += ", gusts to " + round(b.gust) + " mph";
    return s;
  }

  function describe(label, b, night) {
    if (b.code == null || !b.temps.length) return "";
    var sky = (night && NIGHT[b.code]) || WMO[b.code] || "unsettled";
    var t = night ? "low " + round(min(b.temps)) + "°C" : "high " + round(max(b.temps)) + "°C";
    var bits = [cap(sky), t];
    // if the sky word is already rain/showers/snow, just give the odds
    var snow = (b.code >= 71 && b.code <= 77) || b.code === 85 || b.code === 86;
    var r = b.code >= 51 && b.pop != null
      ? round(b.pop) + "% chance of " + (snow ? "snow" : "rain")
      : rainPhrase(b.pop);
    // "clear skies, staying dry" is redundant — only mention dry if the sky
    // itself might suggest otherwise
    if (r && !(r === "staying dry" && b.code <= 3)) bits.push(r);
    var w = windPhrase(b);
    if (w) bits.push(w);
    if (night && min(b.temps) <= 2) bits.push("risk of frost");
    return "<b>" + label + ":</b> " + bits.join(", ") + ".";
  }

  function build(j) {
    var h = j.hourly, d = j.daily;
    var now = new Date();
    // current local hour as an Open-Meteo-style string
    var nowStr = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", hour12: false
    }).format(now).replace(" ", "T") + ":00";

    var rise0 = d.sunrise[0], set0 = d.sunset[0];
    var rise1 = d.sunrise[1], set1 = d.sunset[1];
    var parts;

    if (nowStr < rise0) {
      // small hours: what's left of the night, then the day ahead
      parts = [
        describe("Tonight", block(h, slice(h, nowStr, rise0)), true),
        describe("Today", block(h, slice(h, rise0, set0)), false)
      ];
    } else if (nowStr < set0) {
      // daytime: rest of today, then tonight
      parts = [
        describe("Today", block(h, slice(h, nowStr, set0)), false),
        describe("Tonight", block(h, slice(h, set0, rise1)), true)
      ];
    } else {
      // evening: rest of tonight, then tomorrow
      parts = [
        describe("Tonight", block(h, slice(h, nowStr, rise1)), true),
        describe("Tomorrow", block(h, slice(h, rise1, set1)), false)
      ];
    }
    return parts.filter(Boolean).join(" &nbsp;");
  }

  function show(html) {
    var el = document.getElementById(TARGET);
    if (el) el.innerHTML = html;
  }

  function load() {
    fetch(url(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("Open-Meteo " + r.status); return r.json(); })
      .then(function (j) {
        var t = build(j); if (t) show(t);
        var ic = document.getElementById("fcicon");
        if (ic && j.current && j.current.weather_code != null) {
          ic.className = "wi " + iconClass(j.current.weather_code, j.current.is_day !== 0);
          ic.title = "Now: " + (WMO[j.current.weather_code] || "");
        }
      })
      .catch(function (e) { console.warn("Banner forecast unavailable:", e); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
  setInterval(load, REFRESH_MS);
})();
