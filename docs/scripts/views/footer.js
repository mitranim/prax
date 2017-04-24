const React = require('react')
const {PraxComponent} = require('prax')
const {smoothScrollToTop} = require('../utils')

export class Footer extends PraxComponent {
  subrender () {
    return (
      <div className='row-between-stretch children-margin-1-h margin-2-t padding-1'>
        <span className='flex-1 col-start-start'>
          <span>2015—{new Date().getFullYear()}</span>
          <a href='https://mitranim.com' target='_blank' className='decorated'>Nelo Mitranim</a>
        </span>
        <span className='row-end-center'>
          <button
            className='fa fa-arrow-up fg-gray padding-0x5'
            onClick={() => {
              smoothScrollToTop(120)
            }} />
        </span>
      </div>
    )
  }
}
