import React from 'react';
import styles from './GameStyle.module.css';

// Importação dos componentes locais já desenvolvidos
import { SessionButton } from './components/sessionButton/SessionButton';
import { ImageCard } from './components/imageCard/ImageCard';
import { NarrativeBlock } from './components/narrativeBlock/NarrativeBlock';
import { UserMessage } from './components/userMessage/UserMessage';
import { InputBar } from './components/inputBar/InputBar';

// Ícones baseados na estrutura do repositório
import cloudIcon from '/src-ui/assets/icons/cloud.svg';
import rollbackIcon from '/src-ui/assets/icons/rollback.svg';

export function Game() {
    return (
        <div className={styles.pageContainer}>
            {/* Cabeçalho da Sessão */}
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.campaignTitle}>As Crônicas de Obsidiana</h1>
                    <span className={styles.roundText}>42° RODADA</span>
                </div>
                <div className={styles.actionButtons}>
                    <SessionButton 
                        title="ENCERRAR SESSÃO" 
                        icon={rollbackIcon} 
                        onClick={() => console.log('Encerrando sessão via IPC/Tauri...')} 
                    />
                    <SessionButton 
                        title="SALVAR" 
                        icon={cloudIcon} 
                        onClick={() => console.log('Acionando /save no Maestro Rust...')} 
                    />
                </div>
            </header>

            {/* Conteúdo Principal (Scrollável) */}
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <ImageCard imageUrl="https://placehold.co/740x416" />
                    
                    <NarrativeBlock />
                    
                    <div className={styles.userMessageWrapper}>
                        <UserMessage 
                            label="VOCÊ DIZ" 
                            text="Eu me aproximo da borda, mantendo a mão no cabo da minha pistola térmica. &quot;Eu não vim por histórias, vim pela verdade que você está tentando esconder no núcleo de dados.&quot;" 
                        />
                    </div>
                </div>

                {/* Espaçador para garantir que a InputBar fixa não cubra a última mensagem */}
                <div className={styles.scrollSpacer} aria-hidden="true" />
            </main>

            {/* Rodapé fixo com o InputBar (O componente original já inclui a marca 'FELPINHO's RPG Engine') */}
            <footer className={styles.footerContainer}>
                <InputBar />
            </footer>
        </div>
    );
}