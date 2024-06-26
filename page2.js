document.addEventListener('DOMContentLoaded', () => {
    const API_GEOLOCATION_URL = 'https://geocoding-api.open-meteo.com/v1/search';
    const API_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

    const cityForm = document.querySelector('#cityForm');
    const locationBtn = document.querySelector('#locationBtn');

    cityForm.addEventListener('submit', onCityFormSubmit);
    locationBtn.addEventListener('click', onLocationBtnClick);

    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let marker;

    function updateMap(lat, lon, popupText) {
        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker(L.latLng(lat, lon)).addTo(map)
            .bindPopup(popupText)
            .openPopup();
        map.setView([lat, lon], 13);
    }

    async function onCityFormSubmit(event) {
        event.preventDefault();

        //clearContent();

        const cityInput = cityForm.querySelector('#city');
        const cityName = cityInput.value.trim();

        if (!cityName) {
            alert("Please enter a city name.");
            return;
        }

        const cityCoordinates = await getCityCoordinates(cityName);
        if (cityCoordinates) {
            updateMap(cityCoordinates.lat, cityCoordinates.lon, `${cityName}`);
            // Fetch and display the weather for the city here
            //const weatherResponse = await getWeather(cityCoordinates.lat, cityCoordinates.lon);
            //const weatherData = parseApiData(weatherResponse);
            //displayWeather(cityName, weatherData);
        } else {
            alert(`Could not retrieve coordinates for ${cityName}`);
        }
    }

    function onLocationBtnClick() {
        //clearContent();

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                updateMap(lat, lon, 'Your current location');
                // Fetch and display the weather for the current location here
                //const weatherResponse = await getWeather(lat, lon);
                //const weatherData = parseApiData(weatherResponse);
                //displayWeather("your location", weatherData);
            }, () => {
                alert('Geolocation failed. Please try again.');
            });
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }

    async function getCityCoordinates(cityName) {
        const apiUrl = new URL(API_GEOLOCATION_URL);
        apiUrl.searchParams.append("name", cityName);
        apiUrl.searchParams.append("count", 1);

        const response = await fetch(apiUrl.toString());
        const data = await response.json();

        if (!data || !data.hasOwnProperty("results")) {
            return null;
        }

        const result = data.results[0];
        return { lat: result.latitude, lon: result.longitude };
    }

    async function getWeather(lat, lon) {
        const apiUrl = new URL(API_FORECAST_URL);
        apiUrl.searchParams.append("latitude", lat);
        apiUrl.searchParams.append("longitude", lon);
        apiUrl.searchParams.append("timezone", "auto");
        apiUrl.searchParams.append("hourly", "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m");

        const response = await fetch(apiUrl.toString());
        const data = await response.json();
        return data;
    }

    /*function parseApiData(data) {
        const numberOfItems = data.hourly.time.length;
        let currentWeather = null;
        const forecasts = [];

        const currentDatetime = new Date();

        for (let i = 0; i < numberOfItems; i++) {
            const itemDatetime = new Date(data.hourly.time[i]);

            const isToday = currentDatetime.toDateString() === itemDatetime.toDateString();

            const isCurrentHour = currentDatetime.getHours() === itemDatetime.getHours();

            if (isToday && isCurrentHour) {
                currentWeather = {
                    date: data.hourly.time[i],
                    temp: data.hourly.temperature_2m[i],
                    wind: data.hourly.wind_speed_10m[i],
                    humidity: data.hourly.relative_humidity_2m[i],
                    code: data.hourly.weather_code[i],
                };
            } else if (isCurrentHour) {
                forecasts.push({
                    date: data.hourly.time[i],
                    temp: data.hourly.temperature_2m[i],
                    wind: data.hourly.wind_speed_10m[i],
                    humidity: data.hourly.relative_humidity_2m[i],
                    code: data.hourly.weather_code[i],
                });
            }
        }

        return {
            current: currentWeather,
            forecasts: forecasts,
        };
    }

    function displayWeather(cityName, weather) {
        const pageContent = document.querySelector(".page1-content");

        pageContent.append(createTodayWeatherSection(cityName, weather.current));
        pageContent.append(createForecastWeatherSection(cityName, weather.forecasts));
    }

    function createTodayWeatherSection(cityName, currentWeather) {
        const todaySection = document.createElement('div');

        const title = document.createElement('h2');
        title.innerText = `Weather in ${cityName} today`;

        todaySection.append(title);

        const weatherPanel = createWeatherPanel(currentWeather, true);
        todaySection.append(weatherPanel);
        return todaySection;
    }

    function createForecastWeatherSection(cityName, forecasts) {
        const forecastSection = document.createElement('div');

        const title = document.createElement('h2');
        title.innerText = `Weather in ${cityName} for the next days`;
        forecastSection.append(title);

        const weatherItems = document.createElement("div");
        weatherItems.classList.add("weather-items");
        forecastSection.append(weatherItems);

        for (let i = 0; i < forecasts.length; i++) {
            const weatherPanel = createWeatherPanel(forecasts[i], false);
            weatherItems.append(weatherPanel);
        }

        return forecastSection;
    }

    function createWeatherPanel(weather, isToday) {
        const weatherPanel = document.createElement("div");
        const panelClass = isToday ? "today" : "forecast";

        weatherPanel.classList.add("weather-panel", panelClass);

        const weatherDetails = document.createElement("div");
        weatherDetails.classList.add("weather-details");
        weatherPanel.append(weatherDetails);

        const currentHour = new Date().getHours();
        const isNight = currentHour >= 20 || currentHour <= 6;

        const weatherIcon = getIcon(weather.code, isNight);

        const imageContainer = document.createElement("div");
        const icon = document.createElement("img");
        icon.src = weatherIcon;

        imageContainer.append(icon);
        weatherPanel.append(imageContainer);

        const date = document.createElement("p");
        date.classList.add("date");
        date.innerText = weather.date.replace("T", ", ");

        const temp = document.createElement("p");
        temp.innerText = `Temperature: ${weather.temp}°C`;

        const wind = document.createElement("p");
        wind.innerText = `Wind: ${weather.wind}km/h`;

        const humidity = document.createElement("p");
        humidity.innerText = `Humidity: ${weather.humidity}%`;

        weatherDetails.append(date, temp, wind, humidity);

        return weatherPanel;
    }

    function getIcon(code, isNight) {
        switch (code) {
            case 0:
                return isNight ? 'weather_icons/night.svg' : 'weather_icons/sunny.svg';
            case 1:
            case 2:
            case 3:
                return isNight
                    ? 'weather_icons/cloudy-night.svg'
                    : 'weather_icons/cloudy-day.svg';
            case 45:
            case 48:
            case 51:
            case 53:
            case 55:
            case 56:
            case 57:
                return 'weather_icons/cloudy.svg';
            case 61:
            case 63:
            case 65:
            case 66:
            case 67:
            case 80:
            case 81:
            case 82:
                return 'weather_icons/rainy.svg';
            case 71:
            case 73:
            case 75:
            case 77:
            case 85:
            case 86:
                return 'weather_icons/snowy.svg';
            case 95:
            case 96:
            case 99:
                return 'weather_icons/thunder.svg';
            default:
                return isNight ? 'weather_icons/night.svg' : 'weather_icons/sunny.svg';
        }
    }

    function clearContent() {
        const pageContent = document.querySelector('.page1-content');
        if (pageContent) {
            pageContent.innerHTML = "";
        } else {
            console.error("Element with class 'page1-content' not found.");
        }
    }*/
});