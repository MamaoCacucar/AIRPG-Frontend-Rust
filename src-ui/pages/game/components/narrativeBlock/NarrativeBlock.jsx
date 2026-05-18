import styles from './NarrativeBlockStyle.module.css';

export const NarrativeBlock = ({ content, metadata }) => {
    // Função para processar e separar narrativa de diálogos
    const renderContent = () => {
        if (!content) return null;

        // Regex para capturar tudo que está entre aspas duplas (retas ou curvas)
        const regex = /([\"“][^\"”]+[\"”])/g;
        const segments = content.split(regex);

        return segments.map((segment, index) => {
            if (!segment.trim()) return null;

            // Verifica se o segmento é um diálogo (começa e termina com aspas)
            // Usamos [\s\S] para permitir quebras de linha dentro das aspas
            const isDialogue = /^["“][\s\S]*["”]$/.test(segment.trim());

            if (isDialogue) {
                return (
                    <div key={index} className={styles.dialogueWrapper}>
                        <p className={styles.dialogueText}>
                            {segment.trim()}
                        </p>
                    </div>
                );
            }

            // Se for narrativa, divide por quebras de linha reais para múltiplos parágrafos
            const paragraphs = segment.split('\n').filter(p => p.trim() !== '');
            
            return paragraphs.map((p, pIndex) => (
                <div key={`${index}-${pIndex}`} className={styles.paragraphWrapper}>
                    <p className={styles.narrativeText}>
                        {p.trim()}
                    </p>
                </div>
            ));
        });
    };

    return (
        <div className={styles.narrativeContainer}>
            {renderContent()}

            {/* Rodapé: Metadados da Geração exibido de forma condicional */}
            {metadata && (
                <div className={styles.metadataWrapper}>
                    <div className={styles.metadataIconWrapper}>
                        <div className={styles.metadataIcon} />
                    </div>
                    <span className={styles.metadataText}>{metadata}</span>
                </div>
            )}
        </div>
    );
};