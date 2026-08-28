'use client';

import React from 'react';
import { PlayCircle } from 'lucide-react';

interface VideoPlayerProps {
    url?: string;
    title?: string;
}

const getEmbedUrl = (url?: string): string => {
    if (!url) return '';

    // Extracts 11-character YouTube Video ID cleanly, ignoring trailing parameters
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[1].length === 11) {
        return `https://www.youtube-nocookie.com/embed/${match[1]}?controls=1&rel=0`;
    }

    return url;
};

export default function VideoPlayer({ url, title = 'Lesson Video' }: VideoPlayerProps) {
    const embedUrl = getEmbedUrl(url);

    if (!url || !embedUrl) {
        return (
            <div className="aspect-video w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200 dark:border-slate-800">
                <PlayCircle size={48} />
                <span className="text-sm font-medium">No video content for this lesson</span>
            </div>
        );
    }

    return (
        <div className="aspect-video w-full rounded-xl bg-black overflow-hidden relative shadow-md">
            <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}