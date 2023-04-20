import Head from "next/head";
import Image from "next/image";
import { useState, useEffect, Key, SetStateAction, useRef } from "react";
import { formatWeatherData } from "../utils/weather_data_utils";
import styles from '../styles/Weather.module.css'


const WETTR_API_URL = "https://api.wettr.xyz"

function CustomPopup({ popupClose, popupTitle, popupShow, popupChildern }: { popupClose: Function, popupTitle: string, popupShow: boolean, popupChildern: any }) {
    const [show, setShow] = useState(false);

    const closeHandler = (e: any) => {
        setShow(false);
        popupClose(false);
    };

    useEffect(() => {
        setShow(popupShow);
    }, [popupShow]);

    return (
        <div
            style={{
                visibility: show ? "visible" : "hidden",
                opacity: show ? "1" : "0"
            }}
            className={styles.overlay}
        >
            <div className={styles.popup}>
                <h2>{popupTitle}</h2>
                <span className={styles.close} onClick={closeHandler}>
                    &times;
                </span>
                <div className={styles.content}>{popupChildern}</div>
            </div>
        </div>
    );
};


function PlayAndVisualizeAudio({ audioUrl }: { audioUrl: string }) {
    const canvasRef = useRef<any>();
    const audioRef = useRef<any>();
    const source = useRef<any>();
    const analyzer = useRef<any>();


    const handleAudioPlay = () => {
        let audioContext = new AudioContext();
        if (!source.current) {
            source.current = audioContext.createMediaElementSource(audioRef.current);
            analyzer.current = audioContext.createAnalyser();
            source.current.connect(analyzer.current);
            analyzer.current.connect(audioContext.destination);
        }
        visualizeData();
    };

    const visualizeData = () => {
        const animationController = window.requestAnimationFrame(visualizeData);
        if (audioRef.current.paused) {
            return cancelAnimationFrame(animationController);
        }
        const songData = new Uint8Array(140);
        analyzer.current.getByteFrequencyData(songData);
        const bar_width = 2;
        let start = 0;
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        for (let i = 0; i < songData.length; i++) {
            start = i * 3;
            let gradient = ctx.createLinearGradient(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
            gradient.addColorStop(0.2, "#2392f5");
            gradient.addColorStop(0.5, "#fe0095");
            gradient.addColorStop(1.0, "purple");
            ctx.fillStyle = gradient;
            ctx.fillRect(start, canvasRef.current.height, bar_width, -songData[i]);
        }
    };

    return (
        <div className={styles.audioPlayer}>
            {
                <audio
                    ref={audioRef}
                    onPlay={handleAudioPlay}
                    src={audioUrl}
                    controls
                    crossOrigin="anonymous"
                />
            }
            <canvas ref={canvasRef} className={styles.fftCanvas} />
        </div>
    );
}



function Weather({ weather, todaySummary }: { weather: any, todaySummary: any }) {
    const todayData = weather[Object.keys(weather)[0]];
    if (todayData === undefined) {
        return (<div>Loading...</div>
        )
    }

    const plus1DayData = weather[Object.keys(weather)[1]];
    const plus2DayData = weather[Object.keys(weather)[2]];
    const otherDaysData: any = {}
    for (let i = 3; i < Object.keys(weather).length; i++) {
        otherDaysData[Object.keys(weather)[i]] = weather[Object.keys(weather)[i]];
    }

    const todayForecast = () => {
        let wd: any = [];
        for (let i = 1; i < todayData.length; i++) {
            wd.push(todayData[i])
        }
        return wd;
    }

    const getDayOfWeek = (date: Date) => {
        var dayOfWeek = new Date(date).getDay();
        return isNaN(dayOfWeek) ? null :
            ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    }

    return (
        <>
            <div className={styles.cardholder}>
                <div className={styles.current}>
                    <h1>Current conditions</h1>
                    <div className={styles.currentConditions}>
                        <p><Image src={"/" + todayData[0].symbol_code + ".svg"} alt="" width={42} height={42} />&nbsp;{todayData[0].symbol_text}</p>
                        <p><span className="material-symbols-outlined">thermometer</span>{todayData[0].air_temperature} °C</p>
                        <p><span className="material-symbols-outlined">humidity_percentage</span> {todayData[0].relative_humidity} %</p>
                        <p><span className="material-symbols-outlined">air</span> {todayData[0].wind_speed} m/s {todayData[0].wind_from_direction}</p>
                        <p><span className="material-symbols-outlined">umbrella</span> {todayData[0].precipitation_amount} mm</p>
                        <p><span className="material-symbols-outlined">cloud</span> {todayData[0].cloud_area_fraction} %</p>
                        <p><span className="material-symbols-outlined">speed</span> {todayData[0].air_pressure_at_sea_level} hPa</p>
                    </div>
                    {todayForecast().length !== 0 && <span>Rest of the day</span>}
                    <div className={styles.currentForecast}>
                        {todayForecast().map((data: { date: Date, symbol_code: string, relative_humidity: number, air_temperature: number }, index: number) => (
                            <span key={index}>
                                <p>
                                    <span className="material-symbols-outlined">schedule</span>{data.date.getHours()}:00<br />
                                    <span className="material-symbols-outlined">humidity_percentage</span>{data.relative_humidity}%<br />
                                    <Image src={"/" + data.symbol_code + ".svg"} alt="" width={18} height={18} /> {data.air_temperature}°C
                                </p>
                            </span>
                        ))}
                    </div>
                    {todaySummary.report && <div className={styles.todaySummary}><p>Report for {todaySummary.date}:<br />{todaySummary.report}</p>{todaySummary.report_tts_url && <PlayAndVisualizeAudio audioUrl={todaySummary.report_tts_url} />}</div>}

                </div>

                <div className={styles.current}>
                    <h1>Tomorrow</h1>
                    <div className={styles.currentForecast}>
                        {plus1DayData.map((data: { date: Date, symbol_code: string, relative_humidity: number, air_temperature: number }, index: number) => (
                            <span key={index}>
                                <p>
                                    <span className="material-symbols-outlined">schedule</span>{data.date.getHours()}:00<br />
                                    <span className="material-symbols-outlined">humidity_percentage</span>{data.relative_humidity}%<br />
                                    <Image src={"/" + data.symbol_code + ".svg"} alt="" width={18} height={18} /> {data.air_temperature}°C
                                </p>
                            </span>
                        ))}
                    </div>
                </div>
                <div className={styles.current}>
                    <h1>Day after tomorrow</h1>
                    <div className={styles.currentForecast}>
                        {plus2DayData.map((data: { date: Date, symbol_code: string, relative_humidity: number, air_temperature: number }, index: number) => (
                            <span key={index}>
                                <p>
                                    <span className="material-symbols-outlined">schedule</span>{data.date.getHours()}:00<br />
                                    <span className="material-symbols-outlined">humidity_percentage</span>{data.relative_humidity}%<br />
                                    <Image src={"/" + data.symbol_code + ".svg"} alt="" width={18} height={18} /> {data.air_temperature}°C
                                </p>
                            </span>
                        ))}
                    </div>
                </div>
                <div className={styles.current}>
                    <h1>Rest</h1>
                    {Object.entries(otherDaysData).map(([key, value]: [string, Object | any]) => (

                        <div key={key}>
                            <div className={styles.restOfTheWeek}>{getDayOfWeek(new Date(key))}</div>
                            <div className={styles.longtermForecast}>
                                {value[0] && <p>dawn<br /><Image src={"/" + value[0].symbol_code + ".svg"} alt="" width={18} height={18} /> {value[0].air_temperature + "°C"}</p>}
                                {value[1] && <p>morning<br /><Image src={"/" + value[1].symbol_code + ".svg"} alt="" width={18} height={18} /> {value[1].air_temperature + "°C"}</p>}
                                {value[2] && <p>afternoon<br /><Image src={"/" + value[2].symbol_code + ".svg"} alt="" width={18} height={18} /> {value[2].air_temperature + "°C"}</p>}
                                {value[3] && <p>dusk<br /><Image src={"/" + value[3].symbol_code + ".svg"} alt="" width={18} height={18} /> {value[3].air_temperature + "°C"}</p>}
                            </div></div>
                    ))}
                </div>

            </div>
        </>
    )
}


function CitySelect() {

    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState("default");
    const [selectedCityData, setSelectedCityData] = useState([]);
    const [todaySummary, setTodaySummary] = useState([]);

    useEffect(() => {
        fetch(WETTR_API_URL + "/locations")
            .then((res) => res.json())
            .then((data) => {
                setCities(data);
            });
    }, []);

    function handleCityChange(e: { target: { value: SetStateAction<string>; }; }) {
        setSelectedCity(e.target.value);
        if (e.target.value !== "default") {
            fetch(WETTR_API_URL + "/forecast?from_current_timestamp=true&location=" + e.target.value)
                .then((res) => res.json())
                .then((data) => {
                    setSelectedCityData(formatWeatherData(data));
                });
            fetch(WETTR_API_URL + "/summary?date=" + new Date().toISOString().split('T')[0] + "&location=" + e.target.value)
                .then((res) => res.json())
                .then((data) => {
                    setTodaySummary(data);
                });
        }
    }

    return (
        <>
            <select onChange={handleCityChange}>
                <option key="-1" value="default">Select a city</option>
                {cities.map((city: { name: string, country: string }, index: Key) => (
                    <option key={index} value={(city.name + " " + city.country).toLowerCase().replaceAll(" ", "_")}>
                        {city.name}, {city.country}
                    </option>
                ))}
            </select>
            {selectedCity !== "default" && <Weather weather={selectedCityData} todaySummary={todaySummary} />}
        </>
    )
}

function Navs() {
    const [visibility, setVisibility] = useState(false);

    const popupCloseHandler = (e: any) => {
        setVisibility(e);
    };
    return (
        <>
            <div>
                <nav>
                    <ul>
                        <li><Image src={"/favicon.ico"} alt="" width={30} height={30} /><strong> Wettr</strong></li>
                    </ul>
                    <ul>
                        <li>
                            <a href="#" onClick={() => setVisibility(!visibility)}>About</a>
                        </li>
                    </ul>

                </nav>
                <CustomPopup
                    popupClose={popupCloseHandler}
                    popupShow={visibility}
                    popupTitle="About Wettr"
                    popupChildern={
                        <div>
                            <p>Demo app to demostrate various services and features of AWS. The weather data comes from Norwegian Meteorological Institute and the daily summaries are generated using OpenAI.</p>
                            <p>The frontend is hosted on S3 and uses CloudFront as a CDN.</p>
                            <p>API Gateway and Lambda is used to expose the API to the internet.</p>
                            <p>Route 53 is used to route the domain name to the frontend and backend.</p>
                            <p>CloudWatch is used to monitor the health of the API.</p>
                            <p>Dynammo DB is used to store the forecast data.</p>
                            <p>Polly is uesed to voice the weather summary text.</p>
                            <p>The frontend is written in TypeScript and uses React, Next.js and PicoCSS. The backend is written in Python. The code can be found on <a href="https://github.com/elkware/wettr.xyz" target="_blank">github</a>.</p>
                            <p></p>
                        </div>
                    }
                />
            </div>

        </>
    )
}

export default function Main() {
    return (
        <>
            <Head>
                <title>Wettr</title>
            </Head>
            <main className="container">
                <Navs />
                <CitySelect />
            </main>
        </>
    )
}