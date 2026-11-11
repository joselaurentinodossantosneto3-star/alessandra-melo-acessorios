# Mica Estética Automotiva

Landing page de estúdio de estética automotiva (lavagem técnica, polimento, vitrificação) com motion design.
Site estático: HTML, CSS e JavaScript puro, sem build e sem dependências.

> **Marca, preços e prazos são de exemplo.** "Mica" é um nome provisório.
> Troque pelos dados reais antes de publicar.

## Como abrir

Qualquer servidor estático serve. Por exemplo, dentro desta pasta:

```bash
python3 -m http.server 4174
# abra http://localhost:4174
```

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Conteúdo e textos das seções, e o desenho do carro (SVG) |
| `css/style.css` | Layout, cores e estados de animação (tokens no `:root`, no topo) |
| `js/app.js` | Catálogo, cores de pintura, motor de pintura em canvas, formulário e animações |

## O que editar

Tudo fica no começo de `js/app.js`:

- **`CONFIG.marca`**: nome usado na mensagem de agendamento. O logo do menu, do rodapé e o `<title>` ficam no `index.html`.
- **`CONFIG.whatsapp`**: número do estúdio, só dígitos com DDI e DDD (ex.: `5511999999999`). Com ele preenchido aparece o botão "Abrir no WhatsApp". Vazio, o formulário oferece só "Copiar mensagem".
- **`PAINTS`**: cores de pintura do seletor do topo, em RGB. Se mudar a lista, ajuste também os botões em `index.html`.
- **`SERVICES`**: serviços da lista. O campo `zona` diz qual parte do carro acende no desenho: `pintura`, `interior`, `vidros`, `farois`, `rodas` ou `motor`.
- **`PACKS`** e **`SIZES`**: pacotes e multiplicador de preço por porte do carro.

As etapas do processo e as dúvidas ficam no `index.html`.

## Movimento

- **Pintura viva**: o topo é um canvas que desenha a lataria em camadas (base, vinco, flocos metálicos, reflexo do teto de LED hexagonal). A luz acompanha o ponteiro e o brilho da palavra "espelho" vai junto.
- **Água**: clicar na pintura joga gotas, que ficam em bolinha e escorrem levando as vizinhas.
- **Processo**: uma seção fixa em que o scroll conduz quatro etapas sobre o mesmo painel. A espuma desce e é enxaguada, a argila tira a contaminação, a politriz apaga os riscos de lavagem e o coating deixa o reflexo nítido. Os números de brilho, verniz e ângulo de contato acompanham.
- **Serviços**: o carro se desenha ao entrar na tela e cada serviço acende a sua parte.
- **Pacotes**: o preço rola até o novo valor quando o porte muda.
- Com "reduzir movimento" ativado no sistema, as animações são desligadas e o processo vira uma lista com o painel já pronto.
- Em aparelhos lentos a página baixa sozinha a resolução dos canvases.

## Publicar

Os caminhos são relativos, então a pasta funciona em qualquer endereço.
Para um domínio próprio, crie um projeto na Vercel apontando para esta pasta como diretório raiz.

Não há depoimentos, fotos de antes e depois nem endereço na página de propósito: esses itens precisam ser reais.
