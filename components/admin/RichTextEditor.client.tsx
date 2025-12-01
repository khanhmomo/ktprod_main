'use client';

import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-gray-300 rounded-md p-4 min-h-[300px] flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }
);

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
};

export default function RichTextEditorClient({ content, onChange, placeholder }: RichTextEditorProps) {
  return (
    <RichTextEditor 
      content={content}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
