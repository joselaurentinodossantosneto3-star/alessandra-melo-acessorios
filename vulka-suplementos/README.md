# VULKA Suplementos

Landing page de suplementos de academia (whey, creatina, pré-treino) com motion design.
Site estático: HTML, CSS e JavaScript puro, sem build e sem dependências.

> **Marca, preços e valores nutricionais são de exemplo.** "VULKA" é um nome provisório.
> Troque pelos dados reais antes de publicar.

## Como abrir

Qualquer servidor estático serve. Por exemplo, dentro desta pasta:

```bash
python3 -m http.server 4173
# abra http://localhost:4173
```

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Todo o conteúdo e os textos das seções |
| `css/style.css` | Layout, cores e estados de animação (tokens no `:root`, no topo) |
| `js/app.js` | Catálogo, sabores, pote 3D em canvas, carrinho, calculadora e animações |

## O que editar

Tudo fica no começo de `js/app.js`:

- **`CONFIG.marca`**: nome que aparece no rótulo e na tampa do pote. O logo do menu, do rodapé e o `<title>` ficam no `index.html`.
- **`CONFIG.whatsapp`**: número que recebe os pedidos, só dígitos com DDI e DDD (ex.: `5511999999999`). Enquanto estiver vazio, o botão "Finalizar pedido" mostra um aviso de demonstração.
- **`FLAVORS`**: sabores do Whey Isolado. Cada um define a cor que toma a página (`field`), a cor de destaque (`pop`) e as cores de texto sobre ela.
- **`PRODUCTS`**: catálogo. Nome, preço, texto do cartão, cor e o que vai escrito no rótulo de cada pote.

A tabela nutricional, o aminograma e as dúvidas ficam no `index.html`.

## Movimento

- **Pote 3D sem WebGL**: o rótulo é desenhado em um canvas e "enrolado" em um cilindro coluna a coluna (`class Tub`). Dá para arrastar e girar.
- **Tipografia cinética**: a fonte Anybody tem eixos de largura e peso. O título do topo ganha massa ao carregar e reage ao ponteiro; os títulos das seções alargam conforme entram na tela.
- **Troca de sabor**: a cor nova abre em círculo a partir da amostra clicada, o pote gira e troca o rótulo, e a página inteira muda de cor.
- **Scroll**: letreiro que acelera com a velocidade, anilhas que rolam até a posição, pote fixo que gira até a face de cada argumento.
- Com "reduzir movimento" ativado no sistema, as animações são desligadas e o conteúdo aparece direto.

## Publicar

Os caminhos são relativos, então a pasta funciona em qualquer endereço.
Para um domínio próprio, crie um projeto na Vercel apontando para esta pasta como diretório raiz.

Não há depoimentos, selos nem registros na página de propósito: esses itens precisam ser reais.
