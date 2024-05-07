export const WorkflowConfig = {
  GET_M3U8: {
    id: 1,
    name: "GET_M3U8",
    tasks: [
      "makeDirectories",
      "downloadMedia",
      "createItem",
      "overwriteManifest"
    ]
  },
  CREATE_LIVE: {
    id: 2,
    name: "CREATE_LIVE",
    tasks: ["createLiveStreams"]
  }
};
