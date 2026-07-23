import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'operationsTheme',
    themes: {
      operationsTheme: {
        dark: false,
        colors: {
          background: '#f5f7fb',
          surface: '#ffffff',
          primary: '#2451b2',
          secondary: '#0f766e',
          success: '#15803d',
          warning: '#b45309',
          error: '#b91c1c',
          info: '#0369a1',
        },
      },
    },
  },
})
