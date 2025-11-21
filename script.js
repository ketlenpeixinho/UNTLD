let containerPrincipal = document.getElementById("conteudo-principal");
let cardsWrapper = document.getElementById("cards-wrapper");
let dados = [];

let readingList = [];
// Variáveis de estado para a paginação
let dadosFiltradosAtuais = [];
let paginaAtual = 1;
const itensPorPagina = 6; // Defina quantos livros por página

// 1. Carrega os dados e configura os filtros e a busca.
window.onload = async function() {
    let resposta = await fetch("data.json");
    dados = await resposta.json();    

    // Carrega a lista de leitura do localStorage
    const storedList = JSON.parse(localStorage.getItem('readingList')) || [];
    // Migra a lista antiga (array de strings) para a nova (array de objetos) se necessário
    if (storedList.length > 0 && typeof storedList[0] === 'string') {
        readingList = storedList.map(bookName => ({
            nome: bookName,
            lido: false
        }));
        localStorage.setItem('readingList', JSON.stringify(readingList)); // Salva a lista convertida
    } else {
        readingList = storedList;
    }

    updateReadingListCounter(); // Atualiza o contador ao carregar a página

    // Verifica se há um filtro salvo e o aplica. Caso contrário, exibe a tela inicial.
    const savedGenre = localStorage.getItem('lastGenreFilter');
    if (savedGenre) {
        // Se o filtro salvo for "Todos", exibe todos os livros.
        if (savedGenre === "Todos") {
            transicaoDeRenderizacao(dados, "Todos os Livros");
        } else {
            // Filtra os livros pelo gênero salvo e os exibe.
            const livrosFiltrados = dados.filter(livro => livro.gênero === savedGenre);
            transicaoDeRenderizacao(livrosFiltrados, savedGenre);
        }
        // Cria os botões de filtro e define o estado 'ativo' para o botão correspondente.
        criarBotoesDeFiltro(savedGenre);
    } else {
        // Se nenhum filtro estiver salvo, exibe a tela de boas-vindas.
        exibirTelaInicial();
    }

    // Configura o botão de voltar para a tela inicial (o título)
    const homeButton = document.getElementById("home-button");
    homeButton.addEventListener("click", () => {
        containerPrincipal.classList.add('fade-out'); // Inicia a transição de fade-out
        document.getElementById("barraDeBusca").value = ""; // Limpa a barra de busca
        setTimeout(() => {
            localStorage.removeItem('lastGenreFilter'); // Limpa o filtro salvo
            exibirTelaInicial(); // Mostra a tela inicial após a transição
            containerPrincipal.classList.remove('fade-out'); // Remove a classe para fazer o fade-in
        }, 400); // O tempo deve ser o mesmo da transição no CSS
    });

    // 2. Configura a busca em tempo real.
    let barraDeBusca = document.getElementById("barraDeBusca");
    barraDeBusca.addEventListener("input", () => {
        let textoBusca = barraDeBusca.value.toLowerCase();
        if (textoBusca.length > 0) {
            let dadosFiltrados = dados.filter((livro) => {
                // Verifica se o texto de busca corresponde ao nome, autor ou a alguma das tags.
                const buscaNoNomeOuAutor = livro.nome.toLowerCase().includes(textoBusca) ||
                                         livro.autor.toLowerCase().includes(textoBusca);
                
                const buscaNasTags = livro.tags.some(tag => tag.toLowerCase().includes(textoBusca));
                return buscaNoNomeOuAutor || buscaNasTags;
            });
            transicaoDeRenderizacao(dadosFiltrados, `Resultados para "${textoBusca}"`);
        } else {
            exibirTelaInicial(); // Volta para a tela inicial se a busca for limpa
        }
    });


    // 3. Configura o botão "Voltar ao Topo".
    const botaoVoltarTopo = document.getElementById("botao-voltar-topo");

    // Mostra ou esconde o botão com base na posição de rolagem
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) { // Aparece depois de rolar 300px
            botaoVoltarTopo.classList.add("show");
        } else {
            botaoVoltarTopo.classList.remove("show");
        }
    });

    // Ação de clique para rolar para o topo
    botaoVoltarTopo.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 4. Configura os botões de alternância de visualização.
    const listViewBtn = document.getElementById("list-view-btn");
    const gridViewBtn = document.getElementById("grid-view-btn");

    listViewBtn.addEventListener("click", () => {
        cardsWrapper.classList.remove("grid-view");
        listViewBtn.classList.add("ativo");
        gridViewBtn.classList.remove("ativo");
        localStorage.setItem("viewMode", "list"); // Salva a preferência
    });

    gridViewBtn.addEventListener("click", () => {
        cardsWrapper.classList.add("grid-view");
        gridViewBtn.classList.add("ativo");
        listViewBtn.classList.remove("ativo");
        localStorage.setItem("viewMode", "grid"); // Salva a preferência
    });

    // Aplica a visualização salva ao carregar a página
    const savedView = localStorage.getItem("viewMode");
    if (savedView === "grid") {
        gridViewBtn.click();
    } else {
        listViewBtn.click(); // Padrão é lista
    }

    // 5. Configura o botão para ver a lista de leitura.
    const viewReadingListBtn = document.getElementById("view-reading-list-btn");
    viewReadingListBtn.addEventListener("click", () => {
        // Filtra os dados principais para encontrar os livros na lista de leitura
        const readingListData = dados.filter(livro => readingList.some(item => item.nome === livro.nome));
        if (readingListData.length > 0) {
            transicaoDeRenderizacao(readingListData, "Sua Lista de Leitura");
        } else {
            // Se a lista estiver vazia, mostra uma mensagem especial
            transicaoDeRenderizacao([], "Sua Lista de Leitura");
        }
    });
};

function exibirTelaInicial() {
    // Limpa apenas o wrapper dos cards e exibe a mensagem de boas-vindas dentro dele
    cardsWrapper.innerHTML = `
        <div class="welcome-container">
            <h1 class="welcome-title">UNTLD</h1>
            <h2>Seja bem-vindo à sua melhor biblioteca digital</h2>
            <p>Use a barra de busca acima ou os filtros de gênero abaixo para encontrar seu próximo livro.</p>
            <div id="filtros-genero-container" class="filtros-container"></div>
        </div>
    `;
    // Garante que o container principal não tenha a classe de fade-out
    containerPrincipal.classList.remove('fade-out');
    // Esconde o cabeçalho da seção (título e botões de visualização) na tela inicial
    document.querySelector('.secao-header').style.visibility = 'hidden';
    // Esconde a paginação na tela inicial
    document.getElementById('pagination-container').style.visibility = 'hidden';
    criarBotoesDeFiltro(); // Garante que os filtros de gênero apareçam na tela inicial
}

function criarBotoesDeFiltro(generoAtivo = null) {
    const containerFiltros = document.getElementById("filtros-genero-container");
    if (!containerFiltros) return; // Adiciona uma verificação para segurança
    containerFiltros.innerHTML = ''; // Limpa botões existentes para evitar duplicação

    // Pega todos os gêneros únicos do arquivo de dados e os ordena
    const generos = [...new Set(dados.map(livro => livro.gênero))].sort();

    // Adiciona o botão "Todos" no início
    const todosBotao = document.createElement("button");
    todosBotao.classList.add("botao-filtro");
    todosBotao.innerText = "Todos";
    todosBotao.addEventListener("click", () => {
        transicaoDeRenderizacao(dados, "Todos os Livros");
        localStorage.setItem('lastGenreFilter', 'Todos'); // Salva a preferência
        document.querySelectorAll('.botao-filtro').forEach(b => b.classList.remove('ativo'));
        todosBotao.classList.add('ativo');
    });
    containerFiltros.appendChild(todosBotao);

    // Cria um botão para cada gênero
    for (const genero of generos) {
        const botao = document.createElement("button");
        botao.classList.add("botao-filtro");        
        botao.innerText = genero;
        botao.addEventListener("click", () => {
            const livrosFiltrados = dados.filter(livro => livro.gênero === genero);
            transicaoDeRenderizacao(livrosFiltrados, genero);
            localStorage.setItem('lastGenreFilter', genero); // Salva a preferência
            // Gerencia o estado ativo dos botões
            document.querySelectorAll('.botao-filtro').forEach(b => b.classList.remove('ativo'));
            botao.classList.add('ativo');
        });
        containerFiltros.appendChild(botao);
    }

    // Define o botão ativo com base no filtro salvo ou na tela inicial
    const botaoParaAtivar = Array.from(containerFiltros.children).find(b => b.innerText === (generoAtivo || 'Todos'));
    if (botaoParaAtivar && generoAtivo) {
        botaoParaAtivar.classList.add('ativo');
    } else if (!generoAtivo) {
        todosBotao.classList.add('ativo'); // Padrão para a tela inicial
    }
}

function transicaoDeRenderizacao(listaDeLivros, tituloSecao) {
    // Remove o container de filtros de gênero da tela de boas-vindas, se existir.
    const welcomeFilterContainer = document.querySelector('.welcome-container #filtros-genero-container');
    if (welcomeFilterContainer) {
        welcomeFilterContainer.parentElement.remove(); // Remove o welcome-container inteiro
    }

    dadosFiltradosAtuais = listaDeLivros;
    paginaAtual = 1;

    // Aplica o fade-out no wrapper dos cards, não no container inteiro
    cardsWrapper.classList.add('fade-out');

    setTimeout(() => {
        renderizarPagina(tituloSecao);
        cardsWrapper.classList.remove('fade-out');
    }, 200); // Tempo um pouco menor para a transição de saída
}

function renderizarPagina(tituloSecao) {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const livrosDaPagina = dadosFiltradosAtuais.slice(inicio, fim);

    renderizarCards(livrosDaPagina, tituloSecao);
    renderizarPaginacao();
}

function renderizarCards(listaDeLivros, tituloSecao = "") {
    const tituloElemento = document.getElementById("titulo-secao-principal");
    const secaoHeader = document.querySelector('.secao-header');
    cardsWrapper.innerHTML = ""; // Limpa os cards existentes

    // Atualiza o título e a visibilidade do cabeçalho
    if (tituloSecao) {
        tituloElemento.innerText = tituloSecao;
        secaoHeader.style.visibility = 'visible';
    } else {
        secaoHeader.style.visibility = 'hidden';
    }

    // Se a lista de livros estiver vazia, exibe uma mensagem.
    if (listaDeLivros.length === 0 && tituloSecao) {
        cardsWrapper.innerHTML = `
            <div class="no-results-container" style="animation-delay: 0s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente ajustar sua busca ou filtro para encontrar o que procura.</p>
            </div>
        `;
        return; // Interrompe a função para não renderizar cards vazios
    }

    listaDeLivros.forEach((dado, index) => { 
        let article = document.createElement("article");
        article.classList.add("card");
        article.style.opacity = 0; // Começa invisível para a animação funcionar corretamente
        article.style.animation = `card-fade-in 0.6s ease-out ${index * 0.08}s forwards`;

        // Verifica se o livro está na lista de leitura para estilizar o botão
        const readingListItem = readingList.find(item => item.nome === dado.nome);
        const isInList = !!readingListItem;

        article.innerHTML = `
            <img src="${dado.imagem}" alt="Capa do livro ${dado.nome}" class="card-imagem">
            <div class="card-conteudo">
                <h2>${dado.nome}</h2>
                <p>
                    <strong>Ano:</strong> ${dado.ano} | 
                    <strong>Autor(a):</strong> ${dado.autor}
                </p>
                <p class="card-descricao">${dado.descrição}</p>
                <div class="tags-container">
                    ${dado.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="card-actions">                    
                    <a href="${dado.link}" target="_blank">Ver mais detalhes</a>
                    ${isInList ? `
                        <button class="mark-as-read-btn ${readingListItem.lido ? 'is-read' : ''}" data-book-name="${dado.nome}">
                            ${readingListItem.lido ? '✓ Lido' : 'Marcar como lido'}
                        </button>
                    ` : ''}
                    <button class="add-to-list-btn ${isInList ? 'in-list' : ''}" data-book-name="${dado.nome}">
                        ${isInList ? '✓ Na lista' : '+ Adicionar à lista'}
                    </button>
                </div>
            </div>
        `
        cardsWrapper.appendChild(article);
    });

    // Adiciona a classe 'is-read' e o checkbox para os livros lidos
    document.querySelectorAll('.card').forEach(card => {
        const bookName = card.querySelector('.add-to-list-btn')?.dataset.bookName;
        const readingListItem = readingList.find(item => item.nome === bookName);
        if (readingListItem?.lido) {
            card.classList.add('is-read');
        }
    });

    // Adiciona os event listeners para os novos botões de adicionar à lista
    document.querySelectorAll('.add-to-list-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const bookName = e.target.dataset.bookName;
            toggleReadingList(bookName, e.target);
        });
    });

    // Adiciona os event listeners para os botões de "marcar como lido"
    document.querySelectorAll('.mark-as-read-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const bookName = e.target.dataset.bookName;
            toggleReadStatus(bookName, e.target);
        });
    });
}

function toggleReadingList(bookName, buttonElement) {
    const bookIndex = readingList.findIndex(item => item.nome === bookName);
    if (bookIndex > -1) {
        // Remove da lista
        readingList.splice(bookIndex, 1);
        buttonElement.classList.remove('in-list');
        buttonElement.innerText = '+ Adicionar à lista';
        // Recarrega os cards para remover o botão "marcar como lido"
        renderizarPagina(document.getElementById("titulo-secao-principal").innerText);
    } else {
        // Adiciona à lista
        readingList.push({ nome: bookName, lido: false });
        buttonElement.classList.add('in-list');
        buttonElement.innerText = '✓ Na lista';
        // Recarrega os cards para adicionar o botão "marcar como lido"
        renderizarPagina(document.getElementById("titulo-secao-principal").innerText);
    }
    // Salva a lista atualizada no localStorage
    localStorage.setItem('readingList', JSON.stringify(readingList));
    updateReadingListCounter(); // Atualiza o contador
}

function toggleReadStatus(bookName, buttonElement) {
    const book = readingList.find(item => item.nome === bookName);
    if (book) {
        book.lido = !book.lido; // Inverte o status
        localStorage.setItem('readingList', JSON.stringify(readingList));

        // Atualiza a UI do botão e do card
        buttonElement.classList.toggle('is-read', book.lido);
        buttonElement.innerText = book.lido ? '✓ Lido' : 'Marcar como lido';
        const cardElement = buttonElement.closest('.card');
        cardElement.classList.toggle('is-read', book.lido);
    }
}

function updateReadingListCounter() {
    const counterElement = document.getElementById('reading-list-counter');
    if (!counterElement) return; // Se o elemento não existir, não faz nada.

    const count = readingList.length;

    if (count > 0) {
        counterElement.innerText = count;
        counterElement.classList.add('visible');
    } else {
        counterElement.innerText = '';
        counterElement.classList.remove('visible');
    }
}

function renderizarPaginacao() {
    const containerPaginacao = document.getElementById('pagination-container');
    containerPaginacao.innerHTML = '';
    const totalPaginas = Math.ceil(dadosFiltradosAtuais.length / itensPorPagina);

    if (totalPaginas <= 1) {
        containerPaginacao.style.visibility = 'hidden';
        return;
    }
    containerPaginacao.style.visibility = 'visible';

    // Botão "Anterior"
    const botaoAnterior = document.createElement('button');
    botaoAnterior.innerText = 'Anterior';
    botaoAnterior.classList.add('page-btn');
    botaoAnterior.disabled = paginaAtual === 1;
    botaoAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarPagina(document.getElementById("titulo-secao-principal").innerText);
            window.scrollTo({ top: containerPrincipal.offsetTop - 100, behavior: 'smooth' });
        }
    });
    containerPaginacao.appendChild(botaoAnterior);

    // Função auxiliar para criar botões de página
    const criarBotaoPagina = (pagina) => {
        const botao = document.createElement('button');
        botao.innerText = pagina;
        botao.classList.add('page-btn');
        if (pagina === paginaAtual) {
            botao.classList.add('ativo');
        }
        botao.addEventListener('click', () => {
            paginaAtual = pagina;
            renderizarPagina(document.getElementById("titulo-secao-principal").innerText);
            window.scrollTo({ top: containerPrincipal.offsetTop - 100, behavior: 'smooth' });
        });
        containerPaginacao.appendChild(botao);
    };

    // Função auxiliar para criar elipses
    const criarElipses = () => {
        const span = document.createElement('span');
        span.innerText = '...';
        span.classList.add('pagination-ellipsis');
        containerPaginacao.appendChild(span);
    };

    // Lógica para exibir botões de página com elipses
    if (totalPaginas <= 7) { // Se houver 7 páginas ou menos, mostra todos os números
        for (let i = 1; i <= totalPaginas; i++) {
            criarBotaoPagina(i);
        }
    } else {
        // Mostra sempre a primeira página
        criarBotaoPagina(1);

        // Mostra elipses se a página atual estiver longe do início
        if (paginaAtual > 4) {
            criarElipses();
        }

        // Define o intervalo de páginas a serem exibidas ao redor da página atual
        let inicio = Math.max(2, paginaAtual - 2);
        let fim = Math.min(totalPaginas - 1, paginaAtual + 2);

        if (paginaAtual <= 4) {
            fim = 5;
        }
        if (paginaAtual >= totalPaginas - 3) {
            inicio = totalPaginas - 4;
        }

        for (let i = inicio; i <= fim; i++) {
            criarBotaoPagina(i);
        }

        // Mostra elipses se a página atual estiver longe do final
        if (paginaAtual < totalPaginas - 3) {
            criarElipses();
        }

        // Mostra sempre a última página
        criarBotaoPagina(totalPaginas);
    }

    // Botão "Próximo"
    const botaoProximo = document.createElement('button');
    botaoProximo.innerText = 'Próximo';
    botaoProximo.classList.add('page-btn');
    botaoProximo.disabled = paginaAtual === totalPaginas;
    botaoProximo.addEventListener('click', () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarPagina(document.getElementById("titulo-secao-principal").innerText);
            window.scrollTo({ top: containerPrincipal.offsetTop - 100, behavior: 'smooth' });
        }
    });
    containerPaginacao.appendChild(botaoProximo);
}