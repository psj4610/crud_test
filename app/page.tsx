'use client';

import { useState } from 'react';

interface Item {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // CREATE
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: Item = {
      id: Date.now(),
      title,
      description,
      createdAt: new Date(),
    };

    setItems([newItem, ...items]);
    setTitle('');
    setDescription('');
  };

  // UPDATE
  const handleUpdate = (id: number) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, title: editTitle, description: editDescription }
        : item
    ));
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  // DELETE
  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
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
            Create, Read, Update, Delete 기능 테스트
          </p>
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
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              추가하기
            </button>
          </form>
        </div>

        {/* READ - Items List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            항목 목록 (Read) - 총 {items.length}개
          </h2>

          {items.length === 0 ? (
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
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="설명"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors"
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
                          생성일: {item.createdAt.toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                        >
                          수정 (Update)
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
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
