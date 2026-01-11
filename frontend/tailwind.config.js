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
                    50: '#E2EAF5',   // Darkened from #F0F5FA
                    100: '#D0DBE8',  // Darkened from #eaf0f7
                    500: '#5A6178',  // Darkened from #71788f (Muted blue)
                    700: '#10184A',  // Darkened from #17236a (Vibrant)
                    800: '#0A123B',  // Darkened from #0f1c52 (Strong)
                    900: '#040A26',  // Darkened from #0a173b (Deepest Elegant)
                },
                gold: {
                    50: '#FBF9E6',   // Very light cream (Backgrounds)
                    100: '#F7EFC2',
                    300: '#E6C860',
                    400: '#D4AF37',  // The Standard "True Gold" Hex
                    500: '#C5A028',  // Primary Button (Balanced Yellow-Gold)
                    600: '#A38318',  // Hover State (Darker Gold, not Orange)
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
