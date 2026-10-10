import Link from "next/link";
import { Button, Card, Heart } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export default async function AuthWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const continueTo = next && next.startsWith("/") ? next : "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm text-center space-y-3">
        <Heart className="mb-1 inline-block text-lg" />
        <p className="font-medium text-ink">You&apos;re logged in</p>
        <p className="text-sm text-gray">
          Already added {BRAND.name} to your Home Screen? Close this browser
          tab and open it from there instead — that&apos;s what makes
          notifications and the full app feel actually work. Tapping a login
          link always opens here in the browser first, even with the app
          installed.
        </p>
        <Link href={continueTo} className="block">
          <Button type="button" className="w-full">
            Continue here instead
          </Button>
        </Link>
        <p className="text-xs text-gray">
          Don&apos;t have it on your Home Screen yet? Just continue — you can
          add it any time from the banner at the bottom of the screen.
        </p>
      </Card>
    </div>
  );
}
