import React, { useState } from 'react';
import { Users } from 'lucide-react';
import api from '../lib/api';

interface InviteMemberButtonProps {
  boardId: string;
  onMemberInvited: () => void;
}

export function InviteMemberButton({ boardId, onMemberInvited }: InviteMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isInvitin, setIsInvitin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInvitin(true);
    try {
      await api.post(`/boards/${boardId}/invite`, { email });
      setEmail('');
      setIsOpen(false);
      onMemberInvited();
    } catch (error: any) {
      console.log('Failedd to invie member:', error);
      alert(error.response?.data?.message || 'Faild to invite member');
    } finally {
      setIsInvitin(false);
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
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black'
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
                  disabled={isInvitin}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  {isInvitin ? 'Invitin...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
