import React, { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'color', 'background',
    'script', 'code-block'
  ];

  return (
    <div className={cn("bg-background", className)}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          borderColor: 'hsl(var(--border))',
        }}
      />
      <style>{`
        .ql-toolbar {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
          border-bottom: 1px solid hsl(var(--border));
        }
        .ql-container {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
        }
        .ql-editor {
          color: hsl(var(--foreground));
          min-height: 300px;
        }
        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
        }
        .ql-toolbar .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .ql-toolbar .ql-fill {
          fill: hsl(var(--foreground));
        }
        .ql-toolbar .ql-picker-label {
          color: hsl(var(--foreground));
        }
        .ql-toolbar button:hover {
          background: hsl(var(--muted));
        }
        .ql-toolbar button.ql-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .ql-toolbar .ql-picker-options {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
        }
        .ql-toolbar .ql-picker-item:hover {
          background: hsl(var(--muted));
        }
      `}</style>
    </div>
  );
}