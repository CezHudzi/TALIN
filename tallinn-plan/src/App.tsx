import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

/* =========================================================
   TYPES
========================================================= */

type Kind = "museum" | "food" | "sight" | "logistics";

type Stop = {
  id: string;
  time: string;
  title: string;
  note: string;
  kind?: Kind;
  lat?: number;
  lng?: number;
};

type Day = {
  id: string;
  label: string;
  date: string;
  title: string;
  distance: string;
  transport: string;
  stops: Stop[];
};

type Comment = {
  id: number;
  stop_id: string;
  author: string;
  comment: string;
  created_at: string;
};

/* =========================================================
   THEME
========================================================= */

const theme = {
  primary: "#18181b",
  secondary: "#52525b",
  tertiary: "#71717a",
  blue: "#2563eb",
  border: "#e4e4e7",
  background: "#ffffff",
  soft: "#f4f4f5",
};

/* =========================================================
   PLAN
========================================================= */

const days: Day[] = [
  {
    id: "fri",
    label: "Piątek",
    date: "4 września",
    title: "Średniowieczny Tallinn",
    distance: "7–9 km pieszo",
    transport:
      "Lotnisko → Telliskivi: Bolt 15–20 min lub tramwaj T2 do Balti jaam",
    stops: [
      {
        id: "fri-airport",
        time: "08:55",
        title: "Lądowanie w Tallinnie",
        note:
          "Czas lokalny jest o godzinę do przodu względem Polski. Dla 4 osób z bagażem najwygodniejszy będzie Bolt.",
        kind: "logistics",
        lat: 59.4133,
        lng: 24.8328,
      },
      {
        id: "fri-breakfast",
        time: "10:00",
        title: "Bagaże i późne śniadanie",
        note:
          "Zostawcie bagaże przy Telliskivi 26. Balti Jaama Turg jest kilka minut pieszo i ma dużo szybkich opcji jedzenia.",
        kind: "food",
        lat: 59.4407,
        lng: 24.7352,
      },
      {
        id: "fri-toompea",
        time: "11:15",
        title: "Toompea i najlepsze panoramy",
        note:
          "Patkuli → Kohtuotsa → zamek Toompea z zewnątrz → sobór Aleksandra Newskiego → Ogród Króla Duńskiego.",
        kind: "sight",
        lat: 59.4366,
        lng: 24.7386,
      },
      {
        id: "fri-kiek",
        time: "12:15",
        title: "Kiek in de Kök i tunele bastionowe",
        note:
          "Najlepsze muzeum na połączenie zabytków z historią miasta. Zarezerwujcie około 2 godzin; w tunelach jest 10–12°C.",
        kind: "museum",
        lat: 59.4348,
        lng: 24.7412,
      },
      {
        id: "fri-oldtown",
        time: "14:30",
        title: "Dolne Stare Miasto",
        note:
          "Niguliste z zewnątrz → Plac Ratuszowy → Raeapteek → Pasaż św. Katarzyny → brama Viru → ulica Pikk i baszta Gruba Małgorzata.",
        kind: "sight",
        lat: 59.437,
        lng: 24.7453,
      },
      {
        id: "fri-rataskaevu",
        time: "18:00",
        title: "Kolacja: Rataskaevu 16",
        note:
          "Bardzo popularna restauracja w Starym Mieście. Rezerwacja dla 4 osób jest mocno wskazana.",
        kind: "food",
        lat: 59.437,
        lng: 24.742,
      },
      {
        id: "fri-fotografiska",
        time: "20:15",
        title: "Fotografiska Night Shift",
        note:
          "W piątki muzeum działa do północy. Jest 5 minut od noclegu; opcjonalnie drink na dachu.",
        kind: "museum",
        lat: 59.4393,
        lng: 24.7298,
      },
    ],
  },

  {
    id: "sat",
    label: "Sobota",
    date: "5 września",
    title: "Kadriorg, sztuka i nowoczesne centrum",
    distance: "5–7 km pieszo",
    transport:
      "Telliskivi → Kadriorg: tramwaj lub Bolt; powrót przez Rotermann",
    stops: [
      {
        id: "sat-breakfast",
        time: "09:00",
        title: "Śniadanie w okolicy Telliskivi",
        note: "Zjedzcie blisko noclegu i ruszcie około 09:30.",
        kind: "food",
        lat: 59.4393,
        lng: 24.7298,
      },
      {
        id: "sat-kumu",
        time: "10:00",
        title: "Kumu Art Museum",
        note:
          "Najważniejsze muzeum sztuki Estonii. Zaplanujcie 2–2,5 godziny.",
        kind: "museum",
        lat: 59.4363,
        lng: 24.7964,
      },
      {
        id: "sat-kadriorg",
        time: "12:45",
        title: "Pałac i park Kadriorg",
        note:
          "Barokowy pałac, ogród kwiatowy, Staw Łabędzi i rezydencja prezydencka z zewnątrz.",
        kind: "sight",
        lat: 59.4385,
        lng: 24.7908,
      },
      {
        id: "sat-lunch",
        time: "14:15",
        title: "Lunch w Kadriorgu",
        note:
          "Wybierzcie spokojną kawiarnię lub restaurację w dzielnicy.",
        kind: "food",
        lat: 59.4392,
        lng: 24.789,
      },
      {
        id: "sat-russalka",
        time: "15:30",
        title: "Russalka i nadmorska promenada",
        note: "Krótki spacer do pomnika Russalka.",
        kind: "sight",
        lat: 59.4433,
        lng: 24.7935,
      },
      {
        id: "sat-rotermann",
        time: "17:00",
        title: "Rotermann Quarter",
        note:
          "Dawne zabudowania przemysłowe połączone ze współczesną architekturą.",
        kind: "sight",
        lat: 59.4385,
        lng: 24.7558,
      },
      {
        id: "sat-rado",
        time: "19:00",
        title: "Kolacja: RADO",
        note:
          "Nowoczesna kuchnia, menu zmieniane codziennie. Koniecznie rezerwacja.",
        kind: "food",
        lat: 59.438,
        lng: 24.748,
      },
    ],
  },

  {
    id: "sun",
    label: "Niedziela",
    date: "6 września",
    title: "Kalamaja, port i historia morska",
    distance: "6–8 km pieszo",
    transport:
      "Większość dnia pieszo od Telliskivi; Bolt tylko przy mocnym deszczu",
    stops: [
      {
        id: "sun-market",
        time: "09:00",
        title: "Balti Jaama Turg",
        note: "Śniadanie i szybkie zakupy.",
        kind: "food",
        lat: 59.4407,
        lng: 24.7352,
      },
      {
        id: "sun-lennusadam",
        time: "10:00",
        title: "Seaplane Harbour — Lennusadam",
        note:
          "Okręt podwodny Lembit, hangary wodnosamolotów i lodołamacz Suur Tõll.",
        kind: "museum",
        lat: 59.4513,
        lng: 24.7384,
      },
      {
        id: "sun-patarei",
        time: "12:45",
        title: "Patarei i Noblessner",
        note:
          "Dawna twierdza-więzienie i odnowiony port Noblessner.",
        kind: "sight",
        lat: 59.4515,
        lng: 24.731,
      },
      {
        id: "sun-lore",
        time: "13:30",
        title: "Lunch: Lore Bistroo",
        note:
          "Restauracja w przemysłowym budynku portowym. Rezerwacja wskazana.",
        kind: "food",
        lat: 59.4531,
        lng: 24.7276,
      },
      {
        id: "sun-kalamaja",
        time: "15:30",
        title: "Kalamaja i drewniane domy",
        note:
          "Spokojny powrót przez uliczki Kalamaja i Telliskivi Creative City.",
        kind: "sight",
        lat: 59.4442,
        lng: 24.73,
      },
      {
        id: "sun-fhoone",
        time: "18:30",
        title: "Ostatnia kolacja: F-Hoone",
        note:
          "Luźna, industrialna restauracja w Telliskivi, blisko noclegu.",
        kind: "food",
        lat: 59.439,
        lng: 24.729,
      },
      {
        id: "sun-sleep",
        time: "21:00",
        title: "Pakowanie i wczesny sen",
        note:
          "Na lot o 07:00 zamówcie Bolt około 04:40–04:45.",
        kind: "logistics",
        lat: 59.44,
        lng: 24.732,
      },
    ],
  },
];

const labels: Record<Kind, string> = {
  museum: "Muzeum",
  food: "Jedzenie",
  sight: "Zabytek / spacer",
  logistics: "Logistyka",
};

/* =========================================================
   POLYLINE DECODER - VALHALLA
========================================================= */

function decodePolyline(
  encoded: string,
  precision = 6
): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;

  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

/* =========================================================
   MAP
========================================================= */

function Map({ day }: { day: Day }) {
  const element = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const routeLayer = useRef<L.GeoJSON | null>(null);
  const userMarker = useRef<L.CircleMarker | null>(null);
  const accuracyCircle = useRef<L.Circle | null>(null);
  const watchId = useRef<number | null>(null);

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [locationError, setLocationError] = useState("");

  const [locating, setLocating] = useState(false);
  const [tracking, setTracking] = useState(false);

  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    time: number;
  } | null>(null);

  function points() {
    return day.stops.filter(
      (stop): stop is Stop & { lat: number; lng: number } =>
        stop.lat !== undefined && stop.lng !== undefined
    );
  }

  function showWholeRoute() {
    const map = mapInstance.current;

    if (!map) return;

    if (routeLayer.current) {
      const bounds = routeLayer.current.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [35, 35],
        });

        return;
      }
    }

    const currentPoints = points();

    if (currentPoints.length) {
      map.fitBounds(
        L.latLngBounds(
          currentPoints.map((point) => [
            point.lat,
            point.lng,
          ])
        ),
        { padding: [35, 35] }
      );
    }
  }

  function updateUserLocation(
    lat: number,
    lng: number,
    accuracy: number
  ) {
    const map = mapInstance.current;

    if (!map) return;

    if (!userMarker.current) {
      userMarker.current = L.circleMarker([lat, lng], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup("Twoja lokalizacja");
    } else {
      userMarker.current.setLatLng([lat, lng]);
    }

    if (!accuracyCircle.current) {
      accuracyCircle.current = L.circle([lat, lng], {
        radius: accuracy,
        color: "#2563eb",
        weight: 1,
        fillColor: "#2563eb",
        fillOpacity: 0.08,
      }).addTo(map);
    } else {
      accuracyCircle.current.setLatLng([lat, lng]);
      accuracyCircle.current.setRadius(accuracy);
    }
  }

  function findMe() {
    if (!navigator.geolocation) {
      setLocationError(
        "Ta przeglądarka nie obsługuje lokalizacji."
      );
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } =
          position.coords;

        updateUserLocation(
          latitude,
          longitude,
          accuracy
        );

        mapInstance.current?.setView(
          [latitude, longitude],
          16
        );

        setLocating(false);
      },
      (error) => {
        console.error(error);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Brak dostępu do lokalizacji. Zezwól stronie na lokalizację w ustawieniach przeglądarki."
          );
        } else {
          setLocationError(
            "Nie udało się pobrać Twojej lokalizacji."
          );
        }

        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }

  function startTracking() {
    if (!navigator.geolocation) {
      setLocationError(
        "Ta przeglądarka nie obsługuje lokalizacji."
      );
      return;
    }

    if (watchId.current !== null) return;

    setLocationError("");
    setTracking(true);

    watchId.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } =
            position.coords;

          updateUserLocation(
            latitude,
            longitude,
            accuracy
          );
        },
        (error) => {
          console.error(error);

          setLocationError(
            "Nie udało się śledzić lokalizacji."
          );

          setTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        }
      );
  }

  function stopTracking() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(
        watchId.current
      );

      watchId.current = null;
    }

    setTracking(false);
  }

  useEffect(() => {
    if (!element.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setTracking(false);

    routeLayer.current = null;
    userMarker.current = null;
    accuracyCircle.current = null;

    setRouteInfo(null);
    setRouteError("");

    const currentPoints = points();

    const map = L.map(element.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    mapInstance.current = map;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }
    ).addTo(map);

    currentPoints.forEach((stop, index) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-number">${index + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([stop.lat, stop.lng], {
        icon,
      })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px">
            <strong>${index + 1}. ${stop.title}</strong>
            <br>
            ${stop.time}
          </div>
        `);
    });

    /*
     * STARTOWY WIDOK:
     * zawsze trasa w Tallinnie.
     * Nie pytamy automatycznie o GPS.
     */
    if (currentPoints.length) {
      map.fitBounds(
        L.latLngBounds(
          currentPoints.map((point) => [
            point.lat,
            point.lng,
          ])
        ),
        {
          padding: [35, 35],
        }
      );
    } else {
      map.setView([59.437, 24.7536], 13);
    }

    async function loadWalkingRoute() {
      if (currentPoints.length < 2) return;

      setRouteLoading(true);
      setRouteError("");

      try {
        const request = {
          locations: currentPoints.map((point) => ({
            lat: point.lat,
            lon: point.lng,
            type: "break",
          })),
          costing: "pedestrian",
          units: "kilometers",
          directions_options: {
            units: "kilometers",
          },
        };

        const url =
          "https://valhalla1.openstreetmap.de/route?json=" +
          encodeURIComponent(JSON.stringify(request));

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Routing HTTP ${response.status}`
          );
        }

        const data = await response.json();

        const allCoordinates: [number, number][] = [];

        for (const leg of data.trip.legs) {
          allCoordinates.push(
            ...decodePolyline(leg.shape)
          );
        }

        const geoJson = {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: allCoordinates.map(
              ([lat, lng]) => [lng, lat]
            ),
          },
        };

        const layer = L.geoJSON(geoJson, {
          style: {
            color: "#2563eb",
            weight: 5,
            opacity: 0.82,
          },
        }).addTo(map);

        routeLayer.current = layer;

        setRouteInfo({
          distance: data.trip.summary.length,
          time: data.trip.summary.time,
        });

        const bounds = layer.getBounds();

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [35, 35],
          });
        }
      } catch (error) {
        console.error("Routing error:", error);

        setRouteError(
          "Nie udało się pobrać dokładnej trasy pieszej. Pokazuję orientacyjne połączenie punktów."
        );

        const fallback = L.polyline(
          currentPoints.map((point) => [
            point.lat,
            point.lng,
          ]),
          {
            color: "#2563eb",
            weight: 4,
            opacity: 0.45,
            dashArray: "7 7",
          }
        ).addTo(map);

        map.fitBounds(fallback.getBounds(), {
          padding: [35, 35],
        });
      } finally {
        setRouteLoading(false);
      }
    }

    loadWalkingRoute();

    window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(
          watchId.current
        );

        watchId.current = null;
      }

      map.remove();
      mapInstance.current = null;
    };
  }, [day]);

  function formatDuration(seconds: number) {
    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return rest
      ? `${hours} h ${rest} min`
      : `${hours} h`;
  }

  return (
    <div className="map-wrapper">
      <div className="map-toolbar">
        <button
          className="map-button primary"
          onClick={findMe}
          disabled={locating}
        >
          {locating
            ? "Szukam lokalizacji..."
            : "◎ Moja lokalizacja"}
        </button>

        {!tracking ? (
          <button
            className="map-button"
            onClick={startTracking}
          >
            Śledź mnie
          </button>
        ) : (
          <button
            className="map-button tracking"
            onClick={stopTracking}
          >
            Zatrzymaj śledzenie
          </button>
        )}

        <button
          className="map-button"
          onClick={showWholeRoute}
        >
          Pokaż całą trasę
        </button>
      </div>

      {routeLoading && (
        <div className="route-status">
          Wyznaczam trasę pieszą...
        </div>
      )}

      {routeInfo && !routeLoading && (
        <div className="route-summary">
          <strong>Trasa piesza:</strong>{" "}
          {routeInfo.distance.toFixed(1)} km · około{" "}
          {formatDuration(routeInfo.time)}
        </div>
      )}

      {routeError && (
        <div className="map-error">
          {routeError}
        </div>
      )}

      {locationError && (
        <div className="map-error">
          {locationError}
        </div>
      )}

      <div ref={element} className="map" />
    </div>
  );
}

/* =========================================================
   COMMENTS
========================================================= */

function Comments({
  stopId,
  username,
}: {
  stopId: string;
  username: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("stop_id", stopId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      setError(
        `Błąd Supabase: ${error.message}`
      );
      return;
    }

    setError("");
    setComments((data ?? []) as Comment[]);
  }

  useEffect(() => {
    loadComments();
  }, [stopId]);

  async function addComment() {
    const author = username.trim();
    const comment = text.trim();

    if (!author) {
      setError(
        "Najpierw wpisz swoją nazwę u góry strony."
      );
      return;
    }

    if (!comment) return;

    setSending(true);
    setError("");

    const { error } = await supabase
      .from("comments")
      .insert({
        stop_id: stopId,
        author,
        comment,
      });

    if (error) {
      console.error(error);

      setError(
        `Błąd Supabase: ${error.message}`
      );

      setSending(false);
      return;
    }

    setText("");
    setSending(false);

    await loadComments();
  }

  return (
    <div className="comments">
      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map((comment) => (
            <div
              className="comment"
              key={comment.id}
            >
              <div className="comment-header">
                <strong>
                  {comment.author}
                </strong>

                <span>
                  {new Date(
                    comment.created_at
                  ).toLocaleString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div>{comment.comment}</div>
            </div>
          ))}
        </div>
      )}

      <div className="comment-form">
        <input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addComment();
            }
          }}
          placeholder={
            username.trim()
              ? "Dodaj komentarz..."
              : "Najpierw wpisz swoją nazwę"
          }
          maxLength={500}
        />

        <button
          onClick={addComment}
          disabled={
            sending || !text.trim()
          }
        >
          {sending ? "..." : "Wyślij"}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [selected, setSelected] =
    useState("fri");

  const [username, setUsername] =
    useState(() => {
      return (
        localStorage.getItem(
          "tallinn_username"
        ) ?? ""
      );
    });

  const day =
    days.find((d) => d.id === selected) ??
    days[0];

  function changeUsername(value: string) {
    setUsername(value);

    localStorage.setItem(
      "tallinn_username",
      value
    );
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          -webkit-text-size-adjust: 100%;
        }

        body {
          margin: 0;
          background: ${theme.background};
        }

        button,
        input {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .app {
          min-height: 100vh;
          background: ${theme.background};
          color: ${theme.primary};
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px 24px 60px;
        }

        header {
          padding-bottom: 24px;
          border-bottom:
            1px solid ${theme.border};
        }

        .eyebrow {
          color: ${theme.blue};
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .04em;
        }

        h1 {
          margin: 8px 0 7px;
          font-size:
            clamp(28px, 4vw, 42px);
          line-height: 1.08;
          letter-spacing: -.025em;
        }

        .subtitle {
          color: ${theme.secondary};
          margin: 0;
        }

        .user-box {
          margin-top: 20px;
          max-width: 420px;
        }

        .user-box label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 7px;
        }

        .user-box input {
          width: 100%;
          padding: 12px 14px;
          border:
            1px solid ${theme.border};
          border-radius: 10px;
          outline: none;
          background: white;
          font-size: 16px;
        }

        .user-box input:focus {
          border-color: ${theme.blue};
          box-shadow:
            0 0 0 3px
            rgba(37, 99, 235, .10);
        }

        .tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .tab {
          border:
            1px solid ${theme.border};
          background: white;
          color: ${theme.primary};
          padding: 10px 15px;
          min-height: 42px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .tab.active {
          border-color: ${theme.blue};
          background: ${theme.blue};
          color: white;
        }

        .day-layout {
          display: grid;
          grid-template-columns:
            240px minmax(0, 1fr);
          gap: 34px;
          margin-top: 28px;
        }

        .day-info h2 {
          margin-top: 0;
          line-height: 1.2;
        }

        .day-info p {
          line-height: 1.55;
        }

        .transport {
          color: ${theme.secondary};
        }

        .stop {
          display: grid;
          grid-template-columns:
            68px minmax(0, 1fr);
          gap: 16px;
          padding-bottom: 24px;
          margin-bottom: 20px;
          border-bottom:
            1px solid ${theme.border};
        }

        .stop:last-child {
          border-bottom: none;
        }

        .time {
          font-weight: 800;
          padding-top: 2px;
        }

        .stop h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.35;
        }

        .kind {
          display: inline-block;
          margin-left: 5px;
          color: ${theme.tertiary};
          font-size: 11px;
          font-weight: 500;
          vertical-align: middle;
        }

        .note {
          color: ${theme.secondary};
          line-height: 1.55;
          margin: 7px 0 0;
        }

        /* COMMENTS */

        .comments {
          margin-top: 14px;
        }

        .comment-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 9px;
        }

        .comment {
          background: ${theme.soft};
          border-radius: 9px;
          padding: 10px 12px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .comment-header {
          display: flex;
          justify-content:
            space-between;
          gap: 10px;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .comment-header span {
          color: ${theme.tertiary};
          font-size: 11px;
          white-space: nowrap;
        }

        .comment-form {
          display: flex;
          gap: 7px;
        }

        .comment-form input {
          flex: 1;
          min-width: 0;
          border:
            1px solid ${theme.border};
          border-radius: 9px;
          padding: 10px 12px;
          outline: none;
          font-size: 16px;
        }

        .comment-form input:focus {
          border-color: ${theme.blue};
        }

        .comment-form button {
          border: none;
          background: ${theme.blue};
          color: white;
          border-radius: 9px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 700;
        }

        .comment-form button:disabled {
          opacity: .45;
          cursor: default;
        }

        .error {
          color: #b91c1c;
          font-size: 12px;
          margin-top: 6px;
        }

        /* MAP */

        .map-section {
          margin-top: 42px;
        }

        .map-section h2 {
          margin-bottom: 5px;
        }

        .map-description {
          color: ${theme.secondary};
          margin: 0 0 15px;
        }

        .map-wrapper {
          width: 100%;
        }

        .map-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .map-button {
          appearance: none;
          border:
            1px solid ${theme.border};
          background: #ffffff;
          color: ${theme.primary};
          min-height: 42px;
          padding: 9px 14px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .map-button.primary {
          background: ${theme.blue};
          border-color: ${theme.blue};
          color: white;
        }

        .map-button.tracking {
          background: ${theme.primary};
          border-color:
            ${theme.primary};
          color: white;
        }

        .map-button:disabled {
          opacity: .55;
          cursor: default;
        }

        .route-status,
        .route-summary {
          margin: 0 0 12px;
          padding: 10px 13px;
          background: ${theme.soft};
          border-radius: 9px;
          font-size: 14px;
        }

        .map-error {
          margin: 0 0 12px;
          padding: 10px 13px;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 9px;
          font-size: 13px;
        }

        .map {
          height: 460px;
          width: 100%;
          border:
            1px solid ${theme.border};
          border-radius: 14px;
          overflow: hidden;
          z-index: 0;
        }

        .map-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${theme.blue};
          color: white;
          border: 3px solid white;
          box-shadow:
            0 2px 8px
            rgba(0, 0, 0, .3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        /* ===========================
           MOBILE
        =========================== */

        @media (max-width: 700px) {
          .container {
            padding:
              20px 16px
              calc(40px + env(safe-area-inset-bottom));
          }

          header {
            padding-bottom: 20px;
          }

          h1 {
            font-size: 31px;
          }

          .subtitle {
            font-size: 14px;
            line-height: 1.5;
          }

          .user-box {
            max-width: none;
          }

          .tabs {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 6px;
            margin-top: 20px;
          }

          .tab {
            padding: 10px 5px;
            font-size: 12px;
          }

          .day-layout {
            display: block;
            margin-top: 24px;
          }

          .day-info {
            padding: 16px;
            background: ${theme.soft};
            border-radius: 12px;
            margin-bottom: 26px;
          }

          .day-info h2 {
            font-size: 21px;
            margin-bottom: 8px;
          }

          .day-info p {
            margin: 6px 0;
            font-size: 14px;
          }

          .stop {
            display: block;
            padding-bottom: 22px;
            margin-bottom: 22px;
          }

          .time {
            display: inline-block;
            color: ${theme.blue};
            margin-bottom: 5px;
          }

          .stop h3 {
            font-size: 18px;
          }

          .kind {
            display: block;
            margin: 4px 0 0;
          }

          .note {
            font-size: 15px;
          }

          .comment-form button {
            min-width: 76px;
            min-height: 44px;
          }

          .comment-form input {
            min-height: 44px;
          }

          .map-section {
            margin-top: 30px;
          }

          .map-toolbar {
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .map-button {
            width: 100%;
            min-height: 46px;
            padding: 10px 8px;
            font-size: 13px;
          }

          .map-button:first-child {
            grid-column: 1 / -1;
          }

          .route-summary,
          .route-status,
          .map-error {
            font-size: 13px;
          }

          .map {
            height: 380px;
            border-radius: 12px;
          }

          .leaflet-control-attribution {
            font-size: 8px !important;
          }
        }

        @media (max-width: 420px) {
          .container {
            padding-left: 13px;
            padding-right: 13px;
          }

          .tabs {
            grid-template-columns: 1fr;
          }

          .tab {
            font-size: 14px;
          }

          .comment-form {
            display: grid;
            grid-template-columns:
              minmax(0, 1fr) auto;
          }

          .map-toolbar {
            grid-template-columns: 1fr;
          }

          .map-button:first-child {
            grid-column: auto;
          }

          .map {
            height: 340px;
          }
        }
      `}</style>

      <main className="app">
        <div className="container">
          <header>
            <div className="eyebrow">
              PLAN DLA 4 OSÓB
            </div>

            <h1>
              Tallinn: zabytki, muzea i dobre stoły
            </h1>

            <p className="subtitle">
              4–7 września 2026 · baza:
              Telliskivi tn 26
            </p>

            <div className="user-box">
              <label htmlFor="username">
                Twoja nazwa
              </label>

              <input
                id="username"
                value={username}
                onChange={(e) =>
                  changeUsername(
                    e.target.value
                  )
                }
                placeholder="np. Cezary"
                maxLength={40}
              />
            </div>
          </header>

          <div className="tabs">
            {days.map((d) => (
              <button
                className={`tab ${
                  selected === d.id
                    ? "active"
                    : ""
                }`}
                key={d.id}
                onClick={() =>
                  setSelected(d.id)
                }
              >
                {d.label} · {d.date}
              </button>
            ))}
          </div>

          <div className="day-layout">
            <aside className="day-info">
              <h2>{day.title}</h2>

              <p>
                <strong>
                  {day.distance}
                </strong>
              </p>

              <p className="transport">
                {day.transport}
              </p>
            </aside>

            <div>
              {day.stops.map(
                (stop, index) => (
                  <article
                    className="stop"
                    key={stop.id}
                  >
                    <div className="time">
                      {stop.time}
                    </div>

                    <div>
                      <h3>
                        {index + 1}.{" "}
                        {stop.title}

                        {stop.kind && (
                          <span className="kind">
                            {
                              labels[
                                stop.kind
                              ]
                            }
                          </span>
                        )}
                      </h3>

                      <p className="note">
                        {stop.note}
                      </p>

                      <Comments
                        stopId={stop.id}
                        username={username}
                      />
                    </div>
                  </article>
                )
              )}
            </div>
          </div>

          <section className="map-section">
            <h2>
              Trasa · {day.label}
            </h2>

            <p className="map-description">
              Numery na mapie odpowiadają
              punktom planu. Trasa jest
              wyznaczana dla ruchu pieszego.
            </p>

            <Map day={day} />
          </section>
        </div>
      </main>
    </>
  );
}
