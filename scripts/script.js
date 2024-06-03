const API_GEOLOCATION_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const API_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const cityForm = document.querySelector('#cityForm');
const locationBtn = document.querySelector('#locationBtn');

cityForm.addEventListener('submit', onCityFormSubmit);
locationBtn.addEventListener('click', onLocationBtnClick);
   
async function onCityFormSubmit(event){
    event.preventDefault();

    clearContent();

    const cityImput = cityForm.querySelector('#city');
    const cityName = cityImput.value.trim();

    if(!cityName){
        alert("Introduceti numele unui oras");
        return;
    }//else{
      //  window.location.href = `./page1.html?city=${encodeURIComponent(cityName)}`;
   // }

    const cityCoordinates = await getCityCoordinates(cityName);
    
    if(cityCoordinates === null){
        alert(`Nu s-au putut prelua coordonatele orasului ${cityname}`);
        return;
    }

    const weatherResponse = await getWeather(cityCoordinates.lat, cityCoordinates.long);

    const weatherData = parseApiData(weatherResponse);
    console.log(weatherData);

    displayWeather(cityName, weatherData);
}

function onLocationBtnClick(){
    clearContent();

    if("geolocation" in navigator){
        navigator.geolocation.getCurrentPosition(async (position) => {
        
            try{
                const weatherResponse = await getWeather(
                    position.coords.latitude, 
                    position.coords.longitude
                );

                const weatherData = parseApiData(weatherResponse);
                console.log(weatherData);
        
                displayWeather("locatia ta", weatherData);
            } catch (error){
                displayError(`A aparut o eroare ${error}`);
            }
        })
    } else{
        displayError("API-ul pentru geolocatie nu este disponibil");
    }
}

async function getCityCoordinates(cityName){
    const apiUrl = new URL(API_GEOLOCATION_URL);
    apiUrl.searchParams.append("name", cityName);
    apiUrl.searchParams.append("count", 1);
    
    console.log(apiUrl.toString());

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    if(!data || !data.hasOwnProperty("results")){
        return null;
    }

    const result = data.results[0];
    return {lat: result.latitude, long: result.longitude};
}


async function getWeather(lat, long){
    const apiUrl = new URL(API_FORECAST_URL);
    apiUrl.searchParams.append("latitude", lat);
    apiUrl.searchParams.append("longitude", long);
    apiUrl.searchParams.append("timezone", "auto");
    apiUrl.searchParams.append("hourly", "temperature_2m,precipitation_probability,relative_humidity_2m,weather_code,wind_speed_10m");

    console.log(apiUrl.toString());

    const response = await fetch(apiUrl.toString());
    const data = await response.json();
    return data;
}

function parseApiData(data){
    const numberOfItems = data.hourly.time.length;
    let currentWeather = [];
    const forecasts =[];

    const currentDatetime = new Date();

    for(let i = 0; i < numberOfItems; i++){
        const itemDatetime = new Date(data.hourly.time[i]);

        const isToday = currentDatetime.toDateString() === itemDatetime.toDateString();

        const isCurrentHour = currentDatetime.getHours() === itemDatetime.getHours();

        if(isToday){
            currentWeather.push({
                date: data.hourly.time[i],
                temp: data.hourly.temperature_2m[i],
                precipitation_probability: data.hourly.precipitation_probability[i],
                wind: data.hourly.wind_speed_10m[i],
                humidity: data.hourly.relative_humidity_2m[i],
                code: data.hourly.weather_code[i],
            });
        }else if(isCurrentHour){
            forecasts.push({
                date: data.hourly.time[i],
                temp: data.hourly.temperature_2m[i],
                precipitation_probability: data.hourly.precipitation_probability[i],
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

function displayWeather(cityName, weather){
    clearContent();
    
    const pageContent = document.querySelector(".page1-content");

    pageContent.append(createTodayWeatherSection(cityName, weather.current));
    pageContent.append(createForecastWeatherSection(cityName, weather.forecasts));

    const todaySection = createTodayWeatherSection(cityName, weather.current);
    pageContent.append(todaySection);

    const forecastSection = createForecastWeatherSection(cityName, weather.forecasts);
    pageContent.append(forecastSection);

    displayTemperatureChart(weather.current);
}

function displayTemperatureChart(currentWeather) {
    const canvas = document.getElementById('temperatureChart');

    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    const labels = currentWeather.map(weather => {
        const date = new Date(weather.date);
        return `${date.getHours()}:00`;
    });

    const temperatures = currentWeather.map(weather => weather.temp);

    new Chart(ctx, {
        type: 'line', // poți schimba 'line' cu 'bar' pentru grafic de tip bar
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperatura (°C)',
                data: temperatures,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createTodayWeatherSection(cityName, currentWeather){
    const todaySection = document.createElement('div');

    const title = document.createElement('h2');
    title.innerText = `Vremea in ${cityName} astazi`;

    todaySection.append(title);

    //const weatherPanel = createWeatherPanel(currentWeather, true);
    //todaySection.append(weatherPanel);

    // Verifică dacă există date pentru ora curentă
    const currentHourData = currentWeather.find(weather => {
        const date = new Date(weather.date);
        return date.getHours() === new Date().getHours();
    });

    if (currentHourData) {
        const weatherPanel = createWeatherPanel(currentHourData, true);
        todaySection.append(weatherPanel);
    } else {
        const noDataMessage = document.createElement('p');
        noDataMessage.innerText = "Nu sunt disponibile date pentru ora curentă.";
        todaySection.append(noDataMessage);
    }

    // Adaugă elementul canvas pentru grafic
    const canvas = document.createElement('canvas');
    canvas.id = 'temperatureChart';
    canvas.width = 400;
    canvas.height = 200;
    todaySection.append(canvas);

    return todaySection;
}

function createForecastWeatherSection(cityName, forecasts){
    const forecastSection = document.createElement('div');

    const title = document.createElement('h2');
    title.innerText = `Vremea in ${cityName} in urmatoarele zile`;
    forecastSection.append(title);

    const weatherItems = document.createElement("div");
    weatherItems.classList.add("weather-items");
    forecastSection.append(weatherItems);

    for(let i = 0; i < forecasts.length; i++){
        const weatherPanel = createWeatherPanel(forecasts[i], false);
        weatherItems.append(weatherPanel);
    }

    return forecastSection;

}

function createWeatherPanel(weather, isToday){
    const weatherPanel = document.createElement("div");
    const panelClass = isToday ? "today" : "forecast";

    weatherPanel.classList.add("weather-panel", panelClass);

    const weatherDetails = document.createElement("div");
    weatherDetails.classList.add("weather-details");
    weatherPanel.append(weatherDetails);

    const currentHour = new Date().getHours();
    const isNight = currentHour >= 20 || currentHour <=6;

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
    temp.innerText = `Temperatura: ${weather.temp}°C`;

    const precipitation_probability = document.createElement("p");
    precipitation_probability.innerText = `Probabilitate precipitatii: ${weather.precipitation_probability}%`;

    const wind = document.createElement("p");
    wind.innerText = `Vant: ${weather.wind}km/h`;

    const humidity = document.createElement("p");
    humidity.innerText = `Umiditate: ${weather.humidity}%`;

    weatherDetails.append(date, temp, precipitation_probability, wind, humidity);

    return weatherPanel;
}

function getIcon(code, isNight){
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

function clearContent(){
    const pageContent = document.querySelector('.page1-content');
    pageContent.innerHTML = "";
}