import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href="/en"
            className="hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li
            key={item.href}
            className="flex items-center gap-1.5"
          >
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {index === items.length - 1 ? (
              <span className="text-foreground font-medium">{item.label}</span>
            ) : (
              <Link
                href={`/${item.href}`}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
