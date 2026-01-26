import * as React from "react"
import NetInfo, { NetInfoState } from "@react-native-community/netinfo"

interface NetworkStatus {
  /** Whether the device is connected to a network */
  isConnected: boolean
  /** Whether the internet is actually reachable */
  isInternetReachable: boolean | null
  /** Connection type: wifi, cellular, none, etc. */
  type: string
}

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = React.useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: "unknown",
  })

  React.useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      })
    })

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return status
}

/**
 * Check if currently online (one-time check, not reactive)
 */
export async function checkIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return state.isConnected === true && state.isInternetReachable !== false
}
