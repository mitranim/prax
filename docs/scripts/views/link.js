const React = require('react')
const {Link: RouterLink, NavLink: RouterNavLink} = require('react-router-dom')
const {PraxComponent} = require('prax')
const {journal} = require('../utils')

export const Link = RouterLink

export class NavLink extends PraxComponent {
  componentWillMount () {
    super.componentWillMount()
    this.unsub = journal.listen(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount () {
    this.unsub()
    super.componentWillUnmount()
  }

  subrender () {
    return <RouterNavLink {...this.props} location={journal.location} />
  }
}
