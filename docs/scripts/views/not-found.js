const React = require('react')
const {PraxComponent} = require('prax/react')
const {Link} = require('./link')

export class NotFound extends PraxComponent {
  render () {
    return (
      <div className='padding-1 children-margin-1-v'>
        <h3>404 Page Not Found</h3>
        <p><Link to='/'>Go to Index</Link></p>
      </div>
    )
  }
}
