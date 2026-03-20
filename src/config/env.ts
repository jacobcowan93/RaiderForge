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
            throw new Error('Missing G2G environment variables. Ensure G2G_API_KEY, G2G_SECRET, and G2G_USERNAME are set in your .env for development.')
        }
    }

    return {
        apiKey: apiKey || '',
        secret: secret || '',
        username: username || ''
    }
}

export const g2gEnv = getG2GEnv()
