import React, { ReactNode } from 'react'

export default function Card({ title, children, href }: { title: string; children?: ReactNode; href?: string }) {
    const content = (
        <div className="rf-card p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <div className="text-sm text-rf-textSoft">{children}</div>
        </div>
    )

    if (href) return <a href={href}>{content}</a>
    return <div>{content}</div>
}
