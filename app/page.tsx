'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Trash2,
  Plus,
  Save,
  Upload,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  AlertCircle,
  GripVertical,
  Lock,
  Edit,
  ExternalLink,
  FileText
} from 'lucide-react';

// --- Types ---
type LinkItem = {
  id: string;
  label: string;
  url: string;
};

// --- Component: Sortable Link Row ---
interface SortableLinkRowProps {
  link: LinkItem;
  index: number;
  updateLink: (id: string, field: 'label' | 'url', value: string) => void;
  removeLink: (id: string) => void;
  isReadOnly: boolean;
}

function SortableLinkRow({ link, index, updateLink, removeLink, isReadOnly }: SortableLinkRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 ${isDragging ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}
    >
      {/* Drag Handle */}
      {!isReadOnly && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-600 transition-colors touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}

      {/* Index Number */}
      <div className="text-gray-400 font-mono text-sm w-6 text-center select-none">
        {index + 1}
      </div>

      {/* Content Area */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Label Field */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Label</label>
          {isReadOnly ? (
            <div className="w-full py-1 text-gray-800 font-medium truncate border-b border-transparent">
              {link.label || <span className="text-gray-300 italic">No Label</span>}
            </div>
          ) : (
            <input
              type="text"
              value={link.label}
              placeholder="My Link"
              onChange={(e) => updateLink(link.id, 'label', e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none py-1 transition-colors text-gray-800 placeholder-gray-300"
            />
          )}
        </div>

        {/* URL Field */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">URL</label>
          {isReadOnly ? (
            <div className="w-full py-1 truncate border-b border-transparent flex items-center gap-2">
              {link.url ? (
                <a
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline hover:text-blue-800 flex items-center gap-1 truncate"
                >
                  {link.url}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-gray-300 italic">No URL</span>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={link.url}
              placeholder="https://..."
              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none py-1 transition-colors text-blue-600 placeholder-gray-300"
            />
          )}
        </div>
      </div>

      {/* Remove Button */}
      {!isReadOnly && (
        <button
          onClick={() => removeLink(link.id)}
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Remove Link"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// --- Main Application Component ---
export default function App() {
  // State
  const [title, setTitle] = useState('My Useful Links');
  const [links, setLinks] = useState<LinkItem[]>([
    { id: '1', label: 'Google', url: 'https://google.com' },
    { id: '2', label: 'GitHub', url: 'https://github.com' }
  ]);

  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [jsonString, setJsonString] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync JSON string when data changes (and editor is closed)
  useEffect(() => {
    mounted.current = true;
    if (!isJsonOpen) {
      // Combine title and items into one object for the JSON representation
      const data = {
        title: title,
        items: links
      };
      setJsonString(JSON.stringify(data, null, 2));
    }
    return () => { mounted.current = false; };
  }, [links, title, isJsonOpen]);

  // Handlers
  const addLink = () => {
    const newLink = { id: crypto.randomUUID(), label: '', url: '' };
    setLinks((items) => [...items, newLink]);
  };

  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    setLinks((items) => items.map(link => link.id === id ? { ...link, [field]: value } : link));
  };

  const removeLink = (id: string) => {
    setLinks((items) => items.filter(link => link.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // JSON Editor Logic
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isReadOnly) return; // Prevent edits in read-only mode via code (though UI handles it too)

    const newValue = e.target.value;
    setJsonString(newValue);

    try {
      const parsed = JSON.parse(newValue);

      // Handle Legacy Format (Array only)
      if (Array.isArray(parsed)) {
        setLinks(parsed);
        setJsonError(null);
      }
      // Handle New Format (Object with items)
      else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
        setLinks(parsed.items);
        if (parsed.title) setTitle(parsed.title);
        setJsonError(null);
      } else {
        setJsonError("Invalid format: Expected array or { title, items: [] }");
      }
    } catch (err) {
      setJsonError("Invalid JSON syntax");
    }
  };

  // File I/O
  const downloadJson = () => {
    const data = {
      title: title,
      items: links
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'links'}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const uploadJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Handle Legacy
        if (Array.isArray(parsed)) {
          setLinks(parsed);
          setTitle("Imported List");
        }
        // Handle New Format
        else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
          setLinks(parsed.items);
          setTitle(parsed.title || "Untitled List");
        } else {
          alert("File is not a valid LinkList file.");
          return;
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-80">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
                <LinkIcon className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">LinkList</h1>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsReadOnly(!isReadOnly)}
              className={`sm:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isReadOnly ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200'}`}
            >
              {isReadOnly ? <Lock className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
              {isReadOnly ? 'LOCKED' : 'EDITING'}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="hidden sm:block mr-2">
              <button
                onClick={() => setIsReadOnly(!isReadOnly)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-md border transition-colors ${isReadOnly ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {isReadOnly ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isReadOnly ? 'Read Only' : 'Edit Mode'}
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={uploadJson}
              className="hidden"
              accept=".json"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Upload className="w-4 h-4" /> Load
            </button>
            <button
              onClick={downloadJson}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Title Section */}
        <div className="mb-8">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">List Title</label>
          {isReadOnly ? (
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              {title || "Untitled List"}
            </h2>
          ) : (
            <div className="relative group">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a list title..."
                className="w-full text-3xl font-extrabold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:outline-none py-2 transition-all placeholder-gray-300"
              />
              <Edit className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={links}
              strategy={verticalListSortingStrategy}
            >
              {links.map((link, index) => (
                <SortableLinkRow
                  key={link.id}
                  link={link}
                  index={index}
                  updateLink={updateLink}
                  removeLink={removeLink}
                  isReadOnly={isReadOnly}
                />
              ))}
            </SortableContext>
          </DndContext>

          {links.length === 0 && (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <div className="flex justify-center mb-4">
                <FileText className="w-12 h-12 text-gray-200" />
              </div>
              <p className="font-medium">This list is empty.</p>
              {!isReadOnly && <p className="text-sm mt-2">Click the button below to add your first link.</p>}
            </div>
          )}
        </div>

        {!isReadOnly && (
          <button
            onClick={addLink}
            className="mt-6 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium group"
          >
            <div className="bg-gray-200 rounded-full p-1 group-hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            Add New Link
          </button>
        )}
      </main>

      {/* Slide-up JSON Editor */}
      <div
        className={`fixed bottom-0 left-0 w-full bg-gray-900 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-in-out z-50 flex flex-col ${isJsonOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'}`}
        style={{ height: '50vh' }}
      >
        {/* Drawer Handle / Toggle Bar */}
        <div
          onClick={() => setIsJsonOpen(!isJsonOpen)}
          className="h-12 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-6 cursor-pointer hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2 font-mono text-sm text-blue-400">
            <span>{'{ }'}</span>
            <span className="font-bold text-gray-200">JSON Editor</span>
            {jsonError && (
              <span className="flex items-center gap-1 text-red-400 ml-4 text-xs animate-pulse">
                <AlertCircle className="w-3 h-3" /> {jsonError}
              </span>
            )}
          </div>
          <div className="text-gray-400">
            {isJsonOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-0 relative">
          <textarea
            value={jsonString}
            onChange={handleJsonChange}
            readOnly={isReadOnly}
            className={`w-full h-full bg-gray-900 text-gray-300 font-mono text-sm p-6 focus:outline-none resize-none ${isReadOnly ? 'opacity-70' : ''}`}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}