module.exports = {
  purge: false,
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
          fontFamily: "'Source Code Pro'",
          color: theme('colors.light'),
          h1: {
            color: theme('colors.lightest'),
            fontWeight: '500',
          },
          h2: {
            color: theme('colors.lightest'),
            fontWeight: '500',
          },
          a: {
            color: theme('colors.light'),
            // fontVariantCaps: 'all-petite-caps',
            textDecoration: 'none',
          },
          code: {
            color: theme('colors.darkest'),
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
      },
    }),
  },
  variants: {},
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-typography'),
  ],
}
