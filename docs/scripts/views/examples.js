const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation} = require('../features/dom')
const {NavLink} = require('./link')

export class Examples extends PraxComponent {
  subrender () {
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='sidenav'>
          <NavLink to='#' className='sidenav-link'>Basic Usage</NavLink>
          <NavLink to='#demand-driven-resources' className='sidenav-link'>Demand-Driven Resources</NavLink>
          <NavLink to='#event-system' className='sidenav-link'>Event System</NavLink>
          <NavLink to='#reactive-logic' className='sidenav-link'>Reactive Logic</NavLink>
        </div>
        <article
          className='flex-1 padding-0x5-v padding-1-h'
          onClick={maybeInterceptAnchorNavigation}
          {...htmlProps(require('./examples.md'))}>
        </article>
      </div>
    )
  }
}
