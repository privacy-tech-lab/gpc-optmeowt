import { errors } from 'puppeteer'

async function waitForNetworkIdleInternal (page) {
    try {
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 })
    } catch (e) {
        if (e instanceof errors.TimeoutError) {
            throw new errors.TimeoutError(
                'Timed out waiting for network idle.'
            )
        } else {
            throw e
        }
    }
}

async function forNetworkIdle (page) {
    try {
        await waitForNetworkIdleInternal(page)
    } catch (e) {
        if (e instanceof errors.TimeoutError) {
            pending(e.message)
        } else {
            throw e
        }
    }
}

async function forGoto (page, url) {
    try {
        await page.goto(
            url, { waitUntil: 'networkidle0', timeout: 15000 }
        )
        await waitForNetworkIdleInternal(page)
    } catch (e) {
        if (e instanceof errors.TimeoutError) {
            pending('Timed out loading URL: ' + url)
        } else {
            throw e
        }
    }
}

async function forReload (page) {
    try {
        await page.reload({ waitUntil: 'networkidle0', timeout: 15000 })
        await waitForNetworkIdleInternal(page)
    } catch (e) {
        if (e instanceof errors.TimeoutError) {
            pending('Timed out reloading page: ' + page.url())
        } else {
            throw e
        }
    }
}

export default {
    forGoto,
    forReload,
    forNetworkIdle
}