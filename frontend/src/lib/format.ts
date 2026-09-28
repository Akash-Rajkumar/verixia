/**
 * Safely format a BigInt decimal string (in smallest units, e.g. Wei) into a human-readable display amount.
 * Never uses parseFloat or unsafe Number precision loss.
 */
export function formatNativeAmount(
  amountWei: string | undefined | null,
  decimals: number = 18,
  symbol: string = "MST"
): string {
  if (!amountWei || amountWei.trim() === "") {
    return `0 ${symbol}`
  }

  try {
    const bg = BigInt(amountWei.trim())
    const divisor = BigInt(10 ** decimals)
    const integerPart = bg / divisor
    const remainder = bg % divisor

    if (remainder === 0n) {
      return `${integerPart.toString()} ${symbol}`
    }

    // Pad remainder with leading zeros to decimals length
    let remainderStr = remainder.toString().padStart(decimals, "0")
    // Trim trailing zeros for cleaner display
    remainderStr = remainderStr.replace(/0+$/, "")

    // Limit decimal display to max 4 decimal places for UI cleanly
    if (remainderStr.length > 4) {
      remainderStr = remainderStr.slice(0, 4)
    }

    return `${integerPart.toString()}.${remainderStr} ${symbol}`
  } catch (err) {
    console.error("Failed to parse amountWei using BigInt:", amountWei, err)
    return `0 ${symbol}`
  }
}

/**
 * Truncate EVM wallet address for UI display (e.g. 0x1234...5678)
 */
export function truncateAddress(
  address: string | undefined | null,
  startLen = 6,
  endLen = 4
): string {
  if (!address) return "0x0000...0000"
  if (address.length <= startLen + endLen) return address
  return `${address.slice(0, startLen)}...${address.slice(-endLen)}`
}

/**
 * Truncate transaction or reasoning hash for UI display (e.g. 0xabcdef12...345678)
 */
export function truncateHash(
  hash: string | undefined | null,
  startLen = 8,
  endLen = 6
): string {
  if (!hash) return "0x0000...0000"
  if (hash.length <= startLen + endLen) return hash
  return `${hash.slice(0, startLen)}...${hash.slice(-endLen)}`
}

/**
 * Copy text to clipboard safely
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")
      textArea.remove()
      return successful
    }
  } catch (err) {
    console.error("Failed to copy to clipboard:", err)
    return false
  }
}
