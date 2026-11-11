# Alvor Lume

Página de lançamento de um carro de luxo (grand tourer elétrico) com motion design e o carro em 3D.
Site estático: HTML, CSS e JavaScript, sem build.

> **Carro-conceito.** "Alvor" e "Lume" são nomes inventados, e preços e números da ficha são demonstrativos.
> O rodapé da página avisa isso; tire o aviso quando trocar pelos dados reais.

## Como abrir

Qualquer servidor estático serve. Por exemplo, dentro desta pasta:

```bash
python3 -m http.server 4175
# abra http://localhost:4175
```

Abrir o `index.html` direto do disco também funciona: não há requisições além das fontes.

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Conteúdo e textos de cada capítulo, ficha técnica e formulário |
| `css/style.css` | Layout, cores e estados de animação (tokens no `:root`, no topo) |
| `js/car.js` | O carro: a carroceria, as rodas e as lâminas de luz, modelados em código |
| `js/app.js` | Cena 3D, câmera, passagem do dia, configurador, ficha e formulário |
| `js/vendor/three.min.js` | three.js r128 (licença MIT), a única dependência |

## O que editar

No começo de `js/app.js`:

- **`CONFIG`**: marca, modelo, preço base e o WhatsApp que recebe os pedidos de test drive (só dígitos, com DDI e DDD). Sem número, o formulário oferece só "Copiar pedido".
- **`PAINTS`** e **`WHEELS`**: cores e rodas do configurador, com o acréscimo de preço de cada uma.
- **`SCENES`**: a luz de cada hora do dia (cores do céu e do chão, sol, exposição).
- **`KEYS`**: o enquadramento da câmera em cada capítulo, com uma versão para tela larga e outra para tela em pé.

Os textos dos capítulos e a tabela da ficha ficam no `index.html`.

### Mudar o desenho do carro

Não há arquivo de malha. A carroceria nasce de quatro curvas no começo de `js/car.js`:
`yTop` (linha do teto), `ySh` (linha do ombro), `yBot` (assoalho) e `wSh` (largura).
Cada uma é uma lista de pontos `[posição ao longo do carro, valor]` em metros, com a frente em `-x`.
Mexer nesses pontos muda o modelo 3D e a vista lateral da ficha técnica ao mesmo tempo.

## Movimento

- **O dia passa com o scroll**: alvor, manhã, tarde, poente e noite. Mudam o céu, o sol, a luz sobre o carro e um relógio no canto.
- **Câmera conduzida pelo scroll**: três quartos de frente, perfil, traseira ao pôr do sol, frente à noite.
- **Abertura**: o sol sobe atrás do nome e a luz chega ao carro.
- **Assinatura de luz**: à noite, as lâminas acendem do centro para as pontas. O botão repete o gesto.
- **Configurador**: arraste para girar o carro; a pintura e as rodas mudam na hora e o preço acompanha.
- **Ficha técnica**: a vista lateral se desenha ao entrar na tela, com as cotas em milímetros.
- Com "reduzir movimento" ativado no sistema, a câmera corta de um enquadramento para o outro em vez de viajar.
- Sem WebGL, o palco mostra a silhueta do carro em SVG no lugar do modelo.
- Em aparelhos lentos a cena baixa a resolução sozinha.

## Publicar

Os caminhos são relativos, então a pasta funciona em qualquer endereço.
Para um domínio próprio, crie um projeto na Vercel apontando para esta pasta como diretório raiz.
