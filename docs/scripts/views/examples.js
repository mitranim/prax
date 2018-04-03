const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation, correctPageAnchors} = require('../features/dom')
const {NavLink} = require('./link')

export class Examples extends PraxComponent {
  render () {
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='flex-1 col-start-stretch'>
          <NavLink to='#' className='sidenav-link'>Basic Usage</NavLink>
          <NavLink to='#demand-driven-resources' className='sidenav-link'>Demand-Driven Resources</NavLink>
          <NavLink to='#event-system' className='sidenav-link'>Event System</NavLink>
          <NavLink to='#reactive-logic' className='sidenav-link'>Reactive Logic</NavLink>
          <NavLink to='#reactive-computations' className='sidenav-link'>Reactive Computations</NavLink>
        </div>
        <article
          className='flex-4 padding-stocky'
          onClick={maybeInterceptAnchorNavigation}
          {...htmlProps(correctPageAnchors(this.props.location, require('./examples.md')))}
          />
      </div>
    )
  }
}
