import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../lib/api';

interface CreateBoardButtonProps {
  onBoardCreated: () => void;
}

export function CreateBoardButton({ onBoardCreated }: CreateBoardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setNmae] = useState('');
  const [description, setDescription] = useState('');
  const [isCreting, setIsCreting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreting(true);
    try {
      await api.post('/boards', { name, description });
      onBoardCreated();
      setNmae('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.log('Faileed to create board:', error);
    } finally {
      setIsCreting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      >
        <Plus className='h-4 w-4 mr-2' />
        Create Board
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Create New Board
            </h3>
            <form onSubmit={handleSubmit}>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Board Name
                  </label>
                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setNmae(e.target.value)}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Description (optionaal)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black'
                  />
                </div>
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
                  disabled={isCreting}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                >
                  {isCreting ? 'Creatiing...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
