import React from 'react'

export default function Footer() {
    return (
        <footer className="w-full py-6 mt-12 border-t border-gray-800">
            <div className="container mx-auto px-6 text-sm text-gray-400 flex items-center justify-between">
                <div>© {new Date().getFullYear()} Raider Forge</div>
                <div>
                    <a href="https://raiderforge.org" className="text-gray-300">raiderforge.org</a>
                </div>
            </div>
        </footer>
    )
}
