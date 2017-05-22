const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation, correctPageAnchors} = require('../features/dom')
const {NavLink} = require('./link')

export class Overview extends PraxComponent {
  subrender () {
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='flex-1 col-start-stretch'>
          <NavLink to='#' className='sidenav-link'>Overview</NavLink>
          <NavLink to='#problems-and-solutions' className='sidenav-link'>Problems</NavLink>
          <NavLink to='#big-ideas' className='sidenav-link'>Big Ideas</NavLink>
          <NavLink to='#inspiration' className='sidenav-link'>Inspiration</NavLink>
        </div>
        <div>
          <article
            className='flex-4 padding-stocky'
            onClick={maybeInterceptAnchorNavigation}
            {...htmlProps(correctPageAnchors(this.props.location, require('./overview.md')))} />
        </div>
      </div>
    )
  }
}
