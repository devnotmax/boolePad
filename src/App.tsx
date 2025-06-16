// src/App.tsx
import PseudocodeEditor from "./components/PseudocodeEditor"
import { ToastProvider } from "./hooks/use-toast"
import { useEffect, useState } from "react"

function App() {
  const [uiTheme, setUiTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("uiTheme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.classList.toggle("dark", uiTheme === "dark");
      localStorage.setItem("uiTheme", uiTheme);
    }
  }, [uiTheme]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <PseudocodeEditor uiTheme={uiTheme} setUiTheme={setUiTheme} />
      </div>
    </ToastProvider>
  )
}

export default App
