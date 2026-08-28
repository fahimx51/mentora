'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => (
        <div className="h-44 w-full bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
            Loading Rich Text Editor...
        </div>
    ),
});

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'clean'],
    ],
};

interface QuillEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function QuillEditor({ value, onChange }: QuillEditorProps) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-slate-900 dark:text-slate-100">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={quillModules}
                placeholder="Write content here..."
                className="min-h-[200px]"
            />
        </div>
    );
}