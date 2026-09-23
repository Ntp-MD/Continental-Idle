

// Build-time configuration read in editorConfig.ts. Declared explicitly so a
// misspelled name is a type error instead of a silently undefined value.
interface ImportMetaEnv {
	readonly VITE_PERSISTENCE?: 'http' | 'local'
	readonly VITE_BLUEPRINT_DATA_ENDPOINT?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: { description: string; accept: Record<string, string[]> }[]
}

interface OpenFilePickerOptions {
  types?: { description: string; accept: Record<string, string[]> }[]
}

interface FileSystemFileHandle {
  createWritable: () => Promise<FileSystemWritableFileStream>
  getFile: () => Promise<File>
}

interface FileSystemWritableFileStream extends WritableStream {
  write: (data: string | BufferSource | Blob) => Promise<void>
  close: () => Promise<void>
}
