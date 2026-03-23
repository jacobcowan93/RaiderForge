import { redirect } from 'next/navigation'

/** Legacy URL — all links should use `/maps`. */
export default function MapRedirectPage() {
    redirect('/maps')
}
