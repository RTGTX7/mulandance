import { Metadata } from "next";
import { EditorContent } from "../page";

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
  return <EditorContent editSlug={slug} />;
}