import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardItemProps } from './types';
import { EditCardForm } from './EditCardForm';

export function CardItem({ card, index, onCardEdited }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getPriorityColor = (priority: string) => {
    const colors = {
      Critical: 'bg-red-100   text-red-800',
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
            className={`bg-white p-3 rounded-2xl shadow-sm border ${
              snapshot.isDragging
                ? 'rotate-3 shadow-lg cursor-grabbing'
                : 'hover:shadow-md cursor-grab'
            } transition-all select-none`}
            onClick={(e) => {
              if (snapshot.isDragging || snapshot.draggingOver) return;
              handleCardClick(e);
            }}
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center space-x-2'>
                {/* <div className='w-4 h-1 bg-gray-400 rounded opacity-60 group-hover:opacity-100 transition-opacity'></div> */}
                <h4 className='font-medium text-black'>
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
