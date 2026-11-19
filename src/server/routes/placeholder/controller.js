export const placeholderController = {
  handler(request, h) {
    const { heading } = request.route.settings.app

    return h.view('placeholder/index', {
      pageTitle: heading,
      heading
    })
  }
}
