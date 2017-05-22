const React = require('react')
const {PraxComponent} = require('prax')
const {htmlProps} = require('../utils')
const {maybeInterceptAnchorNavigation, correctPageAnchors} = require('../features/dom')
const {NavLink} = require('./link')

export class Api extends PraxComponent {
  subrender () {
    return (
      <div className='row-between-stretch padding-1-v'>
        <div className='flex-1 col-start-stretch'>
          <NavLink to='#' className='sidenav-link'>Overview</NavLink>
          <NavLink to='#-praxcomponent-' className='sidenav-link'>
            <code>PraxComponent</code>
          </NavLink>
          <NavLink to='#-praxcomponent-subrender-reaction-' className='sidenav-link margin-1-l'>
            <code>.subrender</code>
          </NavLink>
          <NavLink to='#-praxcomponent-setup-props-state-' className='sidenav-link margin-1-l'>
            <code>.setup</code>
          </NavLink>
          <NavLink to='#-praxcomponent-shouldcomponentupdate-' className='sidenav-link margin-1-l'>
            <code>.shouldComponentUpdate</code>
          </NavLink>
          <NavLink to='#-renderque-' className='sidenav-link'>
            <code>RenderQue</code>
          </NavLink>
          <NavLink to='#-renderque-global-' className='sidenav-link margin-1-l'>
            <code>RenderQue.global</code>
          </NavLink>
          <NavLink to='#-renderque-dam-' className='sidenav-link margin-1-l'>
            <code>.dam</code>
          </NavLink>
          <NavLink to='#-renderque-flush-' className='sidenav-link margin-1-l'>
            <code>.flush</code>
          </NavLink>
          <NavLink to='#-byquery-observableref-query-' className='sidenav-link'>
            <code>byQuery</code>
          </NavLink>
          <NavLink to='#-bypath-observableref-path-' className='sidenav-link'>
            <code>byPath</code>
          </NavLink>
          <NavLink to='#-computation-def-' className='sidenav-link'>
            <code>computation</code>
          </NavLink>
          <NavLink to='#-on-argpattern-fun-' className='sidenav-link'>
            <code>on</code>
          </NavLink>
          <NavLink to='#espo' className='sidenav-link'>Espo</NavLink>
          <NavLink to='#emerge' className='sidenav-link'>Emerge</NavLink>
          <NavLink to='#fpx' className='sidenav-link'>fpx</NavLink>
        </div>
        <article
          className='flex-4 padding-stocky'
          onClick={maybeInterceptAnchorNavigation}
          {...htmlProps(correctPageAnchors(this.props.location, require('./api.md')))}
          />
      </div>
    )
  }
}
