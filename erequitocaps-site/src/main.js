import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

window.handleBuy = async function (kit) {
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;

    if (!email || !telefone) {
        alert('Por favor, preencha e-mail e telefone.');
        return;
    }

    const { error } = await supabase
        .from('leads')
        .insert({ email, telefone, kit_selecionado: kit });

    if (error) {
        console.error('Erro ao salvar lead:', error);
        alert('Erro ao processar. Tente novamente.');
        return;
    }

    const paytCheckoutUrl = import.meta.env.VITE_PAYT_CHECKOUT_URL;
    window.location.href = `${paytCheckoutUrl}?kit=${kit}&email=${encodeURIComponent(email)}&telefone=${encodeURIComponent(telefone)}`;
};