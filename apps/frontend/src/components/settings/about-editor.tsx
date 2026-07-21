'use client';

import TiptapImage from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, ImagePlus, Italic, List, ListOrdered, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUploadAboutImage } from '@/hooks/use-branding';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const MAX_ABOUT_IMAGE_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      className={cn(active && 'bg-accent text-accent-foreground')}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function AboutEditor({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (html: string) => void;
  onBlur: () => void;
}) {
  const t = useTranslations('settings');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAboutImage = useUploadAboutImage();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        horizontalRule: false,
        heading: { levels: [2, 3] },
      }),
      TiptapImage,
    ],
    content: value,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    onBlur,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-32 rounded-lg border border-input bg-card px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 md:text-sm',
      },
    },
  });

  async function onImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editor) {
      return;
    }
    if (file.size > MAX_ABOUT_IMAGE_BYTES) {
      toast.error(t('aboutImageTooLarge'));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const { url } = await uploadAboutImage.mutateAsync(dataUrl.split(',')[1]);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('genericError'));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <ToolbarButton
          active={Boolean(editor?.isActive('bold'))}
          label={t('aboutBoldButton')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={Boolean(editor?.isActive('italic'))}
          label={t('aboutItalicButton')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={Boolean(editor?.isActive('bulletList'))}
          label={t('aboutBulletListButton')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={Boolean(editor?.isActive('orderedList'))}
          label={t('aboutOrderedListButton')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={onImageSelected}
        />
        <ToolbarButton
          active={false}
          label={t('aboutImageButton')}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadAboutImage.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
        </ToolbarButton>
      </div>
      <div dir="auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
