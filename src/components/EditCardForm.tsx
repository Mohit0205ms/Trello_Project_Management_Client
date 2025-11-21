import React, { useState } from 'react';
import api from '../lib/api';
import { Card } from './types';

interface EditCardFormProps {
  card: Card;
  onCardEdited: () => void;
  onCancel: () => void;
}

export function EditCardForm({ card, onCardEdited, onCancel }: EditCardFormProps) {
  const [formData, setFormData] = useState({
    title: card.title,
    description: card.description || '',
    priority: card.priority,
    status: card.status,
    dueDate: card.dueDate
      ? new Date(card.dueDate).toISOString().split('T')[0]
      : '',
  });
  const [isUpdateng, setIsUpdateng] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsUpdateng(true);
    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
      };

      if (formData.dueDate) {
        updateData.dueDate = formData.dueDate;
      } else {
        updateData.dueDate = null;
      }

      await api.patch(`/boards/cards/${card._id}`, updateData);
      onCardEdited();
    } catch (error) {
      console.log('Failedd to update cardd:', error);
    } finally {
      setIsUpdateng(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Edit Task
          </h3>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 border-b pb-2'>
                Task Details
              </h4>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Task Title
                </label>
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder='e.g., Fix authentication bug'
                  className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Describe the task requirements...'
                  className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black'
                  rows={3}
                />
              </div>
            </div>

            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 border-b pb-2'>
                Priority & Status
              </h4>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as typeof formData.priority,
                      })
                    }
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black'
                  >
                    <option value='Critical'>
                      🔴 Critical - Business Critical
                    </option>
                    <option value='High'>🟠 High - Important</option>
                    <option value='Medium'>🟡 Medium - Standard</option>
                    <option value='Low'>🟢 Low - Nice to Have</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Current Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as typeof formData.status,
                      })
                    }
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black'
                  >
                    <option value='Backlog'>📋 Backlog - Not Started</option>
                    <option value='Todo'>📝 Todo - Ready to Start</option>
                    <option value='In Progress'>
                      ⚡ In Progress - Working
                    </option>
                    <option value='Review'>👀 Review - Needs Review</option>
                    <option value='Done'>✅ Done - Completed</option>
                    <option value='Blocked'>🚫 Blocked - Stuck</option>
                  </select>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 border-b pb-2'>
                📅 Due Date
              </h4>

              <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  When should this task be completed?
                </label>

                <div className='flex items-center space-x-4'>
                  <input
                    type='date'
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className='flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black'
                    min={new Date().toISOString().split('T')[0]} // Prevent pas dats
                  />

                  <div className='text-sm text-gray-600'>
                    {formData.dueDate ? (
                      <span className='text-green-600 font-medium'>
                        Due:{' '}
                        {new Date(formData.dueDate).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </span>
                    ) : (
                      <span className='text-gray-500'>No due date</span>
                    )}
                  </div>
                </div>

                <div className='mt-3 text-xs text-blue-600'>
                  💡 Tip: Setting a due date helps with task prioritization and
                  tracking
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between pt-4 border-t'>
              <button
                type='button'
                onClick={() => setFormData({ ...formData, dueDate: '' })}
                className='text-sm text-gray-500 hover:text-gray-700 underline'
              >
                Clear due date
              </button>

              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={onCancel}
                  className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isUpdateng}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
                >
                  {isUpdateng ? 'Updateng...' : 'Update Task'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
