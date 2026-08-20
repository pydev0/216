declare module "yt-search" {
  interface VideoResult {
    videoId: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: { seconds: number; timestamp: string };
    views: number;
    author: { name: string };
  }

  interface SearchResult {
    videos: VideoResult[];
  }

  function yts(query: string): Promise<SearchResult>;

  export = yts;
}
