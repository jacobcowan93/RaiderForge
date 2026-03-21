import React from 'react'

export default function Footer() {
    return (
        <footer className="w-full py-6 mt-12 border-t border-rf-border">
            <div className="container mx-auto px-6 text-sm text-rf-textSoft flex items-center justify-between">
                <div>© {new Date().getFullYear()} Raider Forge</div>
                <div>
                    <a href="https://raiderforge.org" className="text-rf-text hover:text-rf-red">raiderforge.org</a>
                </div>
            </div>
        </footer>
    )
}
