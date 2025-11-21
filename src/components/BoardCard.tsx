import React from 'react';
import Link from 'next/link';
import { Board } from './types';

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
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
            {board.members.length} meber{board.members.length !== 1 ? 's' : ''}
          </span>
          <span>Owned by {board.owner.name}</span>
        </div>
      </div>
    </Link>
  );
}
