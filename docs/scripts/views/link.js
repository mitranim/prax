const React = require('react')
const {Link: RouterLink, NavLink: RouterNavLink} = require('react-router-dom')
const {PraxComponent, byPath} = require('prax/react')

export const Link = RouterLink

export class NavLink extends PraxComponent {
  render ({deref, env, props: {to, ...props}}) {
    const {dom} = env.deref()
    const location = deref(byPath(dom, ['nav', 'location']))

    return (
      <RouterNavLink
        to={/^#/.test(to) && location ? (location.pathname + to) : to}
        location={location}
        {...props} />
    )
  }
}
