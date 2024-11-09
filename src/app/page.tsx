import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { getMyImages } from "~/server/queries";
import { Card, CardContent } from "~/components/ui/card";

export const dynamic = "force-dynamic";

async function Images() {
  const images = await getMyImages();

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {images.map((image) => (
        <div key={image.id} className="flex h-48 w-48 flex-col">
          <Link href={`/img/${image.id}`}>
            <Image
              src={image.url}
              style={{ objectFit: "contain" }}
              width={192}
              height={192}
              alt={image.name}
            />
          </Link>
          <div>{image.name}</div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  return (
    <main className="">
      <div className="grid h-screen w-screen grid-cols-1 items-center justify-center gap-6 p-4 sm:grid-cols-2 sm:gap-2">
        <Link
          href="/admin"
          className="flex h-full w-full items-end justify-center sm:items-center"
        >
          <Card className="h-full max-h-60 w-full max-w-60 rounded-[20px] bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-2 shadow-2xl hover:bg-neutral-900 sm:max-h-80 sm:max-w-xs">
            <CardContent className="flex h-full flex-col items-center justify-center rounded-2xl bg-neutral-800">
              <div className="items-center justify-center rounded-2xl">
                <h2 className="flex items-center justify-center pb-1 text-xl sm:text-4xl">
                  Admin demo
                </h2>
                <span className="sm:text-md flex items-center justify-center text-sm text-neutral-300">
                  (Requires login)
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link
          href="/audits/1"
          className="flex h-full w-full items-start justify-center sm:items-center"
        >
          <Card className="h-full max-h-60 w-full max-w-60 rounded-[20px] bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-2 shadow-2xl hover:bg-neutral-900 sm:max-h-80 sm:max-w-xs">
            <CardContent className="flex h-full flex-col items-center justify-center rounded-2xl bg-neutral-800">
              <div className="items-center justify-center">
                <h2 className="flex items-center justify-center pb-1 text-xl sm:text-4xl">
                  Audit demo
                </h2>
                <span className="sm:text-md flex items-center justify-center text-sm text-neutral-300">
                  (Does not require login)
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
