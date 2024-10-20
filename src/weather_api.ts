import axios from "axios"

const apiKey = "API-NØGLE";
const apiUrl = 'https://dmigw.govcloud.dk/v2/metObs/collections/observation/items?';
const station = '06156'
const url = apiUrl + 'stationId=' + station + '&api-key=' + apiKey;

const TypeOut = ["temp_dew", "temp_dry", "visib_mean_last10min", "pressure_at_sea", "wind_dir", "wind_speed", "wind_max", "cloud_cover", "cloud_height"];
const OutText = ["Temp våd", "Temp tør", "visibility", "QNH", "Vind retning", "Vind hastighed", "Gust", "Sky dækning", "Sky højde"];
const OutUnit = ["°C", "°C", "m", "hPa", "°", "m/s", "m/s", "%", "m"];
const OutVal = [];


export async function getMetar() {
    const result = await axios.get(apiUrl, {
        params: {
            "api-key": apiKey,
            "stationId": station,
        }
    })

    if (result.data) {

        return getMetarString(result.data);
    } else {
        return false;
    }
}


function getMetarString(data) {
    let metar = "EKHK METAR ";
    const OBSTime = data.features[0].properties.observed;
    metar += `${OBSTime.slice(8, 10)}${OBSTime.slice(11, 13)}${OBSTime.slice(14, 16)}Z `;

    // Extract values for parameters using array methods
    TypeOut.forEach((type, i) => {
        const feature = data.features.find(f => f.properties.parameterId === type);
        OutVal[i] = feature?.properties.value || 0;

    });

    // Add wind direction
    const windDirection = String(10 * Math.round(OutVal[4] / 10)).padStart(3, '0');
    metar += windDirection;

    // Add wind speed and gust
    const windSpeed = Math.round(OutVal[5] * 1.94384);
    const windGust = Math.round(OutVal[6] * 1.94384);
    metar += `${String(windSpeed).padStart(2, '0')}`;
    if (windGust - windSpeed > 10) {
        metar += `G${windGust}`;
    }
    metar += "KT ";

    // Add cloud coverage
    const cloudCoverage = OutVal[7] <= 10 ? "SKC" :
        OutVal[7] <= 25 ? "FEW" :
            OutVal[7] <= 50 ? "SCT" :
                OutVal[7] <= 90 ? "BKN" : "OVC";
    metar += cloudCoverage;

    // Add cloud height if not clear sky
    if (cloudCoverage !== "SKC" && OutVal[8] > 15) {
        const cloudHeight = String(Math.round(OutVal[8] * 3.28084 / 100)).padStart(3, '0');
        metar += cloudHeight;
    }

    // Add visibility
    metar += OutVal[2] > 9999 ? "9999 " :
        `${String(Math.round(OutVal[2] / 100)).padStart(2, '0')}00 `;

    // Add temperature and QNH
    metar += `${Math.round(OutVal[1])}/${Math.round(OutVal[0])} Q${Math.round(OutVal[3])} `;

    // Calculate runway in use
    let runway = "R";
    let AV = OutVal[4] > 10 && OutVal[4] < 190 ? OutVal[4] - 100 : OutVal[4] >= 190 ? OutVal[4] - 280 : OutVal[4] + 80;
    runway += OutVal[4] > 10 && OutVal[4] < 190 ? "10" : "28";

    // Calculate headwind and crosswind
    const AVraD = AV * Math.PI / 180;
    const headwind = Math.abs(Math.round(Math.cos(AVraD) * windSpeed));
    const crosswind = Math.abs(Math.round(Math.sin(AVraD) * windSpeed));
    runway += ` HW${String(headwind).padStart(2, '0')} XW${String(crosswind).padStart(2, '0')} ${AV < 0 ? "→" : "←"}`;

    // Append the runway info to METAR
    metar += runway;


    return { metar: metar, raw: data.features[0] }

}






