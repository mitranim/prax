const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation, correctPageAnchors} = require('../features/dom')
const {NavLink} = require('./link')

export class Api extends PraxComponent {
  subrender ({deref}) {
    const {env: {atom}} = this
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='sidenav'>
          <NavLink to='#' className='sidenav-link'>Overview</NavLink>
          <NavLink to='#-praxcomponent-' className='sidenav-link'><code>PraxComponent</code></NavLink>
          <NavLink to='#-bypath-observable-path-' className='sidenav-link'><code>byPath</code></NavLink>
          <NavLink to='#-on-argpattern-fun-' className='sidenav-link'><code>on</code></NavLink>
          <NavLink to='#espo' className='sidenav-link'>Espo</NavLink>
          <NavLink to='#emerge' className='sidenav-link'>Emerge</NavLink>
          <NavLink to='#fpx' className='sidenav-link'>fpx</NavLink>
        </div>
        <article
          className='flex-1 padding-0x5-v padding-1-h'
          onClick={maybeInterceptAnchorNavigation}
          {...htmlProps(correctPageAnchors(require('./api.md'), deref, atom))} />
      </div>
    )
  }
}
