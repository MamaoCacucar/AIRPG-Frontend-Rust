import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GameStyle.module.css';

import { SessionButton } from './components/sessionButton/SessionButton';
import { ImageCard } from './components/imageCard/ImageCard';
import { NarrativeBlock } from './components/narrativeBlock/NarrativeBlock';
import { UserMessage } from './components/userMessage/UserMessage';
import { InputBar } from './components/inputBar/InputBar';

import saveIcon from '/src-ui/assets/icons/save.svg';
import arrowIcon from '/src-ui/assets/icons/arrow_to_left.svg';

// Hook de dados
import { useGameSession } from './hooks/useGameSession';

export function Game() {
    const { id } = useParams(); // Captura o campaignId da URL
    const navigate = useNavigate();
    
    // Busca dados reais do backend substituindo os mocks
    const { session, isLoading } = useGameSession(id);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (session?.history) {
            scrollToBottom();
        }
    }, [session?.history]);

    const renderHistoryItem = (item) => {
        switch (item.type) {
            case 'image':
                return <ImageCard key={item.id} imageUrl={item.imageUrl} />;
            case 'narrative':
                return <NarrativeBlock key={item.id} text={item.text} metadata={item.metadata}/>;
            case 'user':
                return (
                    <div key={item.id} className={styles.userMessageWrapper}>
                        <UserMessage label="VOCÊ DIZ" text={item.text} />
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoading || !session) {
        return <div className={styles.pageContainer}><p>Sincronizando Sidecar Python...</p></div>;
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.campaignTitle}>{session.campaignTitle}</h1>
                    <span className={styles.roundText}>{session.roundNumber}° RODADA</span>
                </div>
                <div className={styles.actionButtons}>
                    <SessionButton 
                        title="ENCERRAR SESSÃO" 
                        icon={arrowIcon} 
                        // Redireciona para /campaigns conforme solicitado
                        onClick={() => navigate('/campaigns')} 
                    />
                    <SessionButton 
                        title="SALVAR" 
                        icon={saveIcon} 
                        // Chamada via Tauri IPC mantida para orquestração de I/O em disco
                        onClick={() => window.__TAURI_INTERNALS__.invoke('handle_command', { input: "/save" })} 
                    />
                </div>
            </header>

            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    {session.history.map(renderHistoryItem)}
                    <div ref={messagesEndRef} />
                </div>
                <div className={styles.scrollSpacer} aria-hidden="true" />
            </main>

            <footer className={styles.footerContainer}>
                <InputBar />
            </footer>
        </div>
    );
}