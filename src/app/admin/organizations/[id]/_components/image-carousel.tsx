"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "./types";

interface ImageCarouselProps {
  currentImage: ImageItem;
  exitDirection: 'left' | 'right' | null;
}

export function ImageCarousel({ currentImage, exitDirection }: ImageCarouselProps) {
  return (
    <div className="relative aspect-[9/16] w-full max-w-md bg-black mb-4 overflow-hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentImage.url}
          className="absolute inset-0"
          initial={{
            x: '100%',
            opacity: 0
          }}
          animate={{
            x: 0,
            opacity: 1
          }}
          exit={{
            x: exitDirection === 'left' ? '-100%' : exitDirection === 'right' ? '100%' : 0,
            opacity: 1
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        >
          <img
            src={currentImage.url}
            alt={currentImage.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
