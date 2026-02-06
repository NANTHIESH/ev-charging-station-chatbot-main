import React from 'react'
export default function MessageBubble({ from, text }) {
const isUser = from === 'user';
return (
<div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
<div className={`max-w-[75%] p-3 rounded-lg ${isUser ? 'bg-sky-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
<div className="whitespace-pre-wrap">{text}</div>
</div>
</div>
)
}
