// função para criar um novo elemento e aplicar ele a uma classe
function novoElemento(tagName, className) {
    const elem = document.createElement(tagName)
    elem.className = className
    return elem
}

// função para criar barreira, verifica se ela é reversa ou não e em cima disso definir quem será adicionado primeiro: a borda ou o corpo
function Barreira(reversa = false) {
    this.elemento = novoElemento('div', 'barreira')

    const borda = novoElemento('div', 'borda')
    const corpo = novoElemento('div', 'corpo')
    this.elemento.appendChild(reversa ? corpo : borda)
    this.elemento.appendChild(reversa ? borda : corpo)

    this.setAltura = altura => corpo.style.height = `${altura}px`
}

// função construtora que define o par de barreiras e ela terá o próprio elemento ('div') 
function ParDeBarreiras(altura, abertura, x) {
    this.elemento = novoElemento('div', 'par-de-barreiras')

    this.superior = new Barreira(true)
    this.inferior = new Barreira(false)

    // as barreiras superior e inferior que serão adicionadas dentro da div par-de-barreiras
    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.inferior.elemento)

    // sortear aleatoriamente em qual local a abertura entre as barreias vai aparecer, pois ela nunca é fixa
    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }

    // saber em qual posição o par de barreiras está
    this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
    // para ir mudando a posição da barreira
    this.setX = x => this.elemento.style.left = `${x}px`
    //para saber a largura do elemento
    this.getLargura = () => this.elemento.clientWidth

    this.sortearAbertura()
    this.setX(x)
}

// função que recebe altura e largura do jogo, abertura no meio das barreiras, espaço lateral entre as barreiras e notificar ponto quando o par de barreiras passar pelo meio do jogo
function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    // momento inicial, posicionando as barreiras fora do jogo
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3)
    ]

    // quando começar a animação, de quantos em quantos px vai ocorrer o deslocamento (quanto maior, mais rápido)
    const deslocamento = 3
    //para fazer a animação (deslocamento)
    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)

            // quando o elemento sair da área do jogo eu faço ele voltar para o final novamente e sorteio de novo para não ficar na msm posição
            if (par.getX() < -par.getLargura()) {
                par.setX(par.getX() + espaco * this.pares.length)
                par.sortearAbertura()
            }

            // para notificar um ponto quando a barreira cruzar o meio
            const meio = largura / 2
            const cruzouOMeio = par.getX() + deslocamento >= meio
                && par.getX() < meio
            if(cruzouOMeio) notificarPonto()
        })
    }
}

// função para o pássaro saber até onde ele pode voar (altura)
function Passaro(alturaJogo) {
    let voando = false

    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'image/passaro.png'

    // para saber exatamente a posição (y) na qual o pássaro está voando
    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
    // setar a posição (y) para a animação ocorrer em cima dela
    this.setY = y => this.elemento.style.bottom = `${y}px`

    window.onkeydown = e => voando = true
    window.onkeyup = e => voando = false

    // manipular a altura para ter a sensação de que o pássaro está voando
    this.animar = () => {
        // voar: 8 e cair: -5
        const novoY = this.getY() + (voando ? 8 : -5)
        // para encostar no máximo até o "teto"
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        // se o novo y for menor do que 0, ele vai setar 0, ou seja, o pássaro vai poder chegar no máximo até o "chão"
        if (novoY <= 0) {
            this.setY(0)
        } else if (novoY >= alturaMaxima) {
            this.setY(alturaMaxima)
        } else {
            this.setY(novoY)
        }
    }

    // para definir a posição inicial do pássaro
    this.setY(alturaJogo / 2)
}

// função para exibir o progresso
function Progresso() {
    this.elemento = novoElemento('span', 'progresso')
    // para receber os pontos
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos
    }
    this.atualizarPontos(0)
}

// função para checar a colisão (sobreposição dos elementos)
function estaoSobrepostos(elementoA, elementoB) {
    // pega um retângulo associado ao elemento para ter as dimensões dele e fazer a checagem de colisão
    const a = elementoA.getBoundingClientRect()
    const b = elementoB.getBoundingClientRect()

    // se há sobreposição horizontal
    const horizontal = a.left + a.width >= b.left
        && b.left + b.width >= a.left
    const vertical = a.top + a.height >= b.top
        && b.top + b.height >= a.top
    return horizontal && vertical
}

// para testar a colisão de fato
function colidiu(passaro, barreiras) {
    let colidiu = false
    barreiras.pares.forEach(parDeBarreiras => {
        // para verificar se colidiu ou não com a parte de cima ou com a de baixo (só entra nesse if se não colidiu ainda !=neg)
        if (!colidiu) {
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento
            colidiu = estaoSobrepostos(passaro.elemento, superior)
                || estaoSobrepostos(passaro.elemento, inferior)
        }
    })
    return colidiu
}

// função que representa o jogo de fato 
function FlappyBird() {
    let pontos = 0

    // criando os elementos
    const areaDoJogo = document.querySelector('[wm-flappy]')
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const barreiras = new Barreiras(altura, largura, 200, 400,
        () => progresso.atualizarPontos(++pontos))
    const passaro = new Passaro(altura)   

    // para adicionar todos os elementos na tela
    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(passaro.elemento)
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

    // função para iniciar o jogo
    this.start = () => {
        // loop do jogo
        const temporizador = setInterval(() => {
            barreiras.animar()
            passaro.animar()

            if (colidiu(passaro, barreiras)) {
                clearInterval(temporizador)
            }
        }, 20)
    }
}

new FlappyBird().start()