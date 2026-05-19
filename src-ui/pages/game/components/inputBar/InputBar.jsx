import React, { useState } from 'react';
import styles from './InputBarStyle.module.css';
import messageIcon from '/src-ui/assets/icons/message.svg'
import swordsIcon from '/src-ui/assets/icons/swords.svg'
import questionIcon from '/src-ui/assets/icons/question.svg'
import diceIcon from '/src-ui/assets/icons/dice.svg'
import rollBackIcon from '/src-ui/assets/icons/rollback.svg'
import likeIcon from '/src-ui/assets/icons/like.svg'
import loopIcon from '/src-ui/assets/icons/loop.svg'
import sendIcon from '/src-ui/assets/icons/send.svg'

export function InputBar() {
    const [inputValue, setInputValue] = useState('');
    const [activeTool, setActiveTool] = useState('fala');

    const handleSend = () => {
        if (!inputValue.trim()) return;
        console.log(`Enviando [${activeTool}]:`, inputValue);
        setInputValue(''); // Limpa após envio
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                
                <div className={styles.inputCard}>
                    {/* Área de Texto e Botão Enviar */}
                    <div className={styles.inputArea}>
                        <textarea 
                            className={styles.textInput}
                            placeholder="Descreva sua próxima ação ou fala..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button className={styles.sendButton} onClick={handleSend} aria-label="Enviar">
                            <img className={styles.sendIcon} src={sendIcon} alt='Enviar' />
                        </button>
                    </div>

                    {/* Toolbar de Tipos de Mensagem */}
                    <div className={styles.toolbarArea}>
                        <button 
                            className={`${styles.toolButton} ${activeTool === 'fala' ? styles.active : ''}`}
                            onClick={() => setActiveTool('fala')}
                        >
                            <img src={messageIcon} alt="fala" className={styles.toolIcon} />
                            <span className={styles.toolLabel}>FALA</span>
                        </button>
                        
                        <div className={styles.divider} />
                        
                        <button 
                            className={`${styles.toolButton} ${activeTool === 'acao' ? styles.active : ''}`}
                            onClick={() => setActiveTool('acao')}
                        >
                            <img src={swordsIcon} alt="ação" className={styles.toolIcon} />
                            <span className={styles.toolLabel}>AÇÃO</span>
                        </button>
                        
                        <div className={styles.divider} />
                        
                        <button 
                            className={`${styles.toolButton} ${activeTool === 'duvida' ? styles.active : ''}`}
                            onClick={() => setActiveTool('duvida')}
                        >
                            <img src={questionIcon} alt="dúvida" className={styles.toolIcon} />
                            <span className={styles.toolLabel}>DÚVIDA</span>
                        </button>
                        
                        <div className={styles.divider} />
                        
                        <button 
                            className={`${styles.toolButton} ${activeTool === 'feedback' ? styles.active : ''}`}
                            onClick={() => setActiveTool('feedback')}
                        >
                            <img src={likeIcon} alt="feedback" className={styles.toolIcon} />
                            <span className={styles.toolLabel}>FEEDBACK</span>
                        </button>
                        
                        <div className={styles.divider} />
                        
                        <button 
                            className={`${styles.toolButton} ${activeTool === 'trapaca' ? styles.active : ''}`}
                            onClick={() => setActiveTool('trapaca')}
                        >
                            <img src={diceIcon} alt="trapaça" className={styles.toolIcon} />
                            <span className={styles.toolLabel}>TRAPAÇA</span>
                        </button>

                        {/* Controles Extras Direita (ex: rolar dados, configurações) */}
                        <div className={styles.extraControls}>
                            <div className={styles.controlsGroup}>
                                <img src={rollBackIcon} alt="Rodada anterior" className={styles.extraIcon} />
                                <div className={styles.divider} />
                                <img src={loopIcon} alt="Gerar rodada novamente" className={styles.extraIcon} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Branding */}
                <div className={styles.footerArea}>
                    <div className={styles.brandContainer}>
                        <span className={styles.brandTitle}>FELPINHO's RPG Engine</span>
                        <span className={styles.brandSubtitle}>FORJE SUA PRÓPRIA LENDA</span>
                    </div>
                </div>

            </div>
        </div>
    );
}