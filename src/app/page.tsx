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
    <main className="cursor-default">
      <div className="mx-auto max-w-[800px]">
        <div className="grid h-screen grid-cols-1 items-center justify-center gap-4 p-2 lg:grid-cols-2">
          <div className="flex h-full w-full items-end justify-center lg:items-center lg:justify-end lg:-mr-3">
            <Link 
              href="/admin"
              className="block group relative h-full max-h-48 w-full max-w-48 sm:max-h-64 sm:max-w-64 cursor-pointer"
            >
              <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <Card className="relative z-10 h-full rounded-[20px] bg-card transition-all duration-500 group-hover:border-transparent">
                <CardContent className="flex h-full flex-col items-center justify-center rounded-2xl">
                  <div className="items-center justify-center rounded-2xl">
                    <h2 className="flex items-center justify-center pb-1 text-lg sm:text-2xl">
                      Admin demo
                    </h2>
                    <span className="flex items-center justify-center text-center w-full text-xs sm:text-sm text-neutral-300">
                      (Requires login)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="flex h-full w-full items-start justify-center lg:items-center lg:justify-start lg:-ml-3">
            <Link
              href="/audits/1"
              className="block group relative h-full max-h-48 w-full max-w-48 sm:max-h-64 sm:max-w-64 cursor-pointer"
            >
              <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-r from-purple-400 via-pink-800 to-red-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <Card className="relative z-10 h-full rounded-[20px] bg-card transition-all duration-500 group-hover:border-transparent">
                <CardContent className="flex h-full flex-col items-center justify-center rounded-2xl">
                  <div className="items-center justify-center rounded-2xl">
                    <h2 className="flex items-center justify-center pb-1 text-lg sm:text-2xl">
                      Audit demo
                    </h2>
                    <span className="flex items-center justify-center text-center w-full text-xs sm:text-sm text-neutral-300">
                      (Does not require login)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
