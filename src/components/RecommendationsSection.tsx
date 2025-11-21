import React from 'react';

interface RecommendationsSectionProps {
  title: string;
  items: any[];
  type: string;
}

export function RecommendationsSection({ title, items, type }: RecommendationsSectionProps) {
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
