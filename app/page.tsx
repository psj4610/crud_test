'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Plus,
  Edit,
  Trash2,
  Landmark,
  UtensilsCrossed,
  ShoppingBag,
  Train,
  Map as MapIcon,
  List,
  X,
  Save
} from 'lucide-react';
import dynamic from 'next/dynamic';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Dynamically import MapView to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

interface TravelSchedule {
  id: number;
  day: number;
  time: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

const categoryIcons = {
  '관광': Landmark,
  '식사': UtensilsCrossed,
  '쇼핑': ShoppingBag,
  '이동': Train,
};

const categoryColors = {
  '관광': { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
  '식사': { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  '쇼핑': { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
  '이동': { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50' },
};

export default function Home() {
  const [schedules, setSchedules] = useState<TravelSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'map'>('timeline');
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [day, setDay] = useState<number>(1);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('관광');
  const [location, setLocation] = useState('');

  // Edit states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDay, setEditDay] = useState<number>(1);
  const [editTime, setEditTime] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('관광');
  const [editLocation, setEditLocation] = useState('');

  const [loading, setLoading] = useState(false);

  // READ - Fetch all schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('travel_schedule')
        .select('*')
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // CREATE
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time.trim() || !title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('travel_schedule')
        .insert([{
          day,
          time,
          title,
          description: description || null,
          category,
          location: location || null
        }]);

      if (error) throw error;

      await fetchSchedules();
      setTime('');
      setTitle('');
      setDescription('');
      setLocation('');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE
  const handleUpdate = async (id: number) => {
    if (!editTime.trim() || !editTitle.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('travel_schedule')
        .update({
          day: editDay,
          time: editTime,
          title: editTitle,
          description: editDescription || null,
          category: editCategory,
          location: editLocation || null
        })
        .eq('id', id);

      if (error) throw error;

      await fetchSchedules();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (schedule: TravelSchedule) => {
    setEditingId(schedule.id);
    setEditDay(schedule.day);
    setEditTime(schedule.time);
    setEditTitle(schedule.title);
    setEditDescription(schedule.description || '');
    setEditCategory(schedule.category);
    setEditLocation(schedule.location || '');
  };

  // DELETE
  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('travel_schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(s => s.day === selectedDay);

  // Calendar events
  const calendarEvents = schedules.map(s => ({
    id: String(s.id),
    title: s.title,
    start: `2025-03-0${s.day}T${s.time}`,
    backgroundColor: categoryColors[s.category as keyof typeof categoryColors]?.bg.replace('bg-', '#') || '#3b82f6',
    extendedProps: { ...s }
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent mb-2">
              🇯🇵 도쿄 3박4일 여행 계획표
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Tokyo Family Trip Itinerary</p>
          </div>

          {/* View Mode Tabs */}
          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              <List size={20} />
              타임라인
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              <CalendarIcon size={20} />
              캘린더
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              <MapIcon size={20} />
              지도
            </button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Day Selector */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((dayNum) => (
                <motion.button
                  key={dayNum}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`flex-shrink-0 px-8 py-4 rounded-xl font-bold transition-all ${
                    selectedDay === dayNum
                      ? 'bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-xl'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="text-2xl">Day {dayNum}</div>
                  <div className="text-sm mt-1 opacity-90">
                    {schedules.filter(s => s.day === dayNum).length}개 일정
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Add Button */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="text-red-600" />
                Day {selectedDay} 일정
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
              >
                {showForm ? <X size={20} /> : <Plus size={20} />}
                {showForm ? '취소' : '일정 추가'}
              </motion.button>
            </div>

            {/* CREATE Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Plus className="text-blue-600" />
                      새 일정 추가
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            일차
                          </label>
                          <select
                            value={day}
                            onChange={(e) => setDay(Number(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            disabled={loading}
                          >
                            {[1, 2, 3, 4].map(d => <option key={d} value={d}>Day {d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            시간 *
                          </label>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            카테고리
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            disabled={loading}
                          >
                            <option value="관광">🏛️ 관광</option>
                            <option value="식사">🍜 식사</option>
                            <option value="쇼핑">🛍️ 쇼핑</option>
                            <option value="이동">🚌 이동</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          제목 *
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="방문지 또는 활동명"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          위치
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="주소 또는 지역"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          설명
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="메모나 팁을 입력하세요"
                          rows={3}
                          disabled={loading}
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                      >
                        {loading ? '추가중...' : '일정 추가하기'}
                      </motion.button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-orange-500 to-yellow-500 rounded-full" />

              {filteredSchedules.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center"
                >
                  <CalendarIcon size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Day {selectedDay}에 등록된 일정이 없습니다.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {filteredSchedules.map((schedule, index) => {
                    const Icon = categoryIcons[schedule.category as keyof typeof categoryIcons];
                    const colors = categoryColors[schedule.category as keyof typeof categoryColors];

                    return (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-20"
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute left-5 top-6 w-7 h-7 ${colors.bg} rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center`}>
                          <Icon size={14} className="text-white" />
                        </div>

                        {editingId === schedule.id ? (
                          // Edit Form
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
                          >
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select
                                  value={editDay}
                                  onChange={(e) => setEditDay(Number(e.target.value))}
                                  className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  disabled={loading}
                                >
                                  {[1, 2, 3, 4].map(d => <option key={d} value={d}>Day {d}</option>)}
                                </select>
                                <input
                                  type="time"
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                  className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  disabled={loading}
                                />
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  disabled={loading}
                                >
                                  <option value="관광">🏛️ 관광</option>
                                  <option value="식사">🍜 식사</option>
                                  <option value="쇼핑">🛍️ 쇼핑</option>
                                  <option value="이동">🚌 이동</option>
                                </select>
                              </div>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="제목"
                                disabled={loading}
                              />
                              <input
                                type="text"
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="위치"
                                disabled={loading}
                              />
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="설명"
                                rows={2}
                                disabled={loading}
                              />
                              <div className="flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleUpdate(schedule.id)}
                                  disabled={loading}
                                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                                >
                                  <Save size={18} />
                                  저장
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setEditingId(null)}
                                  disabled={loading}
                                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                                >
                                  <X size={18} />
                                  취소
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          // Display Card
                          <motion.div
                            whileHover={{ scale: 1.02, translateX: 10 }}
                            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4 ${colors.bg.replace('bg-', 'border-')}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock size={20} className={colors.text} />
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                      {schedule.time}
                                    </span>
                                  </div>
                                  <span className={`px-4 py-1 rounded-full text-sm font-bold ${colors.light} ${colors.text}`}>
                                    {schedule.category}
                                  </span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                  {schedule.title}
                                </h3>
                                {schedule.location && (
                                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                                    <MapPin size={16} />
                                    <span>{schedule.location}</span>
                                  </div>
                                )}
                                {schedule.description && (
                                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                                    {schedule.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => startEdit(schedule)}
                                className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-xl transition-all"
                              >
                                <Edit size={16} />
                                수정
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(schedule.id)}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                                삭제
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              height="auto"
              slotMinTime="08:00:00"
              slotMaxTime="23:00:00"
              allDaySlot={false}
              locale="ko"
            />
          </motion.div>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MapView schedules={schedules} />
          </motion.div>
        )}

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[1, 2, 3, 4].map((dayNum) => {
            const daySchedules = schedules.filter(s => s.day === dayNum);
            const stats = {
              관광: daySchedules.filter(s => s.category === '관광').length,
              식사: daySchedules.filter(s => s.category === '식사').length,
              쇼핑: daySchedules.filter(s => s.category === '쇼핑').length,
              이동: daySchedules.filter(s => s.category === '이동').length,
            };
            return (
              <motion.div
                key={dayNum}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5"
              >
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Day {dayNum}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>🏛️ 관광</span><span className="font-bold">{stats.관광}</span></div>
                  <div className="flex justify-between"><span>🍜 식사</span><span className="font-bold">{stats.식사}</span></div>
                  <div className="flex justify-between"><span>🛍️ 쇼핑</span><span className="font-bold">{stats.쇼핑}</span></div>
                  <div className="flex justify-between"><span>🚌 이동</span><span className="font-bold">{stats.이동}</span></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
