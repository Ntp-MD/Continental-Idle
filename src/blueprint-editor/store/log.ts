export const editorLog = {
  error(context: string, error: unknown) {
    console.error(`[BlueprintEditor] ${context}:`, error)
  },
  warn(context: string, ...args: unknown[]) {
    console.warn(`[BlueprintEditor] ${context}:`, ...args)
  },
  info(context: string, ...args: unknown[]) {
    console.info(`[BlueprintEditor] ${context}:`, ...args)
  },
}
