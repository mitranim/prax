const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation, correctPageAnchors} = require('../features/dom')
const {NavLink} = require('./link')

export class Api extends PraxComponent {
  subrender ({deref}) {
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='flex-1 col-start-stretch'>
          <NavLink to='#' className='sidenav-link'>Overview</NavLink>
          <NavLink to='#-praxcomponent-' className='sidenav-link'><code>PraxComponent</code></NavLink>
          <NavLink to='#-byquery-observableref-query-' className='sidenav-link'><code>byQuery</code></NavLink>
          <NavLink to='#-bypath-observableref-path-' className='sidenav-link'><code>byPath</code></NavLink>
          <NavLink to='#-computation-def-' className='sidenav-link'><code>computation</code></NavLink>
          <NavLink to='#-on-argpattern-fun-' className='sidenav-link'><code>on</code></NavLink>
          <NavLink to='#espo' className='sidenav-link'>Espo</NavLink>
          <NavLink to='#emerge' className='sidenav-link'>Emerge</NavLink>
          <NavLink to='#fpx' className='sidenav-link'>fpx</NavLink>
        </div>
        <article
          className='flex-4 padding-stocky'
          onClick={maybeInterceptAnchorNavigation}
          {...htmlProps(correctPageAnchors(this.env, deref, require('./api.md')))}
          />
      </div>
    )
  }
}
