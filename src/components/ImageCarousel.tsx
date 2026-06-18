import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

interface ImageCarouselProps {
  images: string[];
  interval?: number;
  className?: string;
}

export function ImageCarousel({ images, interval = 3000, className = '' }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselImages = useMemo(
    () => images.filter((image) => image.trim().length > 0),
    [images]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [carouselImages.length]);

  useEffect(() => {
    if (carouselImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % carouselImages.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [carouselImages.length, interval]);

  if (carouselImages.length === 0) {
    return (
      <div className={`relative h-full min-h-[320px] overflow-hidden rounded-2xl bg-gray-100 ${className}`} />
    );
  }

  return (
    <div className={`relative h-full min-h-[320px] overflow-hidden rounded-2xl bg-gray-900 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={`${carouselImages[activeIndex]}-${activeIndex}`}
          src={carouselImages[activeIndex]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, x: 48, scale: 1.04 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -48, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <motion.div
        key={`overlay-${activeIndex}`}
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      />

      {carouselImages.length > 1 && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
          {carouselImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;
