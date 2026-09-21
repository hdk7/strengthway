// Only one video plays at a time — starting another pauses whatever else was playing.
export function handleVideoPlay(target) {
  const allVideos = document.querySelectorAll("video");
  allVideos.forEach((v) => {
    if (v !== target && !v.paused) {
      v.pause();
    }
  });
}
