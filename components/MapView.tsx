'use client';

import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
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

// 도쿄 주요 장소 좌표 (한국어 이름 포함)
const locationCoordinates: Record<string, { coords: [number, number], korean: string, japanese: string }> = {
  '센소지': { coords: [35.7148, 139.7967], korean: '센소지 (아사쿠사 절)', japanese: '浅草寺' },
  '도쿄 스카이트리': { coords: [35.7101, 139.8107], korean: '도쿄 스카이트리', japanese: 'スカイツリー' },
  '아키하바라': { coords: [35.7022, 139.7742], korean: '아키하바라 전자상가', japanese: '秋葉原' },
  '메이지 신궁': { coords: [35.6764, 139.6993], korean: '메이지 신궁', japanese: '明治神宮' },
  '하라주쿠': { coords: [35.6702, 139.7027], korean: '하라주쿠 거리', japanese: '原宿' },
  '시부야': { coords: [35.6595, 139.7004], korean: '시부야', japanese: '渋谷' },
  '츠키지': { coords: [35.6654, 139.7707], korean: '츠키지 시장', japanese: '築地' },
  '황궁': { coords: [35.6852, 139.7528], korean: '황궁 외원', japanese: '皇居' },
  '긴자': { coords: [35.6717, 139.7646], korean: '긴자 쇼핑거리', japanese: '銀座' },
  '오다이바': { coords: [35.6262, 139.7744], korean: '오다이바 해변공원', japanese: 'お台場' },
  '우에노': { coords: [35.7141, 139.7774], korean: '우에노 공원', japanese: '上野' },
  '나리타': { coords: [35.7720, 140.3929], korean: '나리타 국제공항', japanese: '成田空港' },
};

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

// 한국어 라벨이 있는 커스텀 마커 생성
const createCustomIcon = (category: string, day: number) => {
  const emoji = categoryEmojis[category] || '📍';
  const color = categoryColors[category] || '#3b82f6';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: 50px; height: 60px;">
        <!-- 마커 핀 -->
        <div style="
          background-color: ${color};
          width: 45px;
          height: 45px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 0;
          left: 0;
        ">
          <div style="
            font-size: 22px;
            transform: rotate(45deg);
          ">${emoji}</div>
        </div>
        <!-- Day 배지 -->
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: white;
          border: 2px solid ${color};
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: ${color};
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">D${day}</div>
      </div>
    `,
    iconSize: [50, 60],
    iconAnchor: [22, 50],
    popupAnchor: [0, -50],
  });
};

// 위치에서 좌표 및 한국어 정보 가져오기
const getLocationInfo = (location: string | null): { coords: [number, number], korean: string, japanese: string } | null => {
  if (!location) return null;

  for (const [key, info] of Object.entries(locationCoordinates)) {
    if (location.includes(key)) {
      return info;
    }
  }

  return null;
};

export default function MapView({ schedules }: MapViewProps) {
  // 좌표가 있는 일정 필터링 및 정보 추가
  const schedulesWithCoords = schedules
    .map(schedule => ({
      ...schedule,
      locationInfo: getLocationInfo(schedule.location),
    }))
    .filter(s => s.locationInfo !== null);

  // 도쿄 중심 좌표
  const tokyoCenter: [number, number] = [35.6762, 139.6503];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          🗺️ 도쿄 여행지 지도
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {schedulesWithCoords.length}개 위치가 지도에 표시됩니다 · 한국어로 안내
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm">
              <div style={{ width: '12px', height: '12px', backgroundColor: color, borderRadius: '50%' }} />
              <span className="font-medium">{categoryEmojis[category]} {category}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '700px', width: '100%' }}>
        <MapContainer
          center={tokyoCenter}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap 타일 레이어 */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {schedulesWithCoords.map((schedule) => (
            <Marker
              key={schedule.id}
              position={schedule.locationInfo!.coords}
              icon={createCustomIcon(schedule.category, schedule.day)}
            >
              {/* 호버 시 간단 정보 */}
              <Tooltip direction="top" offset={[0, -50]} opacity={0.95}>
                <div className="font-bold text-sm">
                  {schedule.title}
                </div>
              </Tooltip>

              {/* 클릭 시 상세 정보 */}
              <Popup maxWidth={300} className="custom-popup">
                <div className="p-1">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b-2" style={{ borderColor: categoryColors[schedule.category] }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{categoryEmojis[schedule.category]}</span>
                      <div>
                        <div className="text-xs text-gray-500">Day {schedule.day} · {schedule.time}</div>
                        <div className="font-bold text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                             style={{ backgroundColor: categoryColors[schedule.category] + '20', color: categoryColors[schedule.category] }}>
                          {schedule.category}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 장소명 (한국어) */}
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {schedule.title}
                  </h3>

                  {/* 위치 정보 */}
                  <div className="bg-blue-50 rounded-lg p-2 mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">📍</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-blue-900">
                          {schedule.locationInfo!.korean}
                        </div>
                        <div className="text-xs text-blue-600 mt-0.5">
                          {schedule.locationInfo!.japanese}
                        </div>
                        {schedule.location && (
                          <div className="text-xs text-gray-600 mt-1">
                            {schedule.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 설명 */}
                  {schedule.description && (
                    <div className="bg-gray-50 rounded-lg p-2 mb-2">
                      <div className="text-xs text-gray-500 mb-1">💡 여행 팁</div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {schedule.description}
                      </p>
                    </div>
                  )}

                  {/* 시간 정보 */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 pt-2 border-t">
                    <span>🕐</span>
                    <span>방문 시간: {schedule.time}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 범례 및 안내 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold text-gray-900 dark:text-white mb-2">💡 사용 방법</div>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-xs">
              <li>• 마커를 클릭하면 상세 정보를 볼 수 있습니다</li>
              <li>• 마우스 휠로 확대/축소가 가능합니다</li>
              <li>• 드래그하여 지도를 이동할 수 있습니다</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white mb-2">📌 마커 안내</div>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-xs">
              <li>• 마커 색상: 카테고리별 구분</li>
              <li>• D1~D4 배지: 여행 일차</li>
              <li>• 한국어/일본어 지명 병기</li>
            </ul>
          </div>
        </div>
      </div>

      {schedulesWithCoords.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-lg font-semibold mb-2">위치 정보가 없습니다</div>
          <p className="text-sm">일정에 위치를 추가하면 지도에 표시됩니다</p>
        </div>
      )}
    </div>
  );
}
