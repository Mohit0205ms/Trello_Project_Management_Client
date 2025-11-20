'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Link from 'next/link';
import { Plus, LogOut } from 'lucide-react';

interface Board {
  _id: string;
  name: string;
  description: string;
  owner: {
    name: string;
    email: string;
  };
  members: Array<{
    name: string;
    email: string;
  }>;
}

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadBoards();
    }
  }, [user, isLoading, router]);

  const loadBoards = async () => {
    setIsLoadingBoards(true);
    try {
      const response = await api.get('/boards');
      setBoards(response.data.boards);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <h1 className='text-2xl font-bold text-gray-900'>Trello Clone</h1>
            <div className='flex items-center space-x-4'>
              <span className='text-gray-700'>Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                <LogOut className='h-4 w-4 mr-2' />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex justify-between items-center mb-8'>
            <h2 className='text-3xl font-bold text-gray-900'>Your Boards</h2>
            <CreateBoardButton onBoardCreated={loadBoards} />
          </div>

          {isLoadingBoards ? (
            <div className='flex justify-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : boards.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-gray-500 mb-4'>
                You haven't created any boards yet.
              </div>
              <CreateBoardButton onBoardCreated={loadBoards} />
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {boards.map((board) => (
                <BoardCard key={board._id} board={board} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function BoardCard({ board }: { board: Board }) {
  return (
    <Link href={`/board/${board._id}`}>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          {board.name}
        </h3>
        {board.description && (
          <p className='text-gray-600 text-sm mb-4'>{board.description}</p>
        )}
        <div className='flex justify-between items-center text-sm text-gray-500'>
          <span>
            {board.members.length} member{board.members.length !== 1 ? 's' : ''}
          </span>
          <span>Owned by {board.owner.name}</span>
        </div>
      </div>
    </Link>
  );
}

function CreateBoardButton({ onBoardCreated }: { onBoardCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/boards', { name, description });
      onBoardCreated();
      setName('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create board:', error);
    } finally {
      setIsCreating(false);
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
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4'>
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
                    onChange={(e) => setName(e.target.value)}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Description (optional)
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
                  disabled={isCreating}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                >
                  {isCreating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
