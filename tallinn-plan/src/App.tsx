import { useEffect, useMemo, useRef, useState } from "react";
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

type Day = {
  id: string;
  label: string;
  date: string;
  title: string;
  distance: string;
  transport: string;
};

type MapPoint = {
  id: number;
  day_id: string;
  position: number;
  title: string;
  description: string | null;
  time: string | null;
  kind: string | null;
  lat: number;
  lng: number;
  is_custom: boolean;
  created_at?: string;
};

type CommentRow = {
  id: number;
  stop_id: string;
  author: string;
  comment: string;
  created_at: string;
};

/* =========================================================
   CONSTANTS
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

const accommodation = {
  title: "Nocleg",
  address: "Telliskivi tn 26",
  lat: 59.4398,
  lng: 24.7315,
};

const days: Day[] = [
  {
    id: "fri",
    label: "Piątek",
    date: "4 września",
    title: "Średniowieczny Tallinn",
    distance: "7–9 km pieszo",
    transport:
      "Lotnisko → Telliskivi: Bolt 15–20 min lub tramwaj T2 do Balti jaam",
  },
  {
    id: "sat",
    label: "Sobota",
    date: "5 września",
    title: "Kadriorg, sztuka i nowoczesne centrum",
    distance: "5–7 km pieszo",
    transport:
      "Telliskivi → Kadriorg: tramwaj lub Bolt; powrót przez Rotermann",
  },
  {
    id: "sun",
    label: "Niedziela",
    date: "6 września",
    title: "Kalamaja, port i historia morska",
    distance: "6–8 km pieszo",
    transport:
      "Większość dnia pieszo od Telliskivi; Bolt tylko przy mocnym deszczu",
  },
];

const labels: Record<Kind, string> = {
  museum: "Muzeum",
  food: "Jedzenie",
  sight: "Zabytek / spacer",
  logistics: "Logistyka",
};

function kindLabel(kind: string | null) {
  if (
    kind === "museum" ||
    kind === "food" ||
    kind === "sight" ||
    kind === "logistics"
  ) {
    return labels[kind];
  }

  return "";
}

/* =========================================================
   VALHALLA POLYLINE
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
   COMMENTS
========================================================= */

function Comments({
  stopId,
  username,
}: {
  stopId: string;
  username: string;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("stop_id", stopId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(`Błąd Supabase: ${error.message}`);
      return;
    }

    setError("");
    setComments((data ?? []) as CommentRow[]);
  }

  useEffect(() => {
    void loadComments();
  }, [stopId]);

  async function addComment() {
    const author = username.trim();
    const comment = text.trim();

    if (!author) {
      setError("Najpierw wpisz swoją nazwę u góry strony.");
      return;
    }

    if (!comment) return;

    setSending(true);
    setError("");

    const { error } = await supabase.from("comments").insert({
      stop_id: stopId,
      author,
      comment,
    });

    if (error) {
      setError(`Błąd Supabase: ${error.message}`);
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
            <div className="comment" key={comment.id}>
              <div className="comment-header">
                <strong>{comment.author}</strong>

                <span>
                  {new Date(comment.created_at).toLocaleString("pl-PL", {
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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void addComment();
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
          onClick={() => void addComment()}
          disabled={sending || !text.trim()}
        >
          {sending ? "..." : "Wyślij"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

/* =========================================================
   MAP
========================================================= */

function Map({
  points,
  adding,
  onMapClick,
}: {
  points: MapPoint[];
  adding: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const element = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const routeLayer = useRef<L.GeoJSON | null>(null);
  const userMarker = useRef<L.CircleMarker | null>(null);
  const accuracyCircle = useRef<L.Circle | null>(null);
  const watchId = useRef<number | null>(null);

  const [routeLoading, setRouteLoading] = useState(false);

  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    time: number;
  } | null>(null);

  const [routeError, setRouteError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [tracking, setTracking] = useState(false);

  function showWholeRoute() {
    const map = mapInstance.current;

    if (!map) return;

    if (routeLayer.current) {
      const bounds = routeLayer.current.getBounds();

      if (bounds.isValid()) {
        bounds.extend([accommodation.lat, accommodation.lng]);

        map.fitBounds(bounds, {
          padding: [35, 35],
        });

        return;
      }
    }

    const allCoordinates: L.LatLngExpression[] = [
      [accommodation.lat, accommodation.lng],
      ...points.map(
        (point) => [point.lat, point.lng] as L.LatLngExpression
      ),
    ];

    map.fitBounds(L.latLngBounds(allCoordinates), {
      padding: [35, 35],
    });
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
        fillColor: theme.blue,
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
        color: theme.blue,
        weight: 1,
        fillColor: theme.blue,
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

        updateUserLocation(latitude, longitude, accuracy);

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
      navigator.geolocation.clearWatch(
        watchId.current
      );

      watchId.current = null;
    }

    setTracking(false);

    routeLayer.current = null;
    userMarker.current = null;
    accuracyCircle.current = null;

    setRouteInfo(null);
    setRouteError("");
    setLocationError("");

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

    /* NOCLEG */

    const homeIcon = L.divIcon({
      className: "",
      html: `
        <div class="home-marker">
          <span>⌂</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker(
      [accommodation.lat, accommodation.lng],
      {
        icon: homeIcon,
        zIndexOffset: 1000,
      }
    )
      .addTo(map)
      .bindPopup(`
        <div style="min-width:160px">
          <strong>🏠 ${accommodation.title}</strong>
          <div style="margin-top:4px">
            ${accommodation.address}
          </div>
          <div style="margin-top:6px;font-size:12px;color:#71717a">
            Stały punkt · nie jest częścią trasy
          </div>
        </div>
      `);

    /* PUNKTY TRASY */

    points.forEach((point, index) => {
      const icon = L.divIcon({
        className: "",
        html: `
          <div class="map-number">
            ${index + 1}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([point.lat, point.lng], {
        icon,
      })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:190px">
            <strong>
              ${index + 1}. ${point.title}
            </strong>

            ${
              point.time
                ? `<div style="margin-top:3px">${point.time}</div>`
                : ""
            }

            ${
              point.description
                ? `<div style="margin-top:7px">${point.description}</div>`
                : ""
            }
          </div>
        `);
    });

    /* STARTOWY WIDOK */

    const initialCoordinates: L.LatLngExpression[] = [
      [accommodation.lat, accommodation.lng],
      ...points.map(
        (point) => [point.lat, point.lng] as L.LatLngExpression
      ),
    ];

    map.fitBounds(
      L.latLngBounds(initialCoordinates),
      {
        padding: [35, 35],
      }
    );

    /* DODAWANIE PRZEZ KLIKNIĘCIE */

    map.on("click", (event) => {
      if (!adding) return;

      onMapClick(
        event.latlng.lat,
        event.latlng.lng
      );
    });

    /* ROUTING */

    async function loadRoute() {
      if (points.length < 2) {
        setRouteInfo(null);
        return;
      }

      setRouteLoading(true);
      setRouteError("");

      try {
        const request = {
          locations: points.map((point) => ({
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
          encodeURIComponent(
            JSON.stringify(request)
          );

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Routing HTTP ${response.status}`
          );
        }

        const data = await response.json();

        const coordinates: [number, number][] =
          [];

        for (const leg of data.trip.legs) {
          coordinates.push(
            ...decodePolyline(leg.shape)
          );
        }

        const geoJson = {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,

            coordinates: coordinates.map(
              ([lat, lng]) => [lng, lat]
            ),
          },
        };

        const layer = L.geoJSON(geoJson, {
          style: {
            color: theme.blue,
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
          bounds.extend([
            accommodation.lat,
            accommodation.lng,
          ]);

          map.fitBounds(bounds, {
            padding: [35, 35],
          });
        }
      } catch (error) {
        console.error(
          "Routing error:",
          error
        );

        setRouteError(
          "Nie udało się pobrać dokładnej trasy pieszej. Pokazuję orientacyjne połączenie punktów."
        );

        const fallback = L.polyline(
          points.map((point) => [
            point.lat,
            point.lng,
          ]),
          {
            color: theme.blue,
            weight: 4,
            opacity: 0.45,
            dashArray: "7 7",
          }
        ).addTo(map);

        const bounds = fallback.getBounds();

        bounds.extend([
          accommodation.lat,
          accommodation.lng,
        ]);

        map.fitBounds(bounds, {
          padding: [35, 35],
        });
      } finally {
        setRouteLoading(false);
      }
    }

    void loadRoute();

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
  }, [points, adding]);

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
    <div
      className={`map-wrapper ${
        adding ? "adding" : ""
      }`}
    >
      <div className="map-toolbar">
        <button
          className="map-button primary"
          onClick={findMe}
          disabled={locating}
        >
          {locating
            ? "Szukam..."
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

      {adding && (
        <div className="add-hint">
          Kliknij na mapie miejsce, które chcesz
          dodać do trasy.
        </div>
      )}

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

      <div
        ref={element}
        className="map"
      />
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

  const [mapPoints, setMapPoints] =
    useState<MapPoint[]>([]);

  const [loadingPoints, setLoadingPoints] =
    useState(true);

  const [pointsError, setPointsError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* ADD */

  const [adding, setAdding] =
    useState(false);

  const [newLat, setNewLat] =
    useState<number | null>(null);

  const [newLng, setNewLng] =
    useState<number | null>(null);

  const [newTitle, setNewTitle] =
    useState("");

  const [newDescription, setNewDescription] =
    useState("");

  const [newTime, setNewTime] =
    useState("");

  /* EDIT */

  const [editing, setEditing] =
    useState<MapPoint | null>(null);

  const [editTitle, setEditTitle] =
    useState("");

  const [editDescription, setEditDescription] =
    useState("");

  const [editTime, setEditTime] =
    useState("");

  const day =
    days.find(
      (item) => item.id === selected
    ) ?? days[0];

  const sortedPoints = useMemo(() => {
    return [...mapPoints].sort(
      (a, b) => a.position - b.position
    );
  }, [mapPoints]);

  function changeUsername(value: string) {
    setUsername(value);

    localStorage.setItem(
      "tallinn_username",
      value
    );
  }

  /* =======================================================
     LOAD
  ======================================================= */

  async function loadPoints(dayId: string) {
    setLoadingPoints(true);
    setPointsError("");

    const { data, error } = await supabase
      .from("map_points")
      .select("*")
      .eq("day_id", dayId)
      .order("position", {
        ascending: true,
      });

    if (error) {
      setPointsError(
        `Błąd punktów mapy: ${error.message}`
      );

      setLoadingPoints(false);
      return;
    }

    setMapPoints(
      ((data ?? []) as MapPoint[]).sort(
        (a, b) =>
          a.position - b.position
      )
    );

    setLoadingPoints(false);
  }

  useEffect(() => {
    setAdding(false);
    setEditing(null);

    setNewLat(null);
    setNewLng(null);

    void loadPoints(selected);
  }, [selected]);

  /* =======================================================
     ORDER
  ======================================================= */

  async function movePoint(
    index: number,
    direction: -1 | 1
  ) {
    const targetIndex =
      index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= sortedPoints.length
    ) {
      return;
    }

    const current =
      sortedPoints[index];

    const target =
      sortedPoints[targetIndex];

    setSaving(true);
    setPointsError("");

    const temporaryPosition =
      -1000000 - current.id;

    const first = await supabase
      .from("map_points")
      .update({
        position: temporaryPosition,
      })
      .eq("id", current.id);

    if (first.error) {
      setPointsError(
        `Nie udało się zmienić kolejności: ${first.error.message}`
      );

      setSaving(false);
      return;
    }

    const second = await supabase
      .from("map_points")
      .update({
        position: current.position,
      })
      .eq("id", target.id);

    if (second.error) {
      setPointsError(
        `Nie udało się zmienić kolejności: ${second.error.message}`
      );

      await loadPoints(selected);
      setSaving(false);
      return;
    }

    const third = await supabase
      .from("map_points")
      .update({
        position: target.position,
      })
      .eq("id", current.id);

    if (third.error) {
      setPointsError(
        `Nie udało się zmienić kolejności: ${third.error.message}`
      );

      await loadPoints(selected);
      setSaving(false);
      return;
    }

    await loadPoints(selected);

    setSaving(false);
  }

  /* =======================================================
     ADD
  ======================================================= */

  function beginAdd() {
    setEditing(null);

    setAdding(true);

    setNewLat(null);
    setNewLng(null);

    setNewTitle("");
    setNewDescription("");
    setNewTime("");
  }

  function cancelAdd() {
    setAdding(false);

    setNewLat(null);
    setNewLng(null);

    setNewTitle("");
    setNewDescription("");
    setNewTime("");
  }

  function chooseNewLocation(
    lat: number,
    lng: number
  ) {
    setNewLat(lat);
    setNewLng(lng);
  }

  async function addPoint() {
    if (
      newLat === null ||
      newLng === null ||
      !newTitle.trim()
    ) {
      return;
    }

    setSaving(true);
    setPointsError("");

    const maxPosition =
      sortedPoints.length > 0
        ? Math.max(
            ...sortedPoints.map(
              (point) => point.position
            )
          )
        : 0;

    const { error } = await supabase
      .from("map_points")
      .insert({
        day_id: selected,

        position:
          maxPosition + 1,

        title:
          newTitle.trim(),

        description:
          newDescription.trim() ||
          null,

        time:
          newTime.trim() ||
          null,

        kind: "sight",

        lat: newLat,
        lng: newLng,

        is_custom: true,
      });

    if (error) {
      setPointsError(
        `Nie udało się dodać miejsca: ${error.message}`
      );

      setSaving(false);
      return;
    }

    cancelAdd();

    await loadPoints(selected);

    setSaving(false);
  }

  /* =======================================================
     EDIT
  ======================================================= */

  function beginEdit(
    point: MapPoint
  ) {
    setAdding(false);

    setEditing(point);

    setEditTitle(point.title);

    setEditDescription(
      point.description ?? ""
    );

    setEditTime(
      point.time ?? ""
    );
  }

  async function saveEdit() {
    if (
      !editing ||
      !editTitle.trim()
    ) {
      return;
    }

    setSaving(true);
    setPointsError("");

    const { error } = await supabase
      .from("map_points")
      .update({
        title:
          editTitle.trim(),

        description:
          editDescription.trim() ||
          null,

        time:
          editTime.trim() ||
          null,
      })
      .eq("id", editing.id);

    if (error) {
      setPointsError(
        `Nie udało się zapisać zmian: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setEditing(null);

    await loadPoints(selected);

    setSaving(false);
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deletePoint(
    point: MapPoint
  ) {
    const confirmed =
      window.confirm(
        `Usunąć „${point.title}” z trasy?`
      );

    if (!confirmed) return;

    setSaving(true);
    setPointsError("");

    const { error } = await supabase
      .from("map_points")
      .delete()
      .eq("id", point.id);

    if (error) {
      setPointsError(
        `Nie udało się usunąć miejsca: ${error.message}`
      );

      setSaving(false);
      return;
    }

    /*
     * Normalizacja kolejności.
     */

    const remaining =
      sortedPoints.filter(
        (item) =>
          item.id !== point.id
      );

    for (
      let index = 0;
      index < remaining.length;
      index++
    ) {
      const desiredPosition =
        index + 1;

      if (
        remaining[index].position !==
        desiredPosition
      ) {
        const result =
          await supabase
            .from("map_points")
            .update({
              position:
                desiredPosition,
            })
            .eq(
              "id",
              remaining[index].id
            );

        if (result.error) {
          console.error(
            result.error
          );
        }
      }
    }

    await loadPoints(selected);

    setSaving(false);
  }

  /* =======================================================
     RENDER
  ======================================================= */

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
        input,
        textarea {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .app {
          min-height: 100vh;
          color: ${theme.primary};
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .container {
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
          margin: 0;
          color: ${theme.secondary};
        }

        .user-box {
          max-width: 420px;
          margin-top: 20px;
        }

        .user-box label {
          display: block;
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 700;
        }

        .user-box input,
        .editor input,
        .editor textarea {
          width: 100%;
          border:
            1px solid ${theme.border};
          border-radius: 10px;
          background: white;
          padding: 12px 14px;
          outline: none;
          font-size: 16px;
        }

        .editor textarea {
          min-height: 100px;
          resize: vertical;
        }

        input:focus,
        textarea:focus {
          border-color:
            ${theme.blue} !important;
        }

        /* DAYS */

        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 28px;
        }

        .tab {
          min-height: 42px;
          border:
            1px solid ${theme.border};
          border-radius: 9px;
          background: white;
          padding: 10px 15px;
          color: ${theme.primary};
          font-weight: 700;
          cursor: pointer;
        }

        .tab.active {
          border-color:
            ${theme.blue};
          background:
            ${theme.blue};
          color: white;
        }

        /* DAY INFO */

        .day-header {
          display: grid;
          grid-template-columns:
            240px minmax(0, 1fr);
          gap: 34px;
          margin-top: 28px;
          margin-bottom: 12px;
        }

        .day-info h2 {
          margin-top: 0;
          margin-bottom: 8px;
        }

        .day-info p {
          line-height: 1.55;
        }

        .transport {
          color: ${theme.secondary};
        }

        /* PLAN */

        .plan {
          grid-column: 2;
        }

        .plan-empty {
          padding: 20px;
          border-radius: 12px;
          background: ${theme.soft};
          color: ${theme.secondary};
        }

        .plan-stop {
          display: grid;
          grid-template-columns:
            68px minmax(0, 1fr);
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 24px;
          border-bottom:
            1px solid ${theme.border};
        }

        .time {
          padding-top: 2px;
          font-weight: 800;
        }

        .plan-stop h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.35;
        }

        .kind {
          display: inline-block;
          margin-left: 6px;
          color: ${theme.tertiary};
          font-size: 11px;
          font-weight: 500;
        }

        .note {
          margin: 7px 0 0;
          color: ${theme.secondary};
          line-height: 1.55;
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
          padding: 10px 12px;
          border-radius: 9px;
          background: ${theme.soft};
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

        .comment-form button,
        .primary-button {
          border: none;
          border-radius: 9px;
          background: ${theme.blue};
          padding: 10px 14px;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        button:disabled {
          opacity: .45;
          cursor: default;
        }

        .error {
          margin-top: 7px;
          color: #b91c1c;
          font-size: 13px;
        }

        /* ROUTE */

        .route-section {
          margin-top: 44px;
          padding-top: 30px;
          border-top:
            1px solid ${theme.border};
        }

        .route-heading {
          display: flex;
          align-items: flex-start;
          justify-content:
            space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .route-heading h2 {
          margin: 0 0 5px;
        }

        .route-heading p {
          margin: 0;
          color: ${theme.secondary};
        }

        .route-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .route-item {
          display: grid;
          grid-template-columns:
            44px minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border:
            1px solid ${theme.border};
          border-radius: 11px;
          background: white;
        }

        .route-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${theme.blue};
          color: white;
          font-size: 13px;
          font-weight: 800;
        }

        .route-name {
          font-weight: 750;
        }

        .route-description {
          margin-top: 3px;
          color: ${theme.secondary};
          font-size: 13px;
          line-height: 1.4;
        }

        .route-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .small-button {
          min-width: 36px;
          min-height: 36px;
          border:
            1px solid ${theme.border};
          border-radius: 8px;
          background: white;
          color: ${theme.primary};
          cursor: pointer;
          font-weight: 700;
        }

        .small-button.edit {
          padding: 0 10px;
        }

        .small-button.delete {
          color: #b91c1c;
        }

        /* HOME */

        .home-info {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 16px;
          padding: 12px 14px;
          border:
            1px solid ${theme.border};
          border-radius: 11px;
          background: ${theme.soft};
        }

        .home-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 36px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #18181b;
          color: white;
          font-size: 20px;
        }

        .home-info strong {
          display: block;
        }

        .home-info span {
          color: ${theme.secondary};
          font-size: 13px;
        }

        /* EDITOR */

        .editor {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 15px 0;
          padding: 16px;
          border:
            1px solid ${theme.border};
          border-radius: 12px;
          background: ${theme.soft};
        }

        .editor h3 {
          margin: 0 0 3px;
        }

        .editor-coordinates {
          color: ${theme.secondary};
          font-size: 12px;
        }

        .editor-buttons {
          display: flex;
          gap: 8px;
        }

        .secondary-button {
          border:
            1px solid ${theme.border};
          border-radius: 9px;
          background: white;
          padding: 10px 14px;
          color: ${theme.primary};
          font-weight: 700;
          cursor: pointer;
        }

        /* MAP */

        .map-wrapper {
          width: 100%;
        }

        .map-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 12px 0;
        }

        .map-button {
          min-height: 42px;
          border:
            1px solid ${theme.border};
          border-radius: 9px;
          background: white;
          padding: 9px 14px;
          color: ${theme.primary};
          font-weight: 700;
          cursor: pointer;
        }

        .map-button.primary {
          border-color:
            ${theme.blue};
          background:
            ${theme.blue};
          color: white;
        }

        .map-button.tracking {
          background:
            ${theme.primary};
          color: white;
        }

        .route-status,
        .route-summary,
        .add-hint {
          margin-bottom: 12px;
          padding: 10px 13px;
          border-radius: 9px;
          background: ${theme.soft};
          font-size: 14px;
        }

        .add-hint {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 650;
        }

        .map-error {
          margin-bottom: 12px;
          padding: 10px 13px;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
        }

        .map {
          width: 100%;
          height: 480px;
          overflow: hidden;
          border:
            1px solid ${theme.border};
          border-radius: 14px;
          z-index: 0;
        }

        .adding .map {
          cursor: crosshair;
          outline:
            3px solid
            rgba(37,99,235,.15);
        }

        .map-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 3px solid white;
          border-radius: 50%;
          background: ${theme.blue};
          box-shadow:
            0 2px 8px
            rgba(0,0,0,.3);
          color: white;
          font-size: 13px;
          font-weight: 800;
        }

        .home-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: 3px solid white;
          border-radius: 50%;
          background: #18181b;
          box-shadow:
            0 2px 10px
            rgba(0,0,0,.35);
          color: white;
        }

        .home-marker span {
          position: relative;
          top: -1px;
          font-size: 25px;
          font-weight: 800;
        }

        /* MOBILE */

        @media (max-width: 700px) {
          .container {
            padding:
              20px 16px
              calc(
                45px +
                env(safe-area-inset-bottom)
              );
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
              repeat(
                3,
                minmax(0,1fr)
              );
            gap: 6px;
          }

          .tab {
            padding: 10px 5px;
            font-size: 12px;
          }

          .day-header {
            display: block;
          }

          .day-info {
            margin-bottom: 25px;
            padding: 16px;
            border-radius: 12px;
            background: ${theme.soft};
          }

          .plan {
            display: block;
          }

          .plan-stop {
            display: block;
          }

          .time {
            display: inline-block;
            margin-bottom: 5px;
            color: ${theme.blue};
          }

          .kind {
            display: block;
            margin: 4px 0 0;
          }

          .route-heading {
            display: block;
          }

          .route-heading
          .primary-button {
            width: 100%;
            min-height: 46px;
            margin-top: 15px;
          }

          .route-item {
            grid-template-columns:
              38px minmax(0,1fr);
          }

          .route-actions {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns:
              repeat(4,1fr);
          }

          .small-button {
            min-height: 42px;
          }

          .map-toolbar {
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .map-button {
            min-height: 46px;
          }

          .map-button:first-child {
            grid-column: 1 / -1;
          }

          .map {
            height: 390px;
          }

          .comment-form input,
          .comment-form button {
            min-height: 44px;
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
            grid-template-columns:
              1fr;
          }

          .tab {
            font-size: 14px;
          }

          .route-actions {
            grid-template-columns:
              1fr 1fr;
          }

          .map-toolbar {
            grid-template-columns:
              1fr;
          }

          .map-button:first-child {
            grid-column: auto;
          }

          .map {
            height: 340px;
          }

          .editor-buttons {
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .comment-form {
            display: grid;
            grid-template-columns:
              minmax(0,1fr) auto;
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

          {/* DAYS */}

          <div className="tabs">
            {days.map((item) => (
              <button
                className={`tab ${
                  selected === item.id
                    ? "active"
                    : ""
                }`}
                key={item.id}
                onClick={() =>
                  setSelected(item.id)
                }
              >
                {item.label} ·{" "}
                {item.date}
              </button>
            ))}
          </div>

          {/* PLAN */}

          <section className="day-header">
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

            <div className="plan">
              {loadingPoints ? (
                <div className="route-status">
                  Ładuję plan...
                </div>
              ) : sortedPoints.length ===
                0 ? (
                <div className="plan-empty">
                  Ten dzień nie ma obecnie
                  żadnych punktów.
                </div>
              ) : (
                sortedPoints.map(
                  (point, index) => (
                    <article
                      className="plan-stop"
                      key={point.id}
                    >
                      <div className="time">
                        {point.time ||
                          "—"}
                      </div>

                      <div>
                        <h3>
                          {index + 1}.{" "}
                          {point.title}

                          {kindLabel(
                            point.kind
                          ) && (
                            <span className="kind">
                              {kindLabel(
                                point.kind
                              )}
                            </span>
                          )}
                        </h3>

                        {point.description && (
                          <p className="note">
                            {
                              point.description
                            }
                          </p>
                        )}

                        <Comments
                          stopId={`map-${point.id}`}
                          username={
                            username
                          }
                        />
                      </div>
                    </article>
                  )
                )
              )}
            </div>
          </section>

          {/* ROUTE MANAGEMENT */}

          <section className="route-section">
            <div className="route-heading">
              <div>
                <h2>
                  Trasa · {day.label}
                </h2>

                <p>
                  Kolejność poniżej jest
                  kolejnością przejścia na
                  mapie.
                </p>
              </div>

              {!adding && (
                <button
                  className="primary-button"
                  onClick={beginAdd}
                >
                  + Dodaj miejsce
                </button>
              )}
            </div>

            <div className="home-info">
              <div className="home-icon">
                ⌂
              </div>

              <div>
                <strong>
                  Nocleg
                </strong>

                <span>
                  Telliskivi tn 26 · stały
                  punkt, nie można go usunąć
                </span>
              </div>
            </div>

            {pointsError && (
              <div className="map-error">
                {pointsError}
              </div>
            )}

            {!loadingPoints && (
              <>
                {sortedPoints.length >
                  0 && (
                  <div className="route-list">
                    {sortedPoints.map(
                      (point, index) => (
                        <div
                          className="route-item"
                          key={point.id}
                        >
                          <div className="route-number">
                            {index + 1}
                          </div>

                          <div>
                            <div className="route-name">
                              {point.time &&
                                `${point.time} · `}

                              {point.title}
                            </div>

                            {point.description && (
                              <div className="route-description">
                                {
                                  point.description
                                }
                              </div>
                            )}
                          </div>

                          <div className="route-actions">
                            <button
                              className="small-button"
                              title="Przesuń wyżej"
                              disabled={
                                index ===
                                  0 ||
                                saving
                              }
                              onClick={() =>
                                void movePoint(
                                  index,
                                  -1
                                )
                              }
                            >
                              ↑
                            </button>

                            <button
                              className="small-button"
                              title="Przesuń niżej"
                              disabled={
                                index ===
                                  sortedPoints.length -
                                    1 ||
                                saving
                              }
                              onClick={() =>
                                void movePoint(
                                  index,
                                  1
                                )
                              }
                            >
                              ↓
                            </button>

                            <button
                              className="small-button edit"
                              disabled={
                                saving
                              }
                              onClick={() =>
                                beginEdit(
                                  point
                                )
                              }
                            >
                              Edytuj
                            </button>

                            <button
                              className="small-button delete"
                              disabled={
                                saving
                              }
                              title="Usuń"
                              onClick={() =>
                                void deletePoint(
                                  point
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* ADD */}

                {adding && (
                  <div className="editor">
                    <h3>
                      Nowe miejsce
                    </h3>

                    {newLat === null ||
                    newLng === null ? (
                      <>
                        <div>
                          Kliknij wybraną
                          lokalizację na mapie
                          poniżej.
                        </div>

                        <button
                          className="secondary-button"
                          onClick={
                            cancelAdd
                          }
                        >
                          Anuluj
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="editor-coordinates">
                          Lokalizacja:{" "}
                          {newLat.toFixed(
                            5
                          )}
                          ,{" "}
                          {newLng.toFixed(
                            5
                          )}
                        </div>

                        <input
                          value={
                            newTitle
                          }
                          onChange={(e) =>
                            setNewTitle(
                              e.target
                                .value
                            )
                          }
                          placeholder="Nazwa miejsca"
                          maxLength={
                            120
                          }
                        />

                        <input
                          value={newTime}
                          onChange={(e) =>
                            setNewTime(
                              e.target
                                .value
                            )
                          }
                          placeholder="Godzina, np. 16:30 (opcjonalnie)"
                          maxLength={20}
                        />

                        <textarea
                          value={
                            newDescription
                          }
                          onChange={(e) =>
                            setNewDescription(
                              e.target
                                .value
                            )
                          }
                          placeholder="Opis miejsca"
                          maxLength={
                            1000
                          }
                        />

                        <div className="editor-buttons">
                          <button
                            className="primary-button"
                            disabled={
                              !newTitle.trim() ||
                              saving
                            }
                            onClick={() =>
                              void addPoint()
                            }
                          >
                            {saving
                              ? "Zapisuję..."
                              : "Dodaj do trasy"}
                          </button>

                          <button
                            className="secondary-button"
                            disabled={
                              saving
                            }
                            onClick={
                              cancelAdd
                            }
                          >
                            Anuluj
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* EDIT */}

                {editing && (
                  <div className="editor">
                    <h3>
                      Edytuj miejsce
                    </h3>

                    <input
                      value={
                        editTitle
                      }
                      onChange={(e) =>
                        setEditTitle(
                          e.target.value
                        )
                      }
                      placeholder="Nazwa miejsca"
                      maxLength={120}
                    />

                    <input
                      value={
                        editTime
                      }
                      onChange={(e) =>
                        setEditTime(
                          e.target.value
                        )
                      }
                      placeholder="Godzina, np. 16:30"
                      maxLength={20}
                    />

                    <textarea
                      value={
                        editDescription
                      }
                      onChange={(e) =>
                        setEditDescription(
                          e.target.value
                        )
                      }
                      placeholder="Opis miejsca"
                      maxLength={1000}
                    />

                    <div className="editor-buttons">
                      <button
                        className="primary-button"
                        disabled={
                          !editTitle.trim() ||
                          saving
                        }
                        onClick={() =>
                          void saveEdit()
                        }
                      >
                        {saving
                          ? "Zapisuję..."
                          : "Zapisz"}
                      </button>

                      <button
                        className="secondary-button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          setEditing(
                            null
                          )
                        }
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                )}

                <Map
                  points={sortedPoints}
                  adding={adding}
                  onMapClick={
                    chooseNewLocation
                  }
                />
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
