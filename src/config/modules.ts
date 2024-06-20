export const Modules = {
  manifest: {
    id: 1,
    path: "modules/manifest",
    adaptors: ["io/local-fs", "http/http"]
  },
  downloader: {
    id: 2,
    path: "modules/downloader",
    adaptors: ["http/http", "io/local-fs"]
  },
  fileIO: {
    id: 3,
    path: "modules/fileIO",
    adaptors: ["io/local-fs"]
  }
};
