import { create } from 'zustand';
import { ImageItem } from './types';

interface ImageCarouselStore {
  images: ImageItem[];
  currentIndex: number;
  isComplete: boolean;
  nextImagePreloaded: boolean;
  exitDirection: 'left' | 'right' | null;
  setImages: (images: ImageItem[]) => void;
  nextImage: (accepted: boolean) => void;
  reset: () => void;
}

export const useImageCarousel = create<ImageCarouselStore>((set, get) => ({
  images: [],
  currentIndex: 0,
  isComplete: false,
  nextImagePreloaded: false,
  exitDirection: null,

  setImages: (images) => {
    set({ images, currentIndex: 0, isComplete: false, exitDirection: null });
    if (images.length > 1 && images[1]) {
      const img = new Image();
      img.src = images[1].url;
      img.onload = () => set({ nextImagePreloaded: true });
    }
  },

  nextImage: (accepted: boolean) => {
    const { currentIndex, images } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= images.length) {
      set({ isComplete: true });
    } else {
      set({
        currentIndex: nextIndex,
        nextImagePreloaded: false,
        exitDirection: accepted ? 'right' : 'left'
      });

      if (nextIndex + 1 < images.length && images[nextIndex + 1]) {
        const img = new Image();
        img.src = images[nextIndex + 1]?.url ?? "";
        img.onload = () => set({ nextImagePreloaded: true });
      }
    }
  },

  reset: () => {
    set({
      currentIndex: 0,
      isComplete: false,
      nextImagePreloaded: false,
      exitDirection: null
    });
  },
}));
