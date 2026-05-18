"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import ThemeChanger from "@/components/ThemeChanger.jsx"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    React.useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.attributeName === "toggle-theme") {
                    const newTheme = document.documentElement.getAttribute("toggle-theme");
                    if (newTheme === "dark" || newTheme === "light") {
                        setTheme(newTheme);
                    }
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["toggle-theme"] });

        return () => observer.disconnect();
    }, [setTheme]);

    if (!mounted) {
        return <div className="w-10 h-10" />
    }

    return (
        <div className="flex items-center justify-center -mr-2">
            <ThemeChanger 
                toggleType="Button" 
                size={40} 
                defaultTheme={theme === 'dark' ? 'Dark' : 'Light'} 
            />
        </div>
    )
}
