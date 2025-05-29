const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const axios = require('axios');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
    if (req.method === 'POST' && req.url.includes('/webhook/payt/compra')) {
        const { clienteId, pedidoId, tokenCartao } = req.body;

        // Salvar token no Supabase
        const { error } = await supabase
            .from('tokens')
            .insert({
                cliente_id: clienteId,
                token_cartao: tokenCartao,
                data_expiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

        if (error) {
            console.error('Erro ao salvar token:', error);
            return res.status(500).json({ error: 'Erro ao salvar token' });
        }

        return res.status(200).json({ message: 'OK' });
    }

    if (req.method === 'POST' && req.url.includes('/webhook/payt/abandono')) {
        const { clienteId, produtoId, email, telefone } = req.body;

        // Buscar token no Supabase
        const { data: tokenInfo, error } = await supabase
            .from('tokens')
            .select('token_cartao')
            .eq('cliente_id', clienteId)
            .single();

        if (error || !tokenInfo?.token_cartao) {
            return res.status(400).json({ error: 'Token não encontrado' });
        }

        // Gerar link de recuperação
        const secretKey = process.env.SECRET_KEY || 'sua-chave-secreta';
        const hash = crypto
            .createHash('sha256')
            .update(`${clienteId}-${produtoId}-${Date.now()}-${secretKey}`)
            .digest('hex');
        const linkRecuperacao = `https://erequitocaps-site.vercel.app/recuperar?c=${encodeURIComponent(clienteId)}&p=${encodeURIComponent(produtoId)}&h=${hash}`;

        // Enviar para o n8n
        await axios.post(process.env.N8N_WEBHOOK_URL, {
            telefone,
            mensagem: `Olá! Você deixou um item no carrinho. Clique aqui para concluir sua compra com desconto especial: ${linkRecuperacao}`,
        });

        return res.status(200).json({ message: 'OK' });
    }

    if (req.method === 'GET' && req.url.includes('/recuperar')) {
        const { c: clienteId, p: produtoId, h: hash } = req.query;

        // Validar hash (simplificado)
        const secretKey = process.env.SECRET_KEY || 'sua-chave-secreta';
        const expectedHash = crypto
            .createHash('sha256')
            .update(`${clienteId}-${produtoId}-${Date.now()}-${secretKey}`)
            .digest('hex');
        if (hash !== expectedHash) {
            return res.status(400).json({ error: 'Link inválido ou expirado' });
        }

        // Buscar token no Supabase
        const { data: tokenInfo, error } = await supabase
            .from('tokens')
            .select('token_cartao')
            .eq('cliente_id', clienteId)
            .single();

        if (error || !tokenInfo?.token_cartao) {
            return res.status(400).json({ error: 'Informações de pagamento não disponíveis' });
        }

        try {
            // Integrar com Payt API (substitua pela sua lógica)
            const resultado = await axios.post('https://api.payt.com/processar', {
                clienteId,
                produtoId,
                tokenCartao: tokenInfo.token_cartao,
            });

            if (resultado.data.sucesso) {
                return res.redirect(`/sucesso?pedido=${resultado.data.pedidoId}`);
            } else {
                return res.redirect(`/erro?motivo=${resultado.data.motivo}`);
            }
        } catch (erro) {
            console.error('Erro ao processar pagamento:', erro);
            return res.status(500).json({ error: 'Erro ao processar pagamento' });
        }
    }

    return res.status(404).json({ error: 'Rota não encontrada' });
};