import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('renders the router outlet inside the application shell', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: {
            template: '<main data-test="router-view" />',
          },
          VApp: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
  })
})
