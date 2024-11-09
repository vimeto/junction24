"use client";

import { useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ImageCarousel } from "./image-carousel";
import { useImageCarousel } from "./use-image-carousel";

const images = [
  { name: "Image 1", url: "https://images.pexels.com/photos/6934325/pexels-photo-6934325.png?cs=srgb&dl=pexels-xperimental-6934325.jpg" },
  { name: "Image 2", url: "https://images.pexels.com/photos/733500/pexels-photo-733500.jpeg?cs=srgb&dl=pexels-andrewperformance1-733500.jpg" },
  { name: "Image 3", url: "https://images.pexels.com/photos/28513048/pexels-photo-28513048.jpeg" },
  { name: "Image 4", url: "https://images.pexels.com/photos/15289416/pexels-photo-15289416.jpeg?cs=srgb&dl=pexels-theshantanukr-15289416.jpg" }
];

export function ImageValidation() {
  const { currentIndex, isComplete, exitDirection, setImages, nextImage } = useImageCarousel();

  useEffect(() => {
    setImages(images);
  }, [setImages]);

  const handleAccept = () => {
    console.log("Image accepted:", images[currentIndex]);
    nextImage(true);
  };

  const handleReject = () => {
    console.log("Image rejected:", images[currentIndex]);
    nextImage(false);
  };

  if (isComplete) {
    return (
      <Card className="flex flex-col items-center p-8">
        <div className="text-xl font-semibold text-gray-700 mb-4">
          All images have been reviewed! 🎉
        </div>
        <div className="text-gray-500">
          There are no more images to validate at this time.
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center p-4">
      {images[currentIndex] && (
        <ImageCarousel currentImage={images[currentIndex]} exitDirection={exitDirection} />
      )}

      <div className="flex gap-4">
        <Button onClick={handleReject} variant="destructive">
          Reject
        </Button>
        <Button onClick={handleAccept} variant="default">
          Accept
        </Button>
      </div>
    </Card>
  );
}
