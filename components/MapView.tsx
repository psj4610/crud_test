'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TravelSchedule {
  id: number;
  day: number;
  time: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
}

interface MapViewProps {
  schedules: TravelSchedule[];
}

// Fix for default marker icon in production
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Sample coordinates for Tokyo locations
const locationCoordinates: Record<string, [number, number]> = {
  '센소지': [35.7148, 139.7967],
  '도쿄 스카이트리': [35.7101, 139.8107],
  '아키하바라': [35.7022, 139.7742],
  '메이지 신궁': [35.6764, 139.6993],
  '하라주쿠': [35.6702, 139.7027],
  '시부야': [35.6595, 139.7004],
  '츠키지': [35.6654, 139.7707],
  '황궁': [35.6852, 139.7528],
  '긴자': [35.6717, 139.7646],
  '오다이바': [35.6262, 139.7744],
  '우에노': [35.7141, 139.7774],
  '나리타': [35.7720, 140.3929],
};

// Category icons using emoji
const categoryEmojis: Record<string, string> = {
  '관광': '🏛️',
  '식사': '🍜',
  '쇼핑': '🛍️',
  '이동': '🚌',
};

const categoryColors: Record<string, string> = {
  '관광': '#3b82f6',
  '식사': '#f97316',
  '쇼핑': '#a855f7',
  '이동': '#6b7280',
};

// Create custom icon
const createCustomIcon = (category: string) => {
  const emoji = categoryEmojis[category] || '📍';
  const color = categoryColors[category] || '#3b82f6';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          font-size: 20px;
          transform: rotate(45deg);
        ">${emoji}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Get coordinates from location string
const getCoordinates = (location: string | null): [number, number] | null => {
  if (!location) return null;

  // Try to find matching location
  for (const [key, coords] of Object.entries(locationCoordinates)) {
    if (location.includes(key)) {
      return coords;
    }
  }

  return null;
};

export default function MapView({ schedules }: MapViewProps) {
  // Filter schedules that have coordinates
  const schedulesWithCoords = schedules
    .map(schedule => ({
      ...schedule,
      coords: getCoordinates(schedule.location),
    }))
    .filter(s => s.coords !== null);

  // Tokyo center coordinates
  const tokyoCenter: [number, number] = [35.6762, 139.6503];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🗺️ 여행지 지도
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {schedulesWithCoords.length}개 위치가 지도에 표시됩니다
        </p>
      </div>

      <div style={{ height: '600px', width: '100%' }}>
        <MapContainer
          center={tokyoCenter}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {schedulesWithCoords.map((schedule) => (
            <Marker
              key={schedule.id}
              position={schedule.coords!}
              icon={createCustomIcon(schedule.category)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold">{schedule.time}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100">
                      Day {schedule.day}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{schedule.title}</h3>
                  {schedule.location && (
                    <p className="text-sm text-gray-600 mb-2">📍 {schedule.location}</p>
                  )}
                  {schedule.description && (
                    <p className="text-sm text-gray-700">{schedule.description}</p>
                  )}
                  <div className="mt-2 pt-2 border-t">
                    <span className="inline-block px-2 py-1 rounded text-xs font-bold"
                          style={{ backgroundColor: categoryColors[schedule.category] + '20', color: categoryColors[schedule.category] }}>
                      {categoryEmojis[schedule.category]} {schedule.category}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {schedulesWithCoords.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          위치 정보가 있는 일정이 없습니다. 일정에 위치를 추가해보세요!
        </div>
      )}
    </div>
  );
}
