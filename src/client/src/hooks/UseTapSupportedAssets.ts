// XBT fork: the list of "supported" Taproot Assets (with prices) came from Amboss Rails.
// Nothing is fetched now; the assets views work with what the node itself reports.
export const useGetTapSupportedAssetsQuery = (): {
  data: { rails?: { get_tap_supported_assets?: { list: any[] } } } | undefined;
  loading: boolean;
} => ({ data: undefined, loading: false });
