'use client';

import { useState, use, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { DragDropContext } from '@hello-pangea/dnd';
import { ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ListColumn, InviteMemberButton, RecommendationsButton, AddListButton } from '../../../components';

import { Board, List, Card } from '../../../components/types';

export default function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  if (!router) return null;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isAuthLoading && user && id) {
      loadBoard();
    }
  }, [user, isAuthLoading, id, router]);

  const loadBoard = async () => {
    try {
      setIsLoadingBoard(true);
      const response = await api.get(`/boards/${id}`);
      setBoard(response.data.board);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load board');
    } finally {
      setIsLoadingBoard(false);
    }
  };

  if (isLoadingBoard) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>Failed to load Board</p>
          <button
            onClick={() => router.push('/')}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <BoardContent board={board} id={id} loadBoard={loadBoard} />;
}

function BoardContent({
  board,
  id,
  loadBoard,
}: {
  board: Board;
  id: string;
  loadBoard: () => void;
}) {
  const [lists, setLists] = useState(board.lists);
  const [isDragOperation, setIsDragOperation] = useState(false);
  const router = useRouter();

  if (!router) return null;

  useEffect(() => {
    if (!isDragOperation) {
      setLists(board.lists);
    }
  }, [board.lists, isDragOperation]);

  const onDragStart = () => {
    setIsDragOperation(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragOperation(false);

    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newLists = [...lists];
    const sourceListIndex = newLists.findIndex(
      (l) => l._id === source.droppableId,
    );
    const destListIndex = newLists.findIndex(
      (l) => l._id === destination.droppableId,
    );

    if (sourceListIndex === -1 || destListIndex === -1) return;

    const [movedCard] = newLists[sourceListIndex].cards.splice(
      source.index,
      1,
    );
    newLists[destListIndex].cards.splice(destination.index, 0, movedCard);

    setLists(newLists);

    try {
      await api.patch(`/boards/cards/${draggableId}/move`, {
        newListId: destination.droppableId,
        position: destination.index,
      });
    } catch (error) {
      console.log('Failedd to move card:', error);
      loadBoard();
      setIsDragOperation(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <header className='bg-white border-b border-gray-200 px-4 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => router.push('/')}
              className='p-2 rounded-md text-gray-600 hover:bg-gray-100'
            >
              <ArrowLeft className='h-5 w-5' />
            </button>
            <h1 className='text-xl font-semibold text-gray-900'>
              {board.name}
            </h1>
            {board.description && (
              <p className='text-gray-600 text-sm'>{board.description}</p>
            )}
          </div>

          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <Users className='h-5 w-5 text-gray-500' />
              <span className='text-sm text-gray-600'>
                {board.members.length} member
                {board.members.length !== 1 ? 's' : ''}
              </span>
            </div>

            <InviteMemberButton
              boardId={board._id}
              onMemberInvited={loadBoard}
            />
            <RecommendationsButton board={board} />
            <AddListButton boardId={board._id} onListAdded={loadBoard} />
          </div>
        </div>
      </header>

      <div className='p-6 overflow-x-auto'>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className='flex space-x-6'>
            {lists.map((list, index) => (
              <ListColumn
                key={list._id}
                list={list}
                boardId={id}
                onCardAdded={loadBoard}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
