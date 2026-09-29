import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n, { changeLocale } from '@/i18n'

describe('the language follows the device region', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    return changeLocale('en')
  })

  it('adds the region the device uses: fr → fr-CH', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB', 'fr-CH'])
    await changeLocale('fr')
    expect(i18n.language).toBe('fr-CH')
  })

  it('ignores a tag Intl refuses, e.g. en-US@posix on Linux', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US@posix'])
    await changeLocale('en')
    expect(i18n.language).toBe('en')
  })
})
