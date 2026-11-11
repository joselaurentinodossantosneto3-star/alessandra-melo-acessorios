# Alvor Motors

Site de uma loja de carros de luxo especializada em Porsche: um 911 em destaque em 3D, showroom interativo e catálogo.
Site estático: HTML, CSS e JavaScript, sem build.

> **Loja e estoque fictícios.** "Alvor Motors" é um nome inventado; preços e quilometragens são exemplos.
> A loja é apresentada como independente, sem vínculo com a Porsche, e o rodapé diz isso.
> Potência, 0 a 100 e velocidade máxima são os dados de catálogo de cada versão, mas confira antes de publicar.

## Sobre os carros em 3D

Não há arquivo de modelo 3D. Os carros são **desenhados em código**, com as proporções e os traços de cada tipo:
faróis ovais com quatro pontos de luz, para-lamas mais altos que o capô, teto que desce até a traseira, barra de luz contínua atrás.
São ilustrações estilizadas, não reproduções exatas, e não usam o emblema da marca.

Para ter carros idênticos aos reais, o caminho é trocar por fotos ou por um modelo 3D licenciado (arquivo `.glb`).

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
| `index.html` | Textos do destaque, da procedência, do pedido de visita e do rodapé |
| `css/style.css` | Layout, cores e estados de animação (tokens no `:root`, no topo) |
| `js/app.js` | Catálogo, cena 3D, câmera, passagem do dia, showroom, filtros e formulário |
| `js/car.js` | As três carrocerias (911, SUV cupê e quatro portas), rodas e luzes, modeladas em código |
| `js/vendor/three.min.js` | three.js r128 (licença MIT), a única dependência |

## O que editar

No começo de `js/app.js`:

- **`CONFIG`**: nome da loja, o WhatsApp que recebe os pedidos (só dígitos, com DDI e DDD) e qual carro é o destaque. Sem número, o formulário oferece só "Copiar pedido".
- **`CATALOG`**: o estoque. Cada carro tem nome, ano, km, cor, potência, 0 a 100, máxima, preço, a carroceria 3D (`preset`) e as `tags` dos filtros. Incluir ou tirar uma linha atualiza a tira do showroom, a grade, os filtros e o formulário.
- **`FILTERS`**: os filtros do catálogo.
- **`SCENES`** e **`KEYS`**: a luz de cada hora do dia e o enquadramento da câmera em cada capítulo.

Se trocar o carro em destaque, ajuste também os textos dos capítulos no `index.html`, que falam dele.

### Mudar o desenho de uma carroceria

Cada carroceria em `js/car.js` nasce de curvas: `yTop` (linha do teto), `ySh` (ombro), `yBot` (assoalho), `wSh` (largura) e `fender` (crista do para-lama).
Cada uma é uma lista de pontos `[posição ao longo do carro, valor]` em metros, com a frente em `-x`.
Mexer nesses pontos muda o modelo 3D e a silhueta do catálogo ao mesmo tempo.

## Movimento

- **O dia passa com o scroll**: alvor, manhã, tarde, poente e noite. Mudam o céu, o sol, a luz sobre o carro e um relógio no canto.
- **Câmera conduzida pelo scroll**: três quartos de frente, perfil, traseira ao pôr do sol, frente à noite.
- **Faróis**: à noite, os quatro pontos de luz acendem um a um e a barra traseira acende do centro para fora. O botão repete.
- **Showroom**: arraste para girar. Ao escolher outro carro, o atual sai andando e o próximo chega e freia.
- **Catálogo**: as silhuetas entram rolando; ao passar o mouse, o carro anda um pouco e as rodas giram. Todas estão na mesma escala.
- Com "reduzir movimento" ativado no sistema, a câmera corta de um enquadramento para o outro e os carros trocam sem animação.
- Sem WebGL, o palco mostra a silhueta do carro no lugar do modelo.
- Em aparelhos lentos a cena baixa a resolução sozinha.

## Publicar

Os caminhos são relativos, então a pasta funciona em qualquer endereço.
Para um domínio próprio, crie um projeto na Vercel apontando para esta pasta como diretório raiz.
