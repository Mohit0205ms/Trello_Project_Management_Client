'use client';

import { useState, use, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

import api from '../../../lib/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Users, Lightbulb, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  lists: List[];
}

interface List {
  _id: string;
  name: string;
  cards: Card[];
  board: string;
}

interface Card {
  _id: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Backlog' | 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
  createdBy: {
    name: string;
    email: string;
  };
}

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
          <p className='text-red-600 mb-4'>{error}</p>
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
    // Only update lists if we're not in a drag operation
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

    // Optimistically update UI first
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
      // Then make the API call
      await api.patch(`/boards/cards/${draggableId}/move`, {
        newListId: destination.droppableId,
        position: destination.index,
      });

      // Success - optimistic update was correct
    } catch (error) {
      console.error('Failed to move card:', error);
      // Revert on error by reloading board
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

function AddCardForm({
  onCardCreated,
  onCancel,
  isCreating,
  boardId,
  listId,
}: {
  onCardCreated: () => void;
  onCancel: () => void;
  isCreating: boolean;
  boardId: string;
  listId: string;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    status: 'Todo' as
      | 'Backlog'
      | 'Todo'
      | 'In Progress'
      | 'Review'
      | 'Done'
      | 'Blocked',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await api.post(`/boards/${boardId}/lists/${listId}/cards`, formData);
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Todo',
        dueDate: '',
      });
      onCardCreated();
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Create New Task
          </h3>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Basic Information Section */}
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

            {/* Priority & Status Section */}
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

            {/* DEDICATED DUE DATE SECTION */}
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
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
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

            {/* Action Buttons */}
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
                  disabled={isCreating}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
                >
                  {isCreating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditCardForm({
  card,
  onCardEdited,
  onCancel,
}: {
  card: Card;
  onCardEdited: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: card.title,
    description: card.description || '',
    priority: card.priority,
    status: card.status,
    dueDate: card.dueDate
      ? new Date(card.dueDate).toISOString().split('T')[0]
      : '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsUpdating(true);
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
        updateData.dueDate = null; // Explicitly clear due date
      }

      await api.patch(`/boards/cards/${card._id}`, updateData);
      onCardEdited();
    } catch (error) {
      console.error('Failed to update card:', error);
    } finally {
      setIsUpdating(false);
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
            {/* Basic Information Section */}
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

            {/* Priority & Status Section */}
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

            {/* DEDICATED DUE DATE SECTION */}
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
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
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

            {/* Action Buttons */}
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
                  disabled={isUpdating}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium'
                >
                  {isUpdating ? 'Updating...' : 'Update Task'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ListColumn({
  list,
  boardId,
  onCardAdded,
}: {
  list: List;
  boardId: string;
  onCardAdded: () => void;
}) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className='bg-gray-200 rounded-lg w-80 p-4 min-h-96'>
      <h3 className='font-semibold text-gray-800 mb-4'>{list.name}</h3>

      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-20 pb-2 ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {list.cards
              .filter((card) => card && card._id)
              .map((card, index) => (
                <CardItem
                  key={card._id}
                  card={card}
                  index={index}
                  onCardEdited={onCardAdded}
                />
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {isAddingCard ? (
        <AddCardForm
          onCardCreated={() => {
            onCardAdded();
            setIsAddingCard(false);
          }}
          onCancel={() => setIsAddingCard(false)}
          isCreating={isCreating}
          boardId={boardId}
          listId={list._id}
        />
      ) : (
        <button
          onClick={() => setIsAddingCard(true)}
          className='mt-4 w-full p-2 text-left text-gray-600 hover:text-gray-800 hover:bg-gray-300 rounded flex items-center'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add a card
        </button>
      )}
    </div>
  );
}

function CardItem({
  card,
  index,
  onCardEdited,
}: {
  card: Card;
  index: number;
  onCardEdited: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const getPriorityColor = (priority: string) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800',
      High: 'bg-orange-100 text-orange-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    };
    return colors[priority as keyof typeof colors] || colors.Medium;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      Backlog: '📋',
      Todo: '📝',
      'In Progress': '⚡',
      Review: '👀',
      Done: '✅',
      Blocked: '🚫',
    };
    return icons[status as keyof typeof icons] || icons.Todo;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent drag when clicking edit button
    if ((e.target as HTMLElement).closest('button')) return;
    setIsEditing(true);
  };

  return (
    <>
      <Draggable draggableId={card._id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white p-3 rounded shadow-sm border ${
              snapshot.isDragging
                ? 'rotate-3 shadow-lg cursor-grabbing'
                : 'hover:shadow-md cursor-grab'
            } transition-all select-none`}
            onClick={(e) => {
              // Prevent click if this was part of a drag operation
              if (snapshot.isDragging || snapshot.draggingOver) return;
              handleCardClick(e);
            }}
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-1 bg-gray-400 rounded opacity-60 group-hover:opacity-100 transition-opacity'></div>
                <h4 className='font-medium'>
                  {card.title}
                </h4>
              </div>
              <span className='text-sm'>
                {getStatusIcon(card.status)}
              </span>
            </div>

            <div className='flex items-center justify-between text-xs mb-2'>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                  card.priority,
                )}`}
              >
                {card.priority}
              </span>
              {card.dueDate && (
                <span className='text-gray-500'>
                  Due: {new Date(card.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {card.description && (
              <p className='text-sm text-gray-600 line-clamp-2'>
                {card.description}
              </p>
            )}
          </div>
        )}
      </Draggable>

      {isEditing && (
        <EditCardForm
          card={card}
          onCardEdited={() => {
            setIsEditing(false);
            onCardEdited();
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </>
  );
}

function AddListButton({
  boardId,
  onListAdded,
}: {
  boardId: string;
  onListAdded: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await api.post(`/boards/${boardId}/lists`, { name });
      setName('');
      setIsOpen(false);
      onListAdded();
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsCreating(false);
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
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isCreating}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  {isCreating ? 'Creating...' : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function InviteMemberButton({
  boardId,
  onMemberInvited,
}: {
  boardId: string;
  onMemberInvited: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    try {
      await api.post(`/boards/${boardId}/invite`, { email });
      setEmail('');
      setIsOpen(false);
      onMemberInvited();
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      alert(error.response?.data?.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
      >
        <Users className='h-4 w-4 mr-2' />
        Invite
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Invite Member
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Email Address
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                  placeholder='member@example.com'
                  required
                />
              </div>
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isInviting}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  {isInviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function RecommendationsButton({ board }: { board: Board }) {
  const [isOpen, setIsOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/boards/${board._id}/recommendations`);
      console.log("response: ", response);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !recommendations) {
      loadRecommendations();
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
      >
        <Lightbulb className='h-4 w-4 mr-2' />
        Recommendations
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Smart Recommendations
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            {isLoading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : recommendations ? (
              <div className='space-y-8'>
                <RecommendationsSection
                  title='Smart Alerts & Suggestions'
                  items={recommendations || []}
                  type='alerts'
                />
              </div>
            ) : (
              <p className='text-gray-500 text-center py-8'>
                No recommendations available.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function RecommendationsSection({
  title,
  items,
  type,
}: {
  title: string;
  items: any[];
  type: string;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className='font-medium text-gray-900 mb-4'>
        {title} ({items.length})
      </h4>
      <div className='space-y-3'>
        {items.map((item, index) => (
          <div key={index} className='bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <h5 className='font-medium text-gray-900 mb-1'>{item.cardTitle}</h5>
                <p className='text-sm text-gray-600 mb-2'>{item.reason}</p>
                <div className='flex items-center space-x-4 text-xs'>
                  <span className={`px-2 py-1 rounded ${
                    item.severity === 'high' ? 'bg-red-100 text-red-800' :
                    item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.severity?.toUpperCase() || 'LOW'} PRIORITY
                  </span>
                  <span className='text-gray-500 text-xs'>
                    {item.type?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className='text-right'>
                <span className='text-lg'>
                  {item.type === 'overdue' && '⏰'}
                  {item.type === 'due_soon' && '⚡'}
                  {item.type === 'critical_priority' && '🚨'}
                  {item.type === 'high_priority_waiting' && '⚠️'}
                  {item.type === 'blocked_task' && '🚧'}
                  {item.type === 'no_due_date_high_priority' && '📅'}
                  {item.type === 'critical_in_todo' && '🔥'}
                  {item.type === 'in_progress_overdue' && '💥'}
                  {item.type === 'move_to_done' && '✅'}
                  {item.type === 'upcoming_deadline' && '📋'}
                </span>
              </div>
            </div>
            {item.action && (
              <div className='mt-3 text-sm font-medium text-blue-600'>
                💡 {item.action}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
