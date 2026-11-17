const BANNER_KEY = 'successBanner'

/**
 * One-off success banner shown on the next page view (post/redirect/get).
 */
export function flashBanner(request, banner) {
  request.yar.flash(BANNER_KEY, banner, true)
}

export function takeBanner(request) {
  const banner = request.yar.flash(BANNER_KEY)
  const value = Array.isArray(banner) ? banner[0] : banner
  return value && Object.keys(value).length ? value : null
}
