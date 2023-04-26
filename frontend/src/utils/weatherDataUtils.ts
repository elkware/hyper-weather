export function formatWeatherData(data: any): any {
    let formattedData: any = {};
    for (let i = 0; i < data.length; i++) {
        let date = new Date(data[i].timestamp * 1000);
        let date_part = date.toISOString().split('T')[0];
        data[i].date = new Date(data[i].timestamp * 1000);
        if (formattedData[date_part] === undefined) {
            formattedData[date_part] = [];
        }
        data[i].symbol_text = symbolCodeToText(data[i].symbol_code);
        data[i].wind_from_direction = windDirection(data[i].wind_from_direction);
        formattedData[date_part].push(data[i])

    }
    return formattedData;
}

function windDirection(degrees: number) {
    let val = Math.floor((degrees / 22.5) + 0.5);
    let arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}

function symbolCodeToText(code: string): string {
    let symbolCode = code.split('_');
    let symbolText = symbolCode[0];
    switch (symbolText) {
        case "clearsky":
            return "Clear sky";
        case "cloudy":
            return "Cloudy";
        case "fair":
            return "Fair";
        case "fog":
            return "Fog";
        case "heavyrain":
            return "Heavy rain";
        case "heavyrainandthunder":
            return "Heavy rain and thunder";
        case "heavyrainshowers":
            return "Heavy rain showers";
        case "heavyrainshowersandthunder":
            return "Heavy rain showers and thunder";
        case "heavysleet":
            return "Heavy sleet";
        case "heavysleetandthunder":
            return "Heavy sleet and thunder";
        case "heavysleetshowers":
            return "Heavy sleet showers";
        case "heavysleetshowersandthunder":
            return "Heavy sleet showers and thunder";
        case "heavysnow":
            return "Heavy snow";
        case "heavysnowandthunder":
            return "Heavy snow and thunder";
        case "heavysnowshowers":
            return "Heavy snow showers";
        case "heavysnowshowersandthunder":
            return "Heavy snow showers and thunder";
        case "lightrain":
            return "Light rain";
        case "lightrainandthunder":
            return "Light rain and thunder";
        case "lightrainshowers":
            return "Light rain showers";
        case "lightrainshowersandthunder":
            return "Light rain showers and thunder";
        case "lightsleet":
            return "Light sleet";
        case "lightsleetandthunder":
            return "Light sleet and thunder";
        case "lightsleetshowers":
            return "Light sleet showers";
        case "lightsnow":
            return "Light snow";
        case "lightsnowandthunder":
            return "Light snow and thunder";
        case "lightsnowshowers":
            return "Light snow showers";
        case "lightssleetshowersandthunder":
            return "Light sleet showers and thunder";
        case "lightssnowshowersandthunder":
            return "Light snow showers and thunder";
        case "partlycloudy":
            return "Partly cloudy";
        case "rain":
            return "Rain";
        case "rainandthunder":
            return "Rain and thunder";
        case "rainshowers":
            return "Rain showers";
        case "rainshowersandthunder":
            return "Rain showers and thunder";
        case "sleet":
            return "Sleet";
        case "sleetandthunder":
            return "Sleet and thunder";
        case "sleetshowers":
            return "Sleet showers";
        case "sleetshowersandthunder":
            return "Sleet showers and thunder";
        case "snow":
            return "Snow";
        case "snowandthunder":
            return "Snow and thunder";
        case "snowshowers":
            return "Snow showers";
        case "snowshowersandthunder":
            return "Snow showers and thunder";
    }
    return symbolText;
}