/**
 * Detects if a URL is a YouTube link.
 */
export const isYouTubeUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Detects if a URL points to a common video file format.
 */
export const isVideoUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext + '?'));
};

/**
 * Converts a standard YouTube URL to an embed URL.
... (rest of the file)
 * Also adds parameters for autoplay, mute, and loop.
 */
export const getYouTubeEmbedUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    let videoId = '';

    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
    }

    if (!videoId) return url;

    // Parameters for background-style video (autoplay, mute, loop, no controls)
    // playlist parameter is required for looping YouTube videos
    // enablejsapi=1 can help with some browser restrictions
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`;
};
