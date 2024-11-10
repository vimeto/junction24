"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { DemoAuditModal } from "./_components/demo-audit-modal";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="cursor-default">
      <div className="mx-auto max-w-[800px]">
        <div className="grid corrected-h-screen grid-cols-1 items-center justify-center gap-4 p-2 lg:grid-cols-2">
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
            <button
              onClick={() => setIsModalOpen(true)}
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
                      (No login required)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>
        </div>
      </div>

      <DemoAuditModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </main>
  );
}
