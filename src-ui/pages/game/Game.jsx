import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import styles from './GameStyle.module.css';

import { SessionButton } from './components/sessionButton/SessionButton';
import { NarrativeBlock } from './components/narrativeBlock/NarrativeBlock';
import { ImageCard } from './components/imageCard/ImageCard';
import { UserMessage } from './components/userMessage/UserMessage';
import { InputBar } from './components/inputBar/InputBar';

import arrowIcon from '/src-ui/assets/icons/arrow_to_left.svg';

// Hook de dados
import { useGameSession } from './hooks/useGameSession';

export function Game() {
    const { id } = useParams(); // Captura o campaignId da URL
    const navigate = useNavigate();
    const [endError, setEndError] = useState(null);
    
    // Busca dados reais do backend substituindo os mocks
    const {
        session,
        isLoading,
        error,
        interactionError,
        isWaitingForResponse,
        sendPlayerInput,
    } = useGameSession(id);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (session?.history) {
            scrollToBottom();
        }
    }, [session?.history]);

    const endSession = async () => {
        try {
            await invoke('stop_game_session');
            navigate('/campaigns');
        } catch (stopError) {
            console.error('Erro ao encerrar a sessão:', stopError);
            setEndError(String(stopError));
        }
    };

    if (isLoading) {
        return <div className={styles.pageContainer}><p>Carregando sessão...</p></div>;
    }

    if (error) {
        return <div className={styles.pageContainer}><p role="alert">Não foi possível carregar a sessão: {error}</p></div>;
    }

    if (!session) {
        return <div className={styles.pageContainer}><p role="alert">Sessão indisponível.</p></div>;
    }

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h1 className={styles.campaignTitle}>{session.campaignTitle}</h1>
                    <span className={styles.roundText}>{session.roundNumber}° RODADA</span>
                    {session.campaignTags?.length > 0 && (
                        <span className={styles.campaignTags}>{session.campaignTags.join(' • ')}</span>
                    )}
                </div>
                <div className={styles.actionButtons}>
                    <SessionButton 
                        title="ENCERRAR SESSÃO" 
                        icon={arrowIcon} 
                        onClick={endSession}
                    />
                </div>
            </header>

            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    {(interactionError || endError) && (
                        <p role="alert">
                            {endError
                                ? `Não foi possível encerrar a sessão: ${endError}`
                                : interactionError}
                        </p>
                    )}
                    {session.history.map((item) => {
                        switch (item.type) {
                            case 'image':
                                return <ImageCard key={item.id} imageUrl={item.imageUrl} />;
                            case 'narrative':
                                return (
                                    <NarrativeBlock
                                        key={item.id}
                                        text={item.text}
                                        metadata={item.metadata}
                                    />
                                );
                            case 'user':
                                return (
                                    <div key={item.id} className={styles.userMessageWrapper}>
                                        <UserMessage text={item.text} />
                                    </div>
                                );
                            case 'system':
                                return <p key={item.id} role="alert">{item.text}</p>;
                            default:
                                return null;
                        }
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className={styles.scrollSpacer} aria-hidden="true" />
            </main>
            <footer className={styles.footerContainer}>
                <InputBar
                    onSubmit={sendPlayerInput}
                    disabled={isWaitingForResponse}
                />
            </footer>
        </div>
    );
}