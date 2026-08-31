import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Kind = "museum" | "food" | "sight" | "logistics";

type Stop = {
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

const theme = {
  bg: { editor: "#fff" },
  text: {
    primary: "#18181b",
    secondary: "#52525b",
    tertiary: "#71717a",
    onAccent: "#fff",
  },
  accent: { primary: "#2563eb", control: "#2563eb" },
  stroke: { primary: "#e4e4e7", secondary: "#d4d4d8" },
  fill: { tertiary: "#f4f4f5" },
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
    stops: [
      {
        time: "08:55",
        title: "Lądowanie w Tallinnie",
        note:
          "Czas lokalny jest o godzinę do przodu względem Polski. Dla 4 osób z bagażem najwygodniejszy będzie Bolt.",
        kind: "logistics",
        lat: 59.4133,
        lng: 24.8328,
      },
      {
        time: "10:00",
        title: "Bagaże i późne śniadanie",
        note:
          "Zostawcie bagaże przy Telliskivi 26. Balti Jaama Turg jest kilka minut pieszo i ma dużo szybkich opcji jedzenia.",
        kind: "food",
        lat: 59.4407,
        lng: 24.7352,
      },
      {
        time: "11:15",
        title: "Toompea i najlepsze panoramy",
        note:
          "Patkuli → Kohtuotsa → zamek Toompea z zewnątrz → sobór Aleksandra Newskiego → Ogród Króla Duńskiego.",
        kind: "sight",
        lat: 59.4366,
        lng: 24.7386,
      },
      {
        time: "12:15",
        title: "Kiek in de Kök i tunele bastionowe",
        note:
          "Najlepsze muzeum na połączenie zabytków z historią miasta. Zarezerwujcie około 2 godzin; w tunelach jest 10–12°C.",
        kind: "museum",
        lat: 59.4348,
        lng: 24.7412,
      },
      {
        time: "14:30",
        title: "Dolne Stare Miasto",
        note:
          "Niguliste z zewnątrz → Plac Ratuszowy → Raeapteek → Pasaż św. Katarzyny → brama Viru → ulica Pikk i baszta Gruba Małgorzata.",
        kind: "sight",
        lat: 59.4370,
        lng: 24.7453,
      },
      {
        time: "18:00",
        title: "Kolacja: Rataskaevu 16",
        note:
          "Bardzo popularna restauracja w Starym Mieście. Rezerwacja dla 4 osób jest mocno wskazana.",
        kind: "food",
        lat: 59.4370,
        lng: 24.7420,
      },
      {
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
        time: "09:00",
        title: "Śniadanie w okolicy Telliskivi",
        note: "Zjedzcie blisko noclegu i ruszcie około 09:30.",
        kind: "food",
        lat: 59.4393,
        lng: 24.7298,
      },
      {
        time: "10:00",
        title: "Kumu Art Museum",
        note:
          "Najważniejsze muzeum sztuki Estonii. Zaplanujcie 2–2,5 godziny.",
        kind: "museum",
        lat: 59.4363,
        lng: 24.7964,
      },
      {
        time: "12:45",
        title: "Pałac i park Kadriorg",
        note:
          "Barokowy pałac, ogród kwiatowy, Staw Łabędzi i rezydencja prezydencka z zewnątrz.",
        kind: "sight",
        lat: 59.4385,
        lng: 24.7908,
      },
      {
        time: "14:15",
        title: "Lunch w Kadriorgu",
        note:
          "Wybierzcie spokojną kawiarnię lub restaurację w dzielnicy.",
        kind: "food",
        lat: 59.4392,
        lng: 24.7890,
      },
      {
        time: "15:30",
        title: "Russalka i nadmorska promenada",
        note: "Krótki spacer do pomnika Russalka.",
        kind: "sight",
        lat: 59.4433,
        lng: 24.7935,
      },
      {
        time: "17:00",
        title: "Rotermann Quarter",
        note:
          "Dawne zabudowania przemysłowe połączone ze współczesną architekturą.",
        kind: "sight",
        lat: 59.4385,
        lng: 24.7558,
      },
      {
        time: "19:00",
        title: "Kolacja: RADO",
        note:
          "Nowoczesna kuchnia, menu zmieniane codziennie. Koniecznie rezerwacja.",
        kind: "food",
        lat: 59.4380,
        lng: 24.7480,
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
        time: "09:00",
        title: "Balti Jaama Turg",
        note: "Śniadanie i szybkie zakupy.",
        kind: "food",
        lat: 59.4407,
        lng: 24.7352,
      },
      {
        time: "10:00",
        title: "Seaplane Harbour — Lennusadam",
        note:
          "Okręt podwodny Lembit, hangary wodnosamolotów i lodołamacz Suur Tõll.",
        kind: "museum",
        lat: 59.4513,
        lng: 24.7384,
      },
      {
        time: "12:45",
        title: "Patarei i Noblessner",
        note:
          "Dawna twierdza-więzienie i odnowiony port Noblessner.",
        kind: "sight",
        lat: 59.4515,
        lng: 24.7310,
      },
      {
        time: "13:30",
        title: "Lunch: Lore Bistroo",
        note:
          "Restauracja w przemysłowym budynku portowym. Rezerwacja wskazana.",
        kind: "food",
        lat: 59.4531,
        lng: 24.7276,
      },
      {
        time: "15:30",
        title: "Kalamaja i drewniane domy",
        note:
          "Spokojny powrót przez uliczki Kalamaja i Telliskivi Creative City.",
        kind: "sight",
        lat: 59.4442,
        lng: 24.7300,
      },
      {
        time: "18:30",
        title: "Ostatnia kolacja: F-Hoone",
        note:
          "Luźna, industrialna restauracja w Telliskivi, blisko noclegu.",
        kind: "food",
        lat: 59.4390,
        lng: 24.7290,
      },
      {
        time: "21:00",
        title: "Pakowanie i wczesny sen",
        note:
          "Na lot o 07:00 zamówcie Bolt około 04:40–04:45.",
        kind: "logistics",
        lat: 59.4400,
        lng: 24.7320,
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

function Map({ day }: { day: Day }) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapElement.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const points = day.stops.filter(
      (stop): stop is Stop & { lat: number; lng: number } =>
        stop.lat !== undefined && stop.lng !== undefined
    );

    const map = L.map(mapElement.current, {
      scrollWheelZoom: false,
    });

    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const coordinates: L.LatLngExpression[] = [];

    points.forEach((stop, index) => {
      const position: L.LatLngExpression = [stop.lat, stop.lng];

      coordinates.push(position);

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            width:30px;
            height:30px;
            border-radius:50%;
            background:#2563eb;
            color:white;
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.28);
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:13px;
            font-weight:800;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker(position, { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px">
            <strong>${index + 1}. ${stop.title}</strong>
            <div style="margin-top:4px">${stop.time}</div>
          </div>
        `);
    });

    if (coordinates.length > 1) {
      L.polyline(coordinates, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.75,
      }).addTo(map);

      map.fitBounds(L.latLngBounds(coordinates), {
        padding: [40, 40],
      });
    } else if (coordinates.length === 1) {
      map.setView(coordinates[0], 14);
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [day]);

  return (
    <div
      ref={mapElement}
      style={{
        height: 440,
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${theme.stroke.primary}`,
        overflow: "hidden",
      }}
    />
  );
}

export default function App() {
  const [selected, setSelected] = useState("fri");

  const day = days.find((d) => d.id === selected) ?? days[0];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.bg.editor,
        color: theme.text.primary,
        padding: 24,
        fontFamily: "system-ui,sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            paddingBottom: 22,
            borderBottom: `1px solid ${theme.stroke.primary}`,
          }}
        >
          <div
            style={{
              color: theme.accent.primary,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            PLAN DLA 4 OSÓB
          </div>

          <h1>Tallinn: zabytki, muzea i dobre stoły</h1>

          <p style={{ color: theme.text.secondary }}>
            4–7 września 2026 · baza: Telliskivi tn 26
          </p>
        </header>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {days.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                style={{
                  border: `1px solid ${
                    d.id === selected
                      ? theme.accent.primary
                      : theme.stroke.primary
                  }`,
                  background:
                    d.id === selected ? theme.accent.control : "#fff",
                  color:
                    d.id === selected ? "#fff" : theme.text.primary,
                  padding: "9px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 650,
                }}
              >
                {d.label} · {d.date}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "240px minmax(0,1fr)",
              gap: 28,
              marginTop: 22,
            }}
          >
            <aside>
              <h2>{day.title}</h2>
              <p>{day.distance}</p>

              <p style={{ color: theme.text.secondary }}>
                {day.transport}
              </p>
            </aside>

            <div>
              {day.stops.map((s, i) => (
                <div
                  key={s.time + s.title}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "66px minmax(0,1fr)",
                    gap: 16,
                    paddingBottom: 22,
                    borderBottom:
                      i < day.stops.length - 1
                        ? `1px solid ${theme.stroke.primary}`
                        : "none",
                    marginBottom: 18,
                  }}
                >
                  <strong>{s.time}</strong>

                  <div>
                    <h3 style={{ margin: 0 }}>
                      {i + 1}. {s.title}{" "}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: theme.text.tertiary,
                        }}
                      >
                        {s.kind ? labels[s.kind] : ""}
                      </span>
                    </h3>

                    <p
                      style={{
                        color: theme.text.secondary,
                        lineHeight: 1.55,
                      }}
                    >
                      {s.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <section style={{ marginTop: 36 }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ marginBottom: 6 }}>
                Trasa · {day.label}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: theme.text.secondary,
                }}
              >
                Punkty na mapie odpowiadają kolejności planu dnia.
              </p>
            </div>

            <Map day={day} />
          </section>
        </section>
      </div>
    </main>
  );
}
