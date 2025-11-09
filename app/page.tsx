'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Item {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // READ - Fetch all items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('항목을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Load items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  // CREATE
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([{ title, description: description || null }])
        .select();

      if (error) throw error;

      if (data) {
        setItems([data[0], ...items]);
        setTitle('');
        setDescription('');
        alert('항목이 성공적으로 추가되었습니다!');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('항목 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE
  const handleUpdate = async (id: number) => {
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .update({ title: editTitle, description: editDescription || null })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data) {
        setItems(items.map(item => item.id === id ? data[0] : item));
        setEditingId(null);
        setEditTitle('');
        setEditDescription('');
        alert('항목이 성공적으로 수정되었습니다!');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('항목 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  // DELETE
  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 항목을 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      alert('항목이 성공적으로 삭제되었습니다!');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('항목 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            CRUD Test App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Supabase + Next.js 15 CRUD 기능 테스트
          </p>
          <div className="mt-4 inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-semibold">
            ✓ Supabase 연동 완료
          </div>
        </div>

        {/* CREATE Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            새 항목 추가 (Create)
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="항목 제목을 입력하세요"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                설명
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="항목 설명을 입력하세요"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리중...' : '추가하기'}
            </button>
          </form>
        </div>

        {/* READ - Items List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              항목 목록 (Read) - 총 {items.length}개
            </h2>
            <button
              onClick={fetchItems}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              새로고침
            </button>
          </div>

          {loading && items.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              불러오는 중...
            </p>
          ) : items.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              아직 항목이 없습니다. 위에서 새 항목을 추가해보세요!
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingId === item.id ? (
                    // UPDATE Form
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="제목"
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
                          onClick={() => handleUpdate(item.id)}
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
                      <div className="mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-gray-600 dark:text-gray-300 mt-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-400 mt-2">
                          생성일: {new Date(item.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          disabled={loading}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                          수정 (Update)
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                          삭제 (Delete)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
