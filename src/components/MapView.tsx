import { useEffect, useRef } from "react";
import * as L from "leaflet";

type Props = {
  onPickPoint?: (lat: number, lng: number) => void;
};

export default function MapView({ onPickPoint }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", { zoomControl: false }).setView([39.7036, 141.1527], 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
      onPickPoint?.(lat, lng);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
        () => {}
      );
    }
  }, [onPickPoint]);

  return <div id="map" style={{ height: "100%", width: "100%" }} />;
}
