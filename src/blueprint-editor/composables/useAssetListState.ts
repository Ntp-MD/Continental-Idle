import { computed, ref } from 'vue'
import { useAssetsStore } from '../blueprintStore'
import { assetIncompleteTitle, assetSettingsIssuesMap, placedObjectCounts } from '../assetUtils'
import { useDebouncedRef } from '@/composables/useDebounceFn'
import type { AssetDef } from '../types'

export function useAssetListState() {
  const store = useAssetsStore()

  const searchQuery = ref('')
  const debouncedSearch = useDebouncedRef(searchQuery, 150)

  const allAssets = computed(() => [...store.assetMap().values()])

  const incompleteMap = computed(() => assetSettingsIssuesMap(allAssets.value))

  const placedCounts = computed(() => placedObjectCounts(store.state.layout.floors))

  const filteredAssets = computed(() => {
    const q = debouncedSearch.value.trim().toLowerCase()
    if (!q) return allAssets.value
    return allAssets.value.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
  })

  function incompleteTitle(asset: AssetDef): string {
    return assetIncompleteTitle(incompleteMap.value, asset.id)
  }

  function placedObjectCount(assetId: string): number {
    return placedCounts.value.get(assetId) ?? 0
  }

  return {
    searchQuery,
    allAssets,
    filteredAssets,
    incompleteMap,
    incompleteTitle,
    placedCounts,
    placedObjectCount,
  }
}
