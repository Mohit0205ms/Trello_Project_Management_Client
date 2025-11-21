import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../lib/api';

interface AddListButtonProps {
  boardId: string;
  onListAdded: () => void;
}

export function AddListButton({ boardId, onListAdded }: AddListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isCreatin, setIsCreatin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreatin(true);
    try {
      await api.post(`/boards/${boardId}/lists`, { name });
      setName('');
      setIsOpen(false);
      onListAdded();
    } catch (error) {
      console.log('Failedd to creaate list:', error);
    } finally {
      setIsCreatin(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
      >
        <Plus className='h-4 w-4 mr-2' />
        Add List
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Add New List
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  List Name
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black'
                  placeholder='e.g., Todo, In Progress, Done'
                  required
                />
              </div>
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isCreatin}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                >
                  {isCreatin ? 'Creatin...' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
