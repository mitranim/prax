const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation} = require('../features/dom')
const {NavLink} = require('./link')

export class Overview extends PraxComponent {
  subrender () {
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='sidenav'>
          <NavLink to='#' className='sidenav-link'>Overview</NavLink>
          <NavLink to='#inspiration' className='sidenav-link'>Inspiration</NavLink>
        </div>
        <div>
          <article
            className='flex-1 padding-0x5-v padding-1-h'
            onClick={maybeInterceptAnchorNavigation}
            {...htmlProps(require('./overview.md'))} />
        </div>
      </div>
    )
  }
}
