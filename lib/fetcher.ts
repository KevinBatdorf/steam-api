import fetch from 'cross-fetch'

export const fetcher = async (url: string) => {
    try {
        const response = await fetch(url)
        return await response.json()
    } catch (error) {
        console.error(error)
    }
}
