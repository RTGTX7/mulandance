import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="heading-xl mb-4">404</h1>
        <p className="text-lead mb-8">Page not found</p>
        <Link href="/en">
          <Button size="lg">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
