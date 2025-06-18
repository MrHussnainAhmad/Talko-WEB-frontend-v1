import React from 'react'
import { MessageCircle } from 'lucide-react'

const NoChatSeleted = () => {
  return (
    <div className='w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50'>
        <div className='max-w-md text-center space-y-6'>
            {/* ICON */}
            <div className='flex justify-center gap-4 mb-4'>
                <div className='relative'>
                    <div className='size-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce'>
                        <MessageCircle className='size-8 text-gray-500' />
                    </div>
                </div>
            </div>
            {/* Greetings */}
            <h2 className='text-2xl font-bold'>Welcome to Talko!</h2>
            <p className='text-base-content/60'>Select a Conversation to Start chatting!</p>
        </div>
    </div>
  )
}

export default NoChatSeleted