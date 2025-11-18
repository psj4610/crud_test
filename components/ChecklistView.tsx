'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Check,
  X,
  CheckSquare,
  Square,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ChecklistItem {
  id: number;
  person: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

const PEOPLE = ['성진', '지열', '성동'] as const;

const personColors = {
  '성진': {
    badge: 'bg-blue-500',
    gradient: 'from-blue-600 to-blue-700',
    border: 'border-blue-300'
  },
  '지열': {
    badge: 'bg-green-500',
    gradient: 'from-green-600 to-green-700',
    border: 'border-green-300'
  },
  '성동': {
    badge: 'bg-purple-500',
    gradient: 'from-purple-600 to-purple-700',
    border: 'border-purple-300'
  }
};

export default function ChecklistView() {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>('성진');
  const [showForm, setShowForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // READ - Fetch all checklists
  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checklist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChecklists(data || []);
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  // CREATE
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('checklist')
        .insert([{
          person: selectedPerson,
          title: newItemTitle,
          is_completed: false
        }]);

      if (error) throw error;

      await fetchChecklists();
      setNewItemTitle('');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating checklist item:', error);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE - Toggle completion
  const handleToggleComplete = async (id: number, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('checklist')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchChecklists();
    } catch (error) {
      console.error('Error updating checklist item:', error);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 항목을 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('checklist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchChecklists();
    } catch (error) {
      console.error('Error deleting checklist item:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChecklists = checklists.filter(item => item.person === selectedPerson);
  const completedCount = filteredChecklists.filter(item => item.is_completed).length;
  const totalCount = filteredChecklists.length;

  return (
    <div className="space-y-6">
      {/* Person Selector Tabs */}
      <Tabs value={selectedPerson} onValueChange={setSelectedPerson} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-amber-800/50">
          {PEOPLE.map((person) => (
            <TabsTrigger
              key={person}
              value={person}
              className="flex items-center gap-2 text-base data-[state=active]:bg-amber-600"
            >
              <User className="w-5 h-5" />
              {person}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`border-2 ${personColors[selectedPerson as keyof typeof personColors].border}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6" />
                <span>{selectedPerson}의 체크리스트</span>
              </div>
              <Badge className={personColors[selectedPerson as keyof typeof personColors].badge}>
                {completedCount}/{totalCount} 완료
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowForm(!showForm)}
          size="lg"
          className={`bg-gradient-to-r ${personColors[selectedPerson as keyof typeof personColors].gradient} hover:opacity-90`}
        >
          {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {showForm ? '취소' : '항목 추가'}
        </Button>
      </div>

      {/* CREATE Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className={`border-2 ${personColors[selectedPerson as keyof typeof personColors].border} bg-amber-50/50 dark:bg-amber-950/50`}>
              <CardContent className="pt-6">
                <form onSubmit={handleCreate} className="space-y-4">
                  <Input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="새 항목을 입력하세요"
                    required
                    disabled={loading}
                    className="text-lg"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r ${personColors[selectedPerson as keyof typeof personColors].gradient} hover:opacity-90`}
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {loading ? '추가중...' : '항목 추가하기'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checklist Items */}
      <div className="space-y-3">
        {filteredChecklists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare size={64} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                {selectedPerson}의 체크리스트가 비어있습니다.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                위의 '항목 추가' 버튼을 눌러 새 항목을 추가하세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredChecklists.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className={`border-l-4 ${item.is_completed ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}
                style={{ borderLeftColor: personColors[selectedPerson as keyof typeof personColors].badge.replace('bg-', '#') }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => handleToggleComplete(item.id, item.is_completed)}
                        disabled={loading}
                        className="flex-shrink-0 hover:scale-110 transition-transform"
                      >
                        {item.is_completed ? (
                          <CheckSquare className={`w-6 h-6 ${personColors[selectedPerson as keyof typeof personColors].badge.replace('bg-', 'text-')}`} />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                      <span className={`text-lg ${item.is_completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                        {item.title}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className={`border-2 ${personColors[selectedPerson as keyof typeof personColors].border}`}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>진행률</span>
                  <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`h-full ${personColors[selectedPerson as keyof typeof personColors].badge} rounded-full`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
