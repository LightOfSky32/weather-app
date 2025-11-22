// initialize api keys and url

const apiKey = "5a8596d5a5df1f8a7e4a3cc359adc248";
const baseUrl = "https://api.openweathermap.org/data/2.5/weather?";

const searchBar = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");
const loadingMessage = document.getElementById("loading-screen");
const cityName = document.querySelector(".city-name");
const temprature = document.querySelector(".temp");
const date = document.getElementById("date");
const timeElement = document.getElementById("local-time");
const description = document.querySelector(".description");
const icon = document.querySelector(".weather-icon");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const weatherFeel = document.getElementById("feels-like");
document.getElementById("unit-toggle").addEventListener("click", toggleUnits);
let isCelsius = true;
let errorTimeout;

//async function to get weather data
async function getWeatherData(city) {
    try{
        const units = isCelsius ? "metric" : "imperial";
        const response = await fetch(`${baseUrl}q=${city}&appid=${apiKey}&units=${units}`);

    if (!response.ok) {
            if(response.status === 404){
                throw new Error("City not found. Please try again.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log(data); 
        return data; 
    } catch (error) {
        console.error("Could not fetch weather data:", error.message);
        clearWeatherDisplay();
        cityName.textContent = error.message;
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(async () =>{
            const lastCity = localStorage.getItem("lastCity");
            if (lastCity) {
                const lastData = await getWeatherData(lastCity);
                if (lastData) displayWeatherData(lastData);
            } else{
                cityName.textContent = "Please enter a valid city to check the weather";
            }
        }, 3000);

    }
}
//async function to get geo co-ords
async function getCoordsAndWeather(){
    const coords = await new Promise((resolve, reject) => {
        if (!navigator.geolocation){
            reject(new Error("Geolocation not supported by browser"))
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject (error);
            }
        );
    });

    const apiURL = `${baseUrl}lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric`;

    try{
        const response = await fetch(apiURL);
        if (!response.ok){
           throw new Error (`HTTP error fetching coordinates weather! status: ${response.status}`);
        }

        const coordsData = await response.json();
        return coordsData;
    } catch (error){
        console.error("Could not fetch weather data by coordinates:", error.message);
        //throw error so catch block of initializeApp func can catch it
        throw error;
    }
}

function clearWeatherDisplay() {
    cityName.textContent = "";
    temprature.textContent = "";
    description.textContent = "";
    icon.src = "";
    icon.alt = "";
    humidity.textContent = "";
    wind.textContent = "";
    weatherFeel.textContent = "";
}

function displayWeatherData(data){
    if (!data || !data.main || !data.weather || data.weather.length === 0) {
        console.error("Invalid weather data received.");
        cityName.textContent = "City not found.";
        temprature.textContent = "";
        description.textContent = "";
        icon.src = "";
        return;
    }

    const temp = Math.round(data.main.temp);
    const weatherDescription = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const timeZoneOffset = data.timezone
    const utc_milliseconds = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const city_time_milliseconds = utc_milliseconds + timeZoneOffset * 1000;
    const city_date = new Date(city_time_milliseconds);
    const formattedTime = city_date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = city_date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    const tempUnit = isCelsius ? "°C" : "°F";
    cityName.textContent = data.name;
    date.textContent = formattedDate; 
    timeElement.textContent = formattedTime; 
    temprature.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
    description.textContent = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);
    icon.src = iconUrl;
    icon.alt = weatherDescription;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    wind.textContent = `Wind Speed: ${Math.round(data.wind.speed)}  ${isCelsius ? "m/s" : "mph"}`;
    weatherFeel.textContent = `Feels Like: ${Math.round(data.main.feels_like)}${tempUnit}`;
}

async function initializeApp() {
    const lastCity = localStorage.getItem("lastCity");

    if (lastCity){
        const data = await getWeatherData(lastCity);
        if (data){
            displayWeatherData(data);
        }
    } else{
        clearWeatherDisplay();
        try{
            const data = await getCoordsAndWeather();

            if (data){
                displayWeatherData(data);
                localStorage.setItem("lastCity", data.name);
            }
        } catch (error){
            console.error("Geolocation failed or user denied permission:", error.message);
            cityName.textContent = "Welcome! please a city to check the weather.";
        }
    } 
}



async function searchHandler() {
    const input = searchBar.value.trim();

    if (input === "" ) {
        return;
    }

    try{
        loadingMessage.classList.remove("hidden");
        loadingMessage.classList.add("loading");

        const response = await getWeatherData(input);
   
        if (response) {
        displayWeatherData(response);
        localStorage.setItem("lastCity", response.name);
       };
    }  catch (error) {
        console.error("Search failed:", error.message);
        cityName.textContent = "Unable to fetch weather for that city.";
    }finally{
        loadingMessage.classList.remove("loading");
        loadingMessage.classList.add("hidden");

    }
}

function toggleUnits() {
  isCelsius = !isCelsius;
  const currentCity = localStorage.getItem("lastCity");
  if (currentCity) getWeatherData(currentCity).then(displayWeatherData);
}

searchButton.addEventListener("click", (e) => {
    e.preventDefault();
    searchHandler();
});


initializeApp();