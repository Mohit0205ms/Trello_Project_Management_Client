import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import api from '../lib/api';
import { Board } from './types';
import { RecommendationsSection } from './RecommendationsSection';

interface RecommendationsButtonProps {
  board: Board;
}

export function RecommendationsButton({ board }: RecommendationsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recomendations, setRecomendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecomendations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/boards/${board._id}/recommendations`);
      console.log("response: ", response);
      setRecomendations(response.data.recommendations);
    } catch (error) {
      console.log('Failedd to load recomendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !recomendations) {
      loadRecomendations();
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
            ) : recomendations ? (
              <div className='space-y-8'>
                <RecommendationsSection
                  title='Smart Alerts & Suggestions'
                  items={recomendations || []}
                  type='alerts'
                />
              </div>
            ) : (
              <p className='text-gray-500 text-center py-8'>
                No recomendations available.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
