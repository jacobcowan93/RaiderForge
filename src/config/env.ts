type G2GEnv = {
    apiKey: string
    secret: string
    username: string
}

function getG2GEnv(): G2GEnv {
    const apiKey = process.env.G2G_API_KEY
    const secret = process.env.G2G_SECRET
    const username = process.env.G2G_USERNAME

    if (process.env.NODE_ENV === 'development') {
        if (!apiKey || !secret || !username) {
            console.warn('[G2G] Missing env vars (G2G_API_KEY, G2G_SECRET, G2G_USERNAME). Marketplace features will be disabled.')
        }
    }

    return {
        apiKey: apiKey || '',
        secret: secret || '',
        username: username || ''
    }
}

export const g2gEnv = getG2GEnv()
