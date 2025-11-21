import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { CardItem } from './CardItem';
import { AddCardForm } from './AddCardForm';

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

interface List {
  _id: string;
  name: string;
  cards: Card[];
  board: string;
}

interface ListColumnProps {
  list: List;
  boardId: string;
  onCardAdded: () => void;
}

export function ListColumn({ list, boardId, onCardAdded }: ListColumnProps) {
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
              ))
            }
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {!isAddingCard && (
        <button
          onClick={() => setIsAddingCard(true)}
          className='mt-4 w-full p-2 text-left text-gray-600 hover:text-gray-800 hover:bg-gray-300 rounded flex items-center'
        >
          <Plus className='h-4 w-4 mr-2' />
          Add a card
        </button>
      )}

      {isAddingCard && (
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
      )}
    </div>
  );
}
