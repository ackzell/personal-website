// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'ackzell',
  icon: {
    favicon: './src/favicon-32x32.png',
  },
  plugins: [
    {
      use: 'gridsome-plugin-tailwindcss',
    },
    {
      use: 'gridsome-plugin-manifest',
      options: {
        background_color: '#000000',
        icon_path: './src/assets/ax.png',
        name: 'My app name',
        short_name: 'App',
        theme_color: '#212121',
        lang: 'en',
      },
    },
  ],
}
