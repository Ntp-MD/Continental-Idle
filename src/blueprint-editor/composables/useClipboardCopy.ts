import { useToast } from '@/composables/useToast'

export function useClipboardCopy() {
  const toast = useToast()

  async function copyId(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id)
      toast.success('ID copied')
    } catch {
      toast.warning('Copy failed')
    }
  }

  return { copyId }
}
