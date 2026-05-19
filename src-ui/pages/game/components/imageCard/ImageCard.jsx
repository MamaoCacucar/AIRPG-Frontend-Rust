import styles from './ImageCardStyle.module.css';
import { GlassButton }  from '../glassButton/GlassButton';
import penIcon from '/src-ui/assets/icons/pen.svg'
import loopIcon from '/src-ui/assets/icons/white_loop.svg'


export const ImageCard = ({ imageUrl }) => {
    return (
        <div className={styles.cardContainer}>
            <img 
                className={styles.sceneImage} 
                src={imageUrl || "https://placehold.co/740x416"} 
                alt="Cenário do Jogo" 
            />
            
            <div className={styles.actionsWrapper}>
                {/* Botão 1 - Ícone de Imagem */}
                <GlassButton ariaLabel="Ação Primária">
                    <img className={styles.iconImage} src={penIcon} alt="Editar prompt de imagem e regerar" />
                </GlassButton>

                {/* Botão 2 - Placeholder Quadrado (Referência do seu código original) */}
                <GlassButton ariaLabel="Ação Secundária">
                    <img className={styles.iconImage} src={loopIcon} alt="regerar imagem" />
                </GlassButton>
            </div>
        </div>
    );
};