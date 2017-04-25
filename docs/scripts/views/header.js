const React = require('react')
const {PraxComponent} = require('prax')
const {Link, NavLink} = require('./link')

export class Header extends PraxComponent {
  subrender () {
    return (
      <div id='header' className='header-fixed row-between-stretch children-margin-2-h text-2'>
        <div className='row-start-stretch'>
          <Link to='/' className='fat-rectangle'>Prax</Link>
          <NavLink to='/' exact className='fat-rectangle theme-interact-inverse'>Overview</NavLink>
          <NavLink to='/api' className='fat-rectangle theme-interact-inverse'>API</NavLink>
          <NavLink to='/examples' className='fat-rectangle theme-interact-inverse'>Examples</NavLink>
          <NavLink to='/misc' className='fat-rectangle theme-interact-inverse'>Misc</NavLink>
        </div>
        <a
          href='https://github.com/Mitranim/prax'
          target='_blank'
          className='fat-rectangle theme-interact-inverse children-margin-0x5-h'>
          <span>Source</span>
          <span className='fa fa-github' />
        </a>
      </div>
    )
  }
}
