import { Metadata } from "next";
import { Suspense } from "react";
import { EditorContent } from "../EditorContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Edit Article: ${slug}`,
  };
}

export default async function EditorSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <EditorContent editSlug={slug} />
    </Suspense>
  );
}
