import { apiClient } from "./client"
import { mockApiClient } from "./mocks/mockApi"

const useMocks =
  import.meta.env.VITE_USE_MOCKS === "true" ||
  import.meta.env.VITE_USE_MOCKS === true ||
  true // Default to mock mode during Buildathon development when no live backend is specified

export const api = useMocks ? mockApiClient : apiClient

export * from "./types"
export * from "./constants"
export * from "./client"
export * from "./mocks/mockApi"
