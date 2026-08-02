import { useEffect, useState } from 'react';

const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      const scrollPercentRounded = Math.round(scrollPercent * 100);

      setProgress(Math.min(100, Math.max(0, scrollPercentRounded)));
    };

    const throttledUpdateProgress = () => {
      requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', throttledUpdateProgress);
    updateProgress(); // Initial calculation

    return () => window.removeEventListener('scroll', throttledUpdateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full z-50 h-1 bg-muted">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ReadingProgress;