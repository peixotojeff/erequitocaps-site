export default {
    define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_PAYT_CHECKOUT_URL': JSON.stringify(process.env.VITE_PAYT_CHECKOUT_URL),
    },
};