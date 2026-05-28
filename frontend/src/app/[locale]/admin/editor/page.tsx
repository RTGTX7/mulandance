import { Suspense } from 'react';
import { EditorContent } from './EditorContent';

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorContent editSlug={null} />
    </Suspense>
  );
}
