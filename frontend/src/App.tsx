import { useState, useEffect } from "react"
import { VerixiaLandingPage } from "@/components/landing/VerixiaLandingPage"
import { VerixiaCommandCenter } from "@/components/dashboard/VerixiaCommandCenter"

type ViewMode = "landing" | "dashboard"

function App() {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && (window.location.hash === "#app" || window.location.hash === "#dashboard")) {
      return "dashboard"
    }
    return "landing"
  })

  // Sync with URL hash for browser history navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#app" || window.location.hash === "#dashboard") {
        setView("dashboard")
      } else if (window.location.hash === "#landing" || window.location.hash === "") {
        setView("landing")
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const openDashboard = () => {
    setView("dashboard")
    window.location.hash = "#dashboard"
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openLanding = () => {
    setView("landing")
    window.location.hash = "#landing"
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (view === "dashboard") {
    return <VerixiaCommandCenter onBackToLanding={openLanding} />
  }

  return <VerixiaLandingPage onOpenCommandCenter={openDashboard} />
}

export default App
