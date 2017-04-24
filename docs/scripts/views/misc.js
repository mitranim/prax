const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation, correctPageAnchors} = require('../features/dom')
const {NavLink} = require('./link')

export class Misc extends PraxComponent {
  subrender ({deref}) {
    const {env: {atom}} = this
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='sidenav'>
          <NavLink to='#' className='sidenav-link'>Definitions</NavLink>
        </div>
        <article
          className='flex-1 padding-0x5-v padding-1-h'
          onClick={maybeInterceptAnchorNavigation}
          {...htmlProps(correctPageAnchors(require('./misc.md'), deref, atom))} />
      </div>
    )
  }
}
