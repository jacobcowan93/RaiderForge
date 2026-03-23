// Static asset module declarations

/** MP4 / WebM video files — webpack returns the resolved URL string */
declare module '*.mp4' {
  const src: string
  export default src
}
declare module '*.webm' {
  const src: string
  export default src
}
