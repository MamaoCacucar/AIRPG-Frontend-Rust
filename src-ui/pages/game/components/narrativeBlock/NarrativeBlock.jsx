import styles from './NarrativeBlockStyle.module.css';

export const NarrativeBlock = () => {
    return (
        <div className={styles.narrativeContainer}>
            {/* Primeiro Parágrafo */}
            <div className={styles.paragraphWrapper}>
                <p className={styles.narrativeText}>
                    O ar na cobertura do <span className={styles.highlightText}>Setor 7</span> é pesado, saturado com o cheiro metálico de ozônio e chuva ácida. Abaixo de você, a cidade de Obsidiana pulsa como um coração mecânico doente. As luzes de neon cortam a névoa, mas não conseguem iluminar as sombras que se movem entre os dutos de ventilação.
                </p>
            </div>

            {/* Bloco de Diálogo (Falas) */}
            <div className={styles.dialogueWrapper}>
                <p className={styles.dialogueText}>
                    &quot;Você não deveria ter vindo aqui, Cronista. Algumas histórias foram feitas para permanecerem enterradas sob o concreto e o silêncio.&quot;
                </p>
            </div>

            {/* Segundo Parágrafo */}
            <div className={styles.paragraphWrapper}>
                <p className={styles.narrativeText}>
                    Uma figura encapuzada emerge da fumaça, a luz de um holograma publicitário refletindo em uma máscara cibernética reluzente. O som de uma lâmina sendo desembainhada ecoa contra o metal do piso.
                </p>
            </div>

            {/* Rodapé: Metadados da Geração */}
            <div className={styles.metadataWrapper}>
                <div className={styles.metadataIconWrapper}>
                    <div className={styles.metadataIcon} />
                </div>
                <span className={styles.metadataText}>Rodada gerada em 2 minutos e 36 segundos</span>
            </div>
        </div>
    );
};