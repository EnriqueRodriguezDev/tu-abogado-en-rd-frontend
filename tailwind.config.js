export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    900: '#0a192f', // Deepest Navy
                    800: '#112240',
                    700: '#233554',
                    50: '#f0f4f8',
                },
                gold: {
                    400: '#d4af37',
                    500: '#c5a059', // Primary Gold
                    600: '#b08d55',
                },
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['"Inter"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
