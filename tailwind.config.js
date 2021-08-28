module.exports = {
  purge: [
    './src/**/*.html',
    './src/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        darkest: '#212121',
        darker: '#5e5e5e',
        dark: '#8f8f8f',
        light: '#adadad',
        lightest: '#fafafa',
      },
      screens: {
        xs: '568px',
      },
    },
    typography: theme => ({
      default: {
        css: {
          fontFamily: "'Source Code Pro', monospace",
          color: theme('colors.darker'),
          h1: {
            color: theme('colors.darkest'),
            fontWeight: '500',
          },
          h2: {
            color: theme('colors.darkest'),
            fontWeight: '500',
          },
          h3: {
            color: theme('colors.darkest'),
            fontWeight: '500',
          },
          a: {
            fontWeight: '600',
            color: theme('colors.darkest'),
            textDecoration: 'none',
          },
          code: {
            color: theme('colors.darkest'),
            backgroundColor: theme('colors.dark'),
            borderRadius: '0.125rem',
          },
          pre: {
            color: theme('colors.darkest'),
            backgroundColor: theme('colors.darkest'),
            borderWidth: '1px',
            borderColor: theme('colors.dark'),
            borderRadius: '0.125rem',
          },
          blockQuote: {
            color: theme('colors.lightest'),
          },
        },
      },
      dark: {
        css: [
          {
            fontFamily: "'Source Code Pro', monospace",
            color: theme('colors.light'),
            h1: {
              color: theme('colors.lightest'),
              fontWeight: '500',
            },
            h2: {
              color: theme('colors.lightest'),
              fontWeight: '500',
            },
            h3: {
              color: theme('colors.lightest'),
              fontWeight: '500',
            },
            a: {
              fontWeight: '500',
              color: theme('colors.lightest'),
              // fontVariantCaps: 'all-petite-caps',
              textDecoration: 'none',
            },
            code: {
              color: theme('colors.light'),
              backgroundColor: theme('colors.light'),
              borderRadius: '0.125rem',
            },
            pre: {
              color: theme('colors.lightest'),
              backgroundColor: theme('colors.darkest'),
              borderWidth: '1px',
              borderColor: theme('colors.light'),
              borderRadius: '0.125rem',
            },
            blockQuote: {
              color: theme('colors.lightest'),
            },
          },
        ],
      },
    }),
  },
  darkMode: 'media',
  variants: {
    extend: {
      typography: ['dark'],
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
