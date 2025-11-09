'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

const categoryColors = {
  '관광': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300',
  '식사': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300',
  '쇼핑': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300',
  '이동': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300',
};

export default function Home() {
  const [schedules, setSchedules] = useState<TravelSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
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
      alert('일정을 불러오는데 실패했습니다.');
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
      const { data, error } = await supabase
        .from('travel_schedule')
        .insert([{
          day,
          time,
          title,
          description: description || null,
          category,
          location: location || null
        }])
        .select();

      if (error) throw error;

      if (data) {
        await fetchSchedules();
        setTime('');
        setTitle('');
        setDescription('');
        setLocation('');
        setShowForm(false);
        alert('일정이 성공적으로 추가되었습니다!');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('일정 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE
  const handleUpdate = async (id: number) => {
    if (!editTime.trim() || !editTitle.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('travel_schedule')
        .update({
          day: editDay,
          time: editTime,
          title: editTitle,
          description: editDescription || null,
          category: editCategory,
          location: editLocation || null
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data) {
        await fetchSchedules();
        setEditingId(null);
        alert('일정이 성공적으로 수정되었습니다!');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('일정 수정에 실패했습니다.');
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

  const cancelEdit = () => {
    setEditingId(null);
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
      alert('일정이 성공적으로 삭제되었습니다!');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('일정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(s => s.day === selectedDay);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            🇯🇵 도쿄 3박4일 여행 계획표
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Tokyo Family Trip Itinerary
          </p>
          <div className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-semibold">
            ✓ Supabase 연동 완료
          </div>
        </div>

        {/* Day Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex gap-2 justify-center flex-wrap">
            {[1, 2, 3, 4].map((dayNum) => (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedDay === dayNum
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Day {dayNum}
                <span className="block text-xs mt-1">
                  ({schedules.filter(s => s.day === dayNum).length}개 일정)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Day {selectedDay} 일정 ({filteredSchedules.length}개)
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {showForm ? '취소' : '+ 새 일정 추가'}
          </button>
        </div>

        {/* CREATE Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value={1}>Day 1</option>
                    <option value={2}>Day 2</option>
                    <option value={3}>Day 3</option>
                    <option value={4}>Day 4</option>
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="관광">관광</option>
                    <option value="식사">식사</option>
                    <option value="쇼핑">쇼핑</option>
                    <option value="이동">이동</option>
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="메모나 팁을 입력하세요"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '추가중...' : '일정 추가하기'}
              </button>
            </form>
          </div>
        )}

        {/* Schedule List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {loading && schedules.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              불러오는 중...
            </p>
          ) : filteredSchedules.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Day {selectedDay}에 등록된 일정이 없습니다. 위에서 새 일정을 추가해보세요!
            </p>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`border-2 rounded-lg p-4 transition-shadow hover:shadow-md ${
                    categoryColors[schedule.category as keyof typeof categoryColors] || categoryColors['관광']
                  }`}
                >
                  {editingId === schedule.id ? (
                    // UPDATE Form
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          value={editDay}
                          onChange={(e) => setEditDay(Number(e.target.value))}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          disabled={loading}
                        >
                          <option value={1}>Day 1</option>
                          <option value={2}>Day 2</option>
                          <option value={3}>Day 3</option>
                          <option value={4}>Day 4</option>
                        </select>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          disabled={loading}
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          disabled={loading}
                        >
                          <option value="관광">관광</option>
                          <option value="식사">식사</option>
                          <option value="쇼핑">쇼핑</option>
                          <option value="이동">이동</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="제목"
                        disabled={loading}
                      />
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="위치"
                        disabled={loading}
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="설명"
                        rows={2}
                        disabled={loading}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(schedule.id)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                          {loading ? '저장중...' : '저장'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {schedule.time}
                            </span>
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white dark:bg-gray-800 shadow-sm">
                              {schedule.category}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {schedule.title}
                          </h3>
                          {schedule.location && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              📍 {schedule.location}
                            </p>
                          )}
                          {schedule.description && (
                            <p className="text-gray-700 dark:text-gray-300">
                              {schedule.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => startEdit(schedule)}
                          disabled={loading}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((dayNum) => {
            const daySchedules = schedules.filter(s => s.day === dayNum);
            const categories = {
              관광: daySchedules.filter(s => s.category === '관광').length,
              식사: daySchedules.filter(s => s.category === '식사').length,
              쇼핑: daySchedules.filter(s => s.category === '쇼핑').length,
              이동: daySchedules.filter(s => s.category === '이동').length,
            };
            return (
              <div key={dayNum} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Day {dayNum}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>🏛️ 관광: {categories.관광}개</p>
                  <p>🍜 식사: {categories.식사}개</p>
                  <p>🛍️ 쇼핑: {categories.쇼핑}개</p>
                  <p>🚌 이동: {categories.이동}개</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
