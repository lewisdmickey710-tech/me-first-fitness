import Link from "next/link";

// Stays pinned to the top of the viewport once scrolled past, so a long
// page doesn't strand people at the bottom with no way back except
// scrolling all the way up. -mx-4/px-4 cancels the parent <main>'s side
// padding so the sticky background spans full width, not just the
// content column.
export function BackLink({
  href,
  children = "← Back",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-bg px-4 py-2">
      <Link href={href} className="text-sm text-gray hover:text-ink">
        {children}
      </Link>
    </div>
  );
}
