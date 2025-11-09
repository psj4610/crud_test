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
  Save,
  Sparkles
} from 'lucide-react';
import dynamic from 'next/dynamic';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

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
  '관광': 'bg-blue-500',
  '식사': 'bg-orange-500',
  '쇼핑': 'bg-purple-500',
  '이동': 'bg-gray-500',
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

  // Calendar events - Map days to December 3-7, 2024
  const dayToDate: Record<number, string> = {
    1: '2024-12-03',
    2: '2024-12-04',
    3: '2024-12-05',
    4: '2024-12-06',
    5: '2024-12-07'
  };

  const calendarEvents = schedules.map(s => ({
    id: String(s.id),
    title: s.title,
    start: `${dayToDate[s.day]}T${s.time}`,
    backgroundColor: categoryColors[s.category as keyof typeof categoryColors] || '#3b82f6',
    extendedProps: { ...s }
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl sticky top-0 z-50 border-b"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            className="text-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Sparkles className="w-8 h-8 text-orange-500" />
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                나고야 여행 계획표
              </h1>
              <Sparkles className="w-8 h-8 text-pink-500" />
            </div>
            <p className="text-lg text-muted-foreground font-medium">
              🇯🇵 Nagoya Trip Itinerary · 12/03-12/07 (5일)
            </p>
          </motion.div>

          {/* View Mode Tabs */}
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  타임라인
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  캘린더
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4" />
                  지도
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Timeline View */}
        <AnimatePresence mode="wait">
          {viewMode === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Day Selector */}
              <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map((dayNum, index) => (
                  <motion.div
                    key={dayNum}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      onClick={() => setSelectedDay(dayNum)}
                      variant={selectedDay === dayNum ? "default" : "outline"}
                      size="lg"
                      className={selectedDay === dayNum
                        ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                        : ""
                      }
                    >
                      <div>
                        <div className="text-lg font-bold">Day {dayNum}</div>
                        <div className="text-xs opacity-80">
                          {schedules.filter(s => s.day === dayNum).length}개 일정
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Add Button */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <CalendarIcon className="text-orange-600 w-8 h-8" />
                  Day {selectedDay} 일정
                </h2>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                  {showForm ? '취소' : '일정 추가'}
                </Button>
              </div>

              {/* CREATE Form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="text-blue-600" />
                          새 일정 추가
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="day">일차</Label>
                              <Select
                                id="day"
                                value={String(day)}
                                onChange={(e) => setDay(Number(e.target.value))}
                                disabled={loading}
                              >
                                {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>Day {d}</option>)}
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="time">시간 *</Label>
                              <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                disabled={loading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category">카테고리</Label>
                              <Select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={loading}
                              >
                                <option value="관광">🏛️ 관광</option>
                                <option value="식사">🍜 식사</option>
                                <option value="쇼핑">🛍️ 쇼핑</option>
                                <option value="이동">🚌 이동</option>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="title">제목 *</Label>
                            <Input
                              id="title"
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="방문지 또는 활동명"
                              required
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">위치</Label>
                            <Input
                              id="location"
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="주소 또는 지역"
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">설명</Label>
                            <Textarea
                              id="description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="메모나 팁을 입력하세요"
                              rows={3}
                              disabled={loading}
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            size="lg"
                          >
                            {loading ? '추가중...' : '일정 추가하기'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timeline */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 via-red-500 to-pink-500 rounded-full" />

                {filteredSchedules.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CalendarIcon size={64} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg text-muted-foreground">
                        Day {selectedDay}에 등록된 일정이 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {filteredSchedules.map((schedule, index) => {
                      const Icon = categoryIcons[schedule.category as keyof typeof categoryIcons];
                      const color = categoryColors[schedule.category as keyof typeof categoryColors];

                      return (
                        <motion.div
                          key={schedule.id}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-20"
                        >
                          {/* Timeline Dot */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                            className={`absolute left-5 top-6 w-7 h-7 ${color} rounded-full border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center`}
                          >
                            <Icon size={14} className="text-white" />
                          </motion.div>

                          {editingId === schedule.id ? (
                            // Edit Form
                            <Card>
                              <CardContent className="pt-6">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Select
                                      value={String(editDay)}
                                      onChange={(e) => setEditDay(Number(e.target.value))}
                                      disabled={loading}
                                    >
                                      {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>Day {d}</option>)}
                                    </Select>
                                    <Input
                                      type="time"
                                      value={editTime}
                                      onChange={(e) => setEditTime(e.target.value)}
                                      disabled={loading}
                                    />
                                    <Select
                                      value={editCategory}
                                      onChange={(e) => setEditCategory(e.target.value)}
                                      disabled={loading}
                                    >
                                      <option value="관광">🏛️ 관광</option>
                                      <option value="식사">🍜 식사</option>
                                      <option value="쇼핑">🛍️ 쇼핑</option>
                                      <option value="이동">🚌 이동</option>
                                    </Select>
                                  </div>
                                  <Input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="제목"
                                    disabled={loading}
                                  />
                                  <Input
                                    type="text"
                                    value={editLocation}
                                    onChange={(e) => setEditLocation(e.target.value)}
                                    placeholder="위치"
                                    disabled={loading}
                                  />
                                  <Textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="설명"
                                    rows={2}
                                    disabled={loading}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleUpdate(schedule.id)}
                                      disabled={loading}
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                      <Save className="w-4 h-4 mr-2" />
                                      저장
                                    </Button>
                                    <Button
                                      onClick={() => setEditingId(null)}
                                      disabled={loading}
                                      variant="outline"
                                      className="flex-1"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      취소
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            // Display Card
                            <motion.div whileHover={{ scale: 1.02, x: 10 }}>
                              <Card className="border-l-4" style={{ borderLeftColor: color.replace('bg-', '#') }}>
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                          <Clock size={20} className="text-orange-600" />
                                          <span className="text-3xl font-bold">
                                            {schedule.time}
                                          </span>
                                        </div>
                                        <Badge className={color}>
                                          {schedule.category}
                                        </Badge>
                                      </div>
                                      <h3 className="text-2xl font-bold mb-2">
                                        {schedule.title}
                                      </h3>
                                      {schedule.location && (
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                          <MapPin size={16} />
                                          <span>{schedule.location}</span>
                                        </div>
                                      )}
                                      {schedule.description && (
                                        <p className="text-muted-foreground mt-2">
                                          {schedule.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => startEdit(schedule)}
                                      variant="outline"
                                      className="flex-1"
                                    >
                                      <Edit size={16} className="mr-2" />
                                      수정
                                    </Button>
                                    <Button
                                      onClick={() => handleDelete(schedule.id)}
                                      variant="destructive"
                                      className="flex-1"
                                    >
                                      <Trash2 size={16} className="mr-2" />
                                      삭제
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
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
              key="calendar"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
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
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <MapView schedules={schedules} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {[1, 2, 3, 4, 5].map((dayNum, index) => {
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Day {dayNum}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>🏛️ 관광</span><span className="font-bold">{stats.관광}</span></div>
                      <div className="flex justify-between"><span>🍜 식사</span><span className="font-bold">{stats.식사}</span></div>
                      <div className="flex justify-between"><span>🛍️ 쇼핑</span><span className="font-bold">{stats.쇼핑}</span></div>
                      <div className="flex justify-between"><span>🚌 이동</span><span className="font-bold">{stats.이동}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
