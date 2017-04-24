const React = require('react')
const {Router, Route, Switch} = require('react-router-dom')
const {PraxComponent} = require('prax')
const {journal} = require('../utils')
const {Header} = require('./header')
const {Footer} = require('./footer')
const {Overview} = require('./overview')
const {Api} = require('./api')
const {Examples} = require('./examples')
const {Misc} = require('./misc')
const {NotFound} = require('./not-found')

export class Root extends PraxComponent {
  subrender () {
    return (
      <Router history={journal}>
        <div className='stretch-to-viewport-v'>
          <Header />
          <div className='flex-1 col-start-stretch'>
            <Switch>
              <Route exact path='/' component={Overview} />
              <Route exact path='/api' component={Api} />
              <Route exact path='/examples' component={Examples} />
              <Route exact path='/misc' component={Misc} />
              <Route component={NotFound} />
            </Switch>
          </div>
          <Footer />
        </div>
      </Router>
    )
  }
}
