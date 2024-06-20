export const TaskTypes = {
  makeDirectories: {
    id: 1,
    retryCount: 3,
    required: true,
    taskModule: "fileIO"
  },
  downloadMedia: {
    id: 2,
    retryCount: 3,
    required: true,
    taskModule: "downloader"
  },
  createItem: {
    id: 3,
    retryCount: 3,
    required: true,
    taskModule: "manifest"
  },
  overwriteManifest: {
    id: 4,
    retryCount: 3,
    required: true,
    taskModule: "manifest"
  },
  createLiveStreams: {
    id: 5,
    retryCount: 3,
    required: true,
    taskModule: "manifest"
  }
};
