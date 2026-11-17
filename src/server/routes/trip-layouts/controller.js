// The prototype's example trip for layout testing (Pots, Trammel net and Dredge gears)
const EXAMPLE_TRIP = '/fishing-trips/C34245202608171402'

// Earlier layout options, in the prototype's order. The variants themselves
// are not built, so each link opens the current trip details page.
const ARCHIVED_LAYOUTS = [
  'A (as-is)',
  'C: wider tabs on the right',
  'B: two columns, labels above values',
  'B2: split table with vessel and user details',
  'E: all sections on one page',
  'E2: vessel and user in trip information',
  'F: balanced content columns',
  'F2: full-width catch, paired History and Notes',
  'D: more trip information shown'
]

export const archiveController = {
  handler(_request, h) {
    return h.view('trip-layouts/archive', {
      pageTitle: 'Archived trip details layouts',
      backLink: { text: 'Back to Back office', href: '/' },
      layouts: ARCHIVED_LAYOUTS.map((text) => ({ text, href: EXAMPLE_TRIP }))
    })
  }
}

// Option 1 (concise information) is the current trip details layout, showing
// the example trip's Pots and Trammel net gears only
export const optionOneController = {
  handler(_request, h) {
    return h.redirect(`${EXAMPLE_TRIP}?gear-example=pots-trammel`)
  }
}

// Option 2 (all information shown) is the same example with the "Other trip
// information" rows shown in the main Trip information list
export const optionTwoController = {
  handler(_request, h) {
    return h.redirect(
      `${EXAMPLE_TRIP}?gear-example=pots-trammel&information=all`
    )
  }
}
