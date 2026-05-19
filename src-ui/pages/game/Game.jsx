import React, { useState, useEffect, useRef } from 'react';
import styles from './GameStyle.module.css';

// Importação dos componentes locais já desenvolvidos
import { SessionButton } from './components/sessionButton/SessionButton';
import { ImageCard } from './components/imageCard/ImageCard';
import { NarrativeBlock } from './components/narrativeBlock/NarrativeBlock';
import { UserMessage } from './components/userMessage/UserMessage';
import { InputBar } from './components/inputBar/InputBar';

// Ícones baseados na estrutura do repositório
import saveIcon from '/src-ui/assets/icons/save.svg';
import arrowIcon from '/src-ui/assets/icons/arrow_to_left.svg';

// 1. Criação de um Mock de Histórico para teste
const MOCK_HISTORY = [
    { 
        id: 1, 
        type: 'image', 
        imageUrl: '/src-ui/assets/templates/campaignImage.png' 
    },
    { 
        id: 2, 
        type: 'narrative',
        text: 'O ar na cobertura do Setor 7 é pesado, saturado com o cheiro metálico de ozônio e chuva ácida. Abaixo de você, a cidade de Obsidiana pulsa como um coração mecânico doente. As luzes de neon cortam a névoa, mas não conseguem iluminar as sombras que se movem entre os dutos de ventilação. "Você não deveria ter vindo aqui, Cronista. Algumas histórias foram feitas para permanecerem enterradas sob o concreto e o silêncio." Uma figura encapuzada emerge da fumaça, a luz de um holograma publicitário refletindo em uma máscara cibernética reluzente. O som de uma lâmina sendo desembainhada ecoa contra o metal do piso.',
        metadata: 'Rodada gerada em 2 minutos e 36 segundos'
    },
    { 
        id: 3, 
        type: 'user', 
        text: 'Eu me aproximo da borda, mantendo a mão no cabo da minha pistola térmica. "Eu não vim por histórias, vim pela verdade que você está tentando esconder no núcleo de dados."' 
    },
    { 
        id: 4, 
        type: 'image', 
        imageUrl: '/src-ui/assets/templates/campaignImage.png' 
    },
    { 
        id: 5, 
        type: 'narrative',
        text: 'O ar na cobertura do Setor 7 é pesado, saturado com o cheiro metálico de ozônio e chuva ácida. Abaixo de você, a cidade de Obsidiana pulsa como um coração mecânico doente. As luzes de neon cortam a névoa, mas não conseguem iluminar as sombras que se movem entre os dutos de ventilação. "Você não deveria ter vindo aqui, Cronista. Algumas histórias foram feitas para permanecerem enterradas sob o concreto e o silêncio." Uma figura encapuzada emerge da fumaça, a luz de um holograma publicitário refletindo em uma máscara cibernética reluzente. O som de uma lâmina sendo desembainhada ecoa contra o metal do piso.',
        metadata: 'Rodada gerada em 2 minutos'
    },
    { 
        id: 6, 
        type: 'user', 
        text: 'Saco a minha arma rapidamente e aponto na direção da figura cibernética.' 
    }
];

export function Game({ campaignId, campaignTitle, roundNumber }) { // remover MOCKS após integração

    const [round, setRound] = useState(roundNumber)
    // 2. Estado para guardar a lista de interações
    const [history, setHistory] = useState(MOCK_HISTORY);
    
    // 3. Referência para o final da lista (usado para o scroll automático)
    const messagesEndRef = useRef(null);

    // 4. Função que faz o scroll descer suavemente até o final
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 5. Aciona o scroll sempre que o 'history' for atualizado
    useEffect(() => {
        scrollToBottom();
    }, [history]);

    // 6. Função para renderizar o componente correto baseado no 'type'
    const renderHistoryItem = (item) => {
        switch (item.type) {
            case 'image':
                return <ImageCard key={item.id} imageUrl={item.imageUrl} />;
            case 'narrative':
                return <NarrativeBlock key={item.id} text={item.text} metadata={item.metadata}/>;
            case 'user':
                return (
                    <div key={item.id} className={styles.userMessageWrapper}>
                        <UserMessage 
                            label="VOCÊ DIZ" 
                            text={item.text} 
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* Cabeçalho da Sessão */}
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.campaignTitle}>{campaignTitle}</h1>
                    <span className={styles.roundText}>{round}° RODADA</span>
                </div>
                <div className={styles.actionButtons}>
                    <SessionButton 
                        title="ENCERRAR SESSÃO" 
                        icon={arrowIcon} 
                        onClick={() => console.log('Encerrando sessão via IPC/Tauri...')} 
                    />
                    <SessionButton 
                        title="SALVAR" 
                        icon={saveIcon} 
                        onClick={() => console.log('Acionando /save no Maestro Rust...')} 
                    />
                </div>
            </header>

            {/* Conteúdo Principal (Scrollável) */}
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    
                    {/* Renderiza dinamicamente o array de Mock mapeado */}
                    {history.map(renderHistoryItem)}
                    
                    {/* Elemento âncora invisível onde o ScrollIntoView vai focar */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Espaçador para garantir que a InputBar fixa não cubra a última mensagem */}
                <div className={styles.scrollSpacer} aria-hidden="true" />
            </main>

            {/* Rodapé fixo com o InputBar */}
            <footer className={styles.footerContainer}>
                {/* Opcional: você pode passar uma função onSubmit para a InputBar no futuro 
                  para atualizar o estado de 'history' e testar a adição de novos blocos 
                */}
                <InputBar />
            </footer>
        </div>
    );
}