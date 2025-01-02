import React, { useState } from 'react';

function NotesSplitList({ notes }) {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    if (!notes || notes.length === 0) {
        return <p className="text-gray-500 italic">还没有切分出的笔记内容</p>;
    }

    return (
        <div className="space-y-4">
            {notes.map((note, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                    <div
                        className={`px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex justify-between items-center
                            ${openIndex === idx ? 'border-b' : ''}`}
                        onClick={() => handleToggle(idx)}
                    >
                        <span className="font-medium text-gray-900">
                            {note.title || '（无标题）'}
                        </span>
                        <svg
                            className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 
                                ${openIndex === idx ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    {openIndex === idx && (
                        <pre className="p-4 bg-gray-50 text-sm text-gray-700 overflow-x-auto">
                            {note.content}
                        </pre>
                    )}
                </div>
            ))}
        </div>
    );
}

export default NotesSplitList;