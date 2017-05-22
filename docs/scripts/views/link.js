const React = require('react')
const {Link: RouterLink, NavLink: RouterNavLink} = require('react-router-dom')
const {PraxComponent, byPath} = require('prax')

export const Link = RouterLink

export class NavLink extends PraxComponent {
  subrender ({deref}) {
    const {props: {to, ...props}} = this
    const {dom} = this.env.deref()
    const location = deref(byPath(dom, ['nav', 'location']))

    return (
      <RouterNavLink
        to={/^#/.test(to) && location ? (location.pathname + to) : to}
        location={location}
        {...props} />
    )
  }
}
